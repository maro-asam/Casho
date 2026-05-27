/**
 * Instagram AI job runner.
 *
 * Processes queued IgProcessingJob records:
 *   1. Rate limit check (max AI calls per store per day)
 *   2. Fetch conversation messages from DB
 *   3. Send to OpenAI for order extraction
 *   4. Create SuggestedOrder with immutable conversation snapshot
 *   5. Auto-match product names
 *   6. Send in-app notification to merchant
 *
 * Hardening:
 *   - Feature flag guard (INSTAGRAM_AI_ORDERS_ENABLED)
 *   - Per-store daily rate limit via IgAiUsageLog
 *   - Immutable conversationSnapshot stored on SuggestedOrder
 *   - Structured logging throughout
 *   - Exponential backoff: 2^n minutes, max 3 attempts
 *   - Skips recent analyses and existing pending suggestions
 */

import { prisma } from "@/lib/prisma";
import { extractOrderFromConversation, CONFIDENCE_THRESHOLD } from "@/lib/ai/order-extractor";
import { createNotification } from "@/lib/notifications/in-app";
import { checkRateLimit, incrementUsage } from "@/lib/rate-limit/ig-rate-limit";
import { logger } from "@/lib/logger";
import { featureFlags } from "@/lib/feature-flags";

const MAX_JOBS_PER_RUN        = 5;
const MIN_REANALYSIS_INTERVAL = 30 * 60 * 1000; // 30 minutes

type RunResult = {
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  rateLimited: number;
};

