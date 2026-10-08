import crypto from "crypto";

/** X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256(rawBody, clientSecret)). */
export function verifyWebhookHmac(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
