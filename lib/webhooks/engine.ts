import { prisma } from "@/lib/prisma";
import { buildWebhookHeaders } from "@/lib/api/signature";

// Exponential backoff schedule (seconds): 30s → 5m → 30m → 2h → 8h
const RETRY_DELAYS_SECONDS = [30, 300, 1800, 7200, 28800];

function nextRetryDelay(attempt: number): number {
  return RETRY_DELAYS_SECONDS[attempt] ?? RETRY_DELAYS_SECONDS.at(-1)!;
}

/**
 * Attempt to deliver a single WebhookDelivery record.
 * Updates the record with the result (success, failed, dead_letter).
 */
export async function processDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: { select: { url: true, secret: true, status: true } } },
  });

  if (!delivery) return;
  if (delivery.status === "SUCCESS" || delivery.status === "DEAD_LETTER") return;
  if (delivery.endpoint.status === "DISABLED") {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: "DEAD_LETTER", error: "Endpoint disabled" },
    });
    return;
  }

  const body = JSON.stringify(delivery.payload);
  const headers = buildWebhookHeaders(
    body,
    delivery.endpoint.secret,
    delivery.id,
    delivery.event,
  );

  const attempt = delivery.attempts + 1;
  let responseCode: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;
  let success = false;

  try {
    const res = await fetch(delivery.endpoint.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15_000),
    });

    responseCode = res.status;
    responseBody = (await res.text()).slice(0, 1000);
    success = res.status >= 200 && res.status < 300;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const isDead = !success && attempt >= delivery.maxAttempts;
  const nextRetry = success || isDead
    ? null
    : new Date(Date.now() + nextRetryDelay(attempt) * 1000);

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      attempts: attempt,
      lastAttemptAt: new Date(),
      lastResponseCode: responseCode,
      lastResponseBody: responseBody,
      error,
      status: success ? "SUCCESS" : isDead ? "DEAD_LETTER" : "FAILED",
      deliveredAt: success ? new Date() : null,
      nextRetryAt: nextRetry,
    },
  });
}

/** How long a claimed delivery is hidden from other runs (well above the 15s send timeout). */
export const CLAIM_LEASE_MS = 2 * 60 * 1000;

/**
 * Atomically takes a due delivery for this run by pushing its nextRetryAt past
 * the lease. Two overlapping cron runs can both list the same row, but only one
 * update matches, so only one of them sends it. If the run dies mid-send the
 * lease simply expires and the delivery is due again (processDelivery always
 * rewrites nextRetryAt when it finishes).
 */
export async function claimDelivery(deliveryId: string, now = new Date()): Promise<boolean> {
  const claimed = await prisma.webhookDelivery.updateMany({
    where: {
      id: deliveryId,
      status: { in: ["PENDING", "FAILED"] },
      nextRetryAt: { lte: now },
    },
    data: { nextRetryAt: new Date(now.getTime() + CLAIM_LEASE_MS) },
  });
  return claimed.count === 1;
}

/**
 * Process all deliveries that are due for retry.
 * Call this from a cron job (e.g., every minute via /api/internal/webhooks/process).
 * Returns how many this run actually claimed and attempted.
 */
export async function processRetryQueue(batchSize = 50): Promise<number> {
  const now = new Date();
  const due = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextRetryAt: { lte: now },
    },
    select: { id: true },
    take: batchSize,
    orderBy: { nextRetryAt: "asc" },
  });

  if (due.length === 0) return 0;

  const results = await Promise.allSettled(
    due.map(async (d) => {
      if (!(await claimDelivery(d.id, now))) return false;
      await processDelivery(d.id);
      return true;
    }),
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}
