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

/**
 * Process all deliveries that are due for retry.
 * Call this from a cron job (e.g., every minute via /api/internal/webhooks/process).
 */
export async function processRetryQueue(batchSize = 50): Promise<number> {
  const due = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextRetryAt: { lte: new Date() },
    },
    select: { id: true },
    take: batchSize,
    orderBy: { nextRetryAt: "asc" },
  });

  if (due.length === 0) return 0;

  await Promise.allSettled(due.map((d) => processDelivery(d.id)));
  return due.length;
}
