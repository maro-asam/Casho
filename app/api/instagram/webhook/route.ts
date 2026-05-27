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
 *   - Always returns 200 immediately; processing is fire-and-forget
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

  // Fire-and-forget — never block the 200 response
  void processEvents(messageEvents);

  return new NextResponse("OK", { status: 200 });
}

// ─── Background processing ─────────────────────────────────────────────────────

type MessageEvent = {
  merchantIgId: string;
  customerIgId: string;
  messageId: string;
  text: string | null;
  attachmentUrl: string | null;
  messageType: string;
  timestamp: Date;
};

async function processEvents(events: MessageEvent[]) {
  for (const event of events) {
    try {
      // ── Replay protection ──────────────────────────────────────────────────
      // IgProcessedWebhookEvent has a @unique on eventKey — the upsert either
      // creates (new event) or does nothing (already processed).
      const existing = await prisma.igProcessedWebhookEvent.findUnique({
        where: { eventKey: event.messageId },
        select: { id: true },
      });

      if (existing) {
        logger.debug("[Webhook] Duplicate event — skipped", { messageId: event.messageId });
        continue;
      }

      // Mark as processed BEFORE doing work to prevent concurrent duplicates
      await prisma.igProcessedWebhookEvent.create({
        data: { eventKey: event.messageId },
      });

      await upsertWebhookMessage(event);

      logger.debug("[Webhook] Event processed", {
        messageId: event.messageId,
        messageType: event.messageType,
      });
    } catch (err) {
      logger.error("[Webhook] Failed to process event", {
        messageId: event.messageId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
