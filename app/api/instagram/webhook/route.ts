/**
 * Instagram Webhook endpoint.
 *
 * GET  /api/instagram/webhook  → Meta verification challenge
 * POST /api/instagram/webhook  → Receive message events
 *
 * Hardening:
 *   - HMAC-SHA256 signature verification
 *   - Replay protection via IgProcessedWebhookEvent (deduplicates igMessageId)
 *   - Feature flag guard
 *   - Structured logging
 *   - Events are stored before the response (only DB writes — the AI work is
 *     queued as IgProcessingJob). Work left running after the response could
 *     be cut off on serverless, and an event marked processed but never stored
 *     was lost for good. A failure now answers 500 so Meta redelivers; events
 *     already stored are skipped as duplicates on the retry.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  extractMessageEvents,
} from "@/lib/instagram/webhook";
import { upsertWebhookMessage } from "@/lib/instagram/sync";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { featureFlags } from "@/lib/feature-flags";

// ─── GET — Webhook Verification ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    logger.info("[Webhook] Verification challenge accepted");
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn("[Webhook] Verification challenge rejected", { mode, tokenMatch: token === verifyToken });
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Receive Events ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Feature flag guard — if disabled, acknowledge but do nothing
  if (!featureFlags.instagramAiOrders()) {
    logger.info("[Webhook] Feature disabled — ignoring event");
    return new NextResponse("OK", { status: 200 });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("[Webhook] Invalid HMAC signature — rejected", {
      signaturePresent: !!signature,
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) {
    logger.warn("[Webhook] Could not parse payload");
    return new NextResponse("OK", { status: 200 });
  }

  const messageEvents = extractMessageEvents(payload);

  logger.info("[Webhook] Received events", { eventCount: messageEvents.length });

  const failed = await processEvents(messageEvents);
  if (failed > 0) {
    return new NextResponse("Retry", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}

// ─── Processing ────────────────────────────────────────────────────────────────

type MessageEvent = {
  merchantIgId: string;
  customerIgId: string;
  messageId: string;
  text: string | null;
  attachmentUrl: string | null;
  messageType: string;
  timestamp: Date;
};

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

/** Stores each new event once. Returns how many failed (and can be redelivered). */
async function processEvents(events: MessageEvent[]): Promise<number> {
  let failed = 0;
  for (const event of events) {
    // ── Replay protection ────────────────────────────────────────────────────
    // IgProcessedWebhookEvent.eventKey is @unique: creating the marker claims
    // the event, so a concurrent or repeated delivery of it is skipped.
    try {
      await prisma.igProcessedWebhookEvent.create({
        data: { eventKey: event.messageId },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        logger.debug("[Webhook] Duplicate event — skipped", { messageId: event.messageId });
        continue;
      }
      failed++;
      logger.error("[Webhook] Could not record event", {
        messageId: event.messageId,
        err: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    try {
      await upsertWebhookMessage(event);

      logger.debug("[Webhook] Event processed", {
        messageId: event.messageId,
        messageType: event.messageType,
      });
    } catch (err) {
      failed++;
      logger.error("[Webhook] Failed to process event", {
        messageId: event.messageId,
        err: err instanceof Error ? err.message : String(err),
      });
      // Release the claim so Meta's redelivery can store it.
      await prisma.igProcessedWebhookEvent
        .deleteMany({ where: { eventKey: event.messageId } })
        .catch(() => {});
    }
  }
  return failed;
}
