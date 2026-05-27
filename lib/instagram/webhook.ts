/**
 * Instagram webhook: signature verification + payload type definitions.
 * Meta sends POST requests to our webhook endpoint signed with HMAC-SHA256.
 */

import crypto from "crypto";

// ─── Signature Verification ────────────────────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header from Meta.
 * Must be called BEFORE processing any webhook payload.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signatureHeader) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signatureHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

// ─── Webhook Payload Types ─────────────────────────────────────────────────────

export type WebhookMessageEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
    is_echo?: boolean;   // true = merchant sent this message
  };
  read?: { watermark: number };
};

export type WebhookEntry = {
  id: string;       // The IG Business Account ID
  time: number;
  messaging: WebhookMessageEvent[];
};

export type WebhookPayload = {
  object: "instagram" | "page";
  entry: WebhookEntry[];
};

/**
 * Parse a raw webhook body string into a typed payload.
 * Returns null if the payload is malformed or not an Instagram event.
 */
export function parseWebhookPayload(rawBody: string): WebhookPayload | null {
  try {
    const payload = JSON.parse(rawBody) as WebhookPayload;

    if (payload.object !== "instagram" && payload.object !== "page") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract all real (non-echo) customer message events from a webhook payload.
 * Skips read receipts and echo messages (sent by the merchant).
 */
export function extractMessageEvents(
  payload: WebhookPayload,
): Array<{
  merchantIgId: string;
  customerIgId: string;
  messageId: string;
  text: string | null;
  attachmentUrl: string | null;
  messageType: string;
  timestamp: Date;
}> {
  const events: ReturnType<typeof extractMessageEvents> = [];

  for (const entry of payload.entry) {
    if (!entry.messaging) continue;

    for (const event of entry.messaging) {
      // Skip read receipts
      if (!event.message) continue;
      // Skip echo messages (merchant's own messages handled separately)
      if (event.message.is_echo) continue;

      const attachment = event.message.attachments?.[0];
      const attachmentUrl = attachment?.payload?.url ?? null;
      const messageType = attachment ? attachment.type : "text";

      events.push({
        merchantIgId: entry.id,
        customerIgId: event.sender.id,
        messageId: event.message.mid,
        text: event.message.text ?? null,
        attachmentUrl,
        messageType,
        timestamp: new Date(event.timestamp),
      });
    }
  }

  return events;
}