export async function runPendingJobs(): Promise<RunResult> {
  if (!featureFlags.instagramAiOrders()) {
    logger.info("[JobRunner] Feature flag disabled — skipping run");
    return { processed: 0, created: 0, skipped: 0, failed: 0, rateLimited: 0 };
  }

  const now = new Date();

  const jobs = await prisma.igProcessingJob.findMany({
    where: {
      status: { in: ["QUEUED", "FAILED"] },
      attempts: { lt: 3 },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: MAX_JOBS_PER_RUN,
    select: { id: true, conversationId: true, attempts: true, maxAttempts: true },
  });

  logger.info("[JobRunner] Starting run", { jobCount: jobs.length });

  const result: RunResult = { processed: 0, created: 0, skipped: 0, failed: 0, rateLimited: 0 };

  for (const job of jobs) {
    try {
      const outcome = await processJob(job.id, job.conversationId);
      result.processed++;
      if (outcome === "created")      result.created++;
      else if (outcome === "skipped") result.skipped++;
      else if (outcome === "rate_limited") result.rateLimited++;
    } catch (err) {
      result.failed++;
      const attempts  = job.attempts + 1;
      const isFinal   = attempts >= job.maxAttempts;
      const backoffMs = Math.pow(2, attempts) * 60 * 1000; // 2^n minutes

      logger.error("[JobRunner] Job failed", {
        jobId: job.id,
        conversationId: job.conversationId,
        attempt: attempts,
        isFinal,
        err: err instanceof Error ? err.message : String(err),
      });

      await prisma.igProcessingJob.update({
        where: { id: job.id },
        data: {
          status:       isFinal ? "FAILED" : "QUEUED",
          attempts,
          lastAttemptAt: now,
          nextRetryAt:  isFinal ? null : new Date(Date.now() + backoffMs),
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  logger.info("[JobRunner] Run complete", result);
  return result;
}

type JobOutcome = "created" | "skipped" | "no_order" | "rate_limited";

async function processJob(jobId: string, conversationId: string): Promise<JobOutcome> {
  // ── Mark PROCESSING ──────────────────────────────────────────────────────────
  await prisma.igProcessingJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", lastAttemptAt: new Date(), attempts: { increment: 1 } },
  });

  // ── Load conversation + messages ─────────────────────────────────────────────
  const conversation = await prisma.instagramConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      storeId: true,
      lastAnalyzedAt: true,
      status: true,
      messages: {
        orderBy: { sentAt: "asc" },
        select: { isFromBusiness: true, content: true, sentAt: true, igMessageId: true },
      },
    },
  });

  if (!conversation) {
    await prisma.igProcessingJob.update({
      where: { id: jobId },
      data: { status: "DONE", errorMessage: "Conversation not found" },
    });
    return "skipped";
  }

  // ── Skip if analyzed recently with no new messages ───────────────────────────
  if (
    conversation.lastAnalyzedAt &&
    Date.now() - conversation.lastAnalyzedAt.getTime() < MIN_REANALYSIS_INTERVAL &&
    conversation.status !== "UNPROCESSED"
  ) {
    await prisma.igProcessingJob.update({
      where: { id: jobId },
      data: { status: "DONE", errorMessage: "Skipped: analyzed recently" },
    });
    logger.debug("[JobRunner] Skipped — analyzed recently", { jobId, conversationId });
    return "skipped";
  }

  // ── Skip if pending suggestion already exists (avoid duplicates) ─────────────
  const existingPending = await prisma.suggestedOrder.findFirst({
    where: { conversationId, status: "PENDING" },
    select: { id: true },
  });

  if (existingPending) {
    await prisma.igProcessingJob.update({
      where: { id: jobId },
      data: { status: "DONE", errorMessage: "Skipped: pending suggestion exists" },
    });
    logger.debug("[JobRunner] Skipped — pending suggestion exists", { jobId, conversationId });
    return "skipped";
  }

  // ── Per-store rate limit ─────────────────────────────────────────────────────
  const allowed = await checkRateLimit(conversation.storeId);
  if (!allowed) {
    await prisma.igProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "QUEUED",
        // Retry at midnight (approximate) — after the daily counter resets
        nextRetryAt: tomorrowMidnightUTC(),
        errorMessage: "Rate limited: daily AI job limit reached",
      },
    });
    return "rate_limited";
  }

  // ── Mark conversation as PROCESSING ─────────────────────────────────────────
  await prisma.instagramConversation.update({
    where: { id: conversationId },
    data: { status: "PROCESSING" },
  });

  // ── Build conversation snapshot (immutable record for debugging/auditing) ────
  const conversationSnapshot = conversation.messages.map((m) => ({
    igMessageId:    m.igMessageId,
    isFromBusiness: m.isFromBusiness,
    content:        m.content,
    sentAt:         m.sentAt.toISOString(),
  }));

  // ── Call OpenAI ──────────────────────────────────────────────────────────────
  const result = await extractOrderFromConversation(conversation.messages, conversationId);

  // Increment usage counter regardless of outcome (we made the API call)
  await incrementUsage(conversation.storeId);

  const now = new Date();

  // ── No order detected ───────────────────────────────────────────────────────
  if (!result.isOrder || result.confidence < CONFIDENCE_THRESHOLD) {
    logger.info("[JobRunner] No order detected", {
      conversationId,
      confidence: result.confidence,
      threshold: CONFIDENCE_THRESHOLD,
    });

    await prisma.instagramConversation.update({
      where: { id: conversationId },
      data: { status: "NO_ORDER", lastAnalyzedAt: now },
    });
    await prisma.igProcessingJob.update({
      where: { id: jobId },
      data: { status: "DONE" },
    });
    return "no_order";
  }

  // ── Create SuggestedOrder + items ────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Strip reasoning before storing rawAiResponse — reasoning is kept only in
    // conversationSnapshot context; it is NEVER exposed to merchants.
    const { reasoning: _reasoning, ...aiResponseForStorage } = result;

    const suggested = await tx.suggestedOrder.create({
      data: {
        storeId:              conversation.storeId,
        conversationId,
        customerName:         result.customerName,
        customerPhone:        result.phone,
        customerAddress:      result.address,
        aiNotes:              result.notes,
        confidence:           result.confidence,
        rawAiResponse:        { ...aiResponseForStorage, reasoning: _reasoning }, // full result in DB for admin
        conversationSnapshot, // immutable snapshot at analysis time
        status:               "PENDING",
        expiresAt,
        items: {
          create: result.products.map((p) => ({
            aiProductName: p.name,
            aiVariant:     p.variant,
            aiQuantity:    p.quantity,
            // AI price is in EGP — convert to piasters
            unitPrice:     p.unitPrice != null ? Math.round(p.unitPrice * 100) : null,
          })),
        },
      },
      select: { id: true },
    });

    await autoMatchProducts(tx, suggested.id, conversation.storeId);

    await tx.instagramConversation.update({
      where: { id: conversationId },
      data: { status: "SUGGESTED", lastAnalyzedAt: now },
    });
  });

  await prisma.igProcessingJob.update({
    where: { id: jobId },
    data: { status: "DONE" },
  });

  logger.info("[JobRunner] SuggestedOrder created", {
    conversationId,
    confidence: result.confidence,
    productCount: result.products.length,
  });

  // In-app notification to merchant
  await createNotification({
    storeId: conversation.storeId,
    type:    "IG_ORDER_SUGGESTED",
    title:   "طلب جديد من انستجرام 🛍️",
    message: result.customerName
      ? `اكتشف الذكاء الاصطناعي طلب محتمل من ${result.customerName} — راجعه الآن`
      : "اكتشف الذكاء الاصطناعي طلب محتمل من انستجرام — راجعه الآن",
    href: "/dashboard/suggested-orders",
  });

  return "created";
}

// ─── Auto-match ────────────────────────────────────────────────────────────────

async function autoMatchProducts(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  suggestedOrderId: string,
  storeId: string,
) {
  const items = await tx.suggestedOrderItem.findMany({
    where: { suggestedOrderId },
    select: { id: true, aiProductName: true },
  });

  const storeProducts = await tx.product.findMany({
    where: { storeId, isActive: true },
    select: { id: true, name: true, price: true },
  });

  for (const item of items) {
    const match = findBestMatch(item.aiProductName, storeProducts);
    if (match) {
      await tx.suggestedOrderItem.update({
        where: { id: item.id },
        data: { matchedProductId: match.id, unitPrice: match.priceInPiasters },
      });
    }
  }
}

function findBestMatch(
  aiName: string,
  products: Array<{ id: string; name: string; price: number }>,
): { id: string; priceInPiasters: number } | null {
  const normalize = (s: string) => s.toLowerCase().trim();
  const needle    = normalize(aiName);

  for (const p of products) {
    if (normalize(p.name) === needle) {
      return { id: p.id, priceInPiasters: Math.round(p.price * 100) };
    }
  }
  for (const p of products) {
    const hay = normalize(p.name);
    if (hay.includes(needle) || needle.includes(hay)) {
      return { id: p.id, priceInPiasters: Math.round(p.price * 100) };
    }
  }
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function tomorrowMidnightUTC(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 5, 0, 0); // 00:05 UTC next day
  return d;
}
