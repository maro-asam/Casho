import { createHmac, timingSafeEqual } from "crypto";

/**
 * Sign a payload for webhook delivery.
 * Signature = HMAC-SHA256(`${timestampSeconds}.${body}`, secret)
 */
export function signPayload(body: string, secret: string, timestampSeconds: number): string {
  const mac = createHmac("sha256", secret)
    .update(`${timestampSeconds}.${body}`)
    .digest("hex");
  return `sha256=${mac}`;
}

/**
 * Verify an inbound webhook signature (e.g., from a provider).
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifySignature(
  body: string,
  signature: string,
  secret: string,
  timestampSeconds: number,
): boolean {
  const expected = signPayload(body, secret, timestampSeconds);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Build HMAC signature headers for outbound webhook requests.
 */
export function buildWebhookHeaders(
  body: string,
  secret: string,
  deliveryId: string,
  event: string,
): HeadersInit {
  const ts = Math.floor(Date.now() / 1000);
  return {
    "Content-Type": "application/json",
    "X-Casho-Signature": signPayload(body, secret, ts),
    "X-Casho-Timestamp": String(ts),
    "X-Casho-Delivery": deliveryId,
    "X-Casho-Event": event,
    "User-Agent": "Casho-Webhook/1.0",
  };
}
