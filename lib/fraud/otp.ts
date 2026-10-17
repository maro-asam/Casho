// Phone-code confirmation through Twilio Verify (it owns code generation,
// expiry, attempt limits and the WhatsApp/SMS templates).
//
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID,
//      TWILIO_VERIFY_CHANNELS (optional, default "whatsapp,sms" — tried in order).

import Twilio from "twilio";
import { toE164 } from "./phone";

function client() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) return null;
  return { api: Twilio(sid, token).verify.v2.services(service) };
}

export function isOtpConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
}

function channels() {
  const list = (process.env.TWILIO_VERIFY_CHANNELS ?? "whatsapp,sms")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c === "whatsapp" || c === "sms");
  return list.length ? list : ["sms"];
}

/** Sends a code; falls back to the next channel when one fails. */
export async function sendOrderOtp(phone: string): Promise<{ ok: true; channel: string } | { ok: false }> {
  const c = client();
  if (!c) return { ok: false };
  for (const channel of channels()) {
    try {
      await c.api.verifications.create({ to: toE164(phone), channel, locale: "ar" });
      return { ok: true, channel };
    } catch (error) {
      console.error(`[otp] ${channel} send failed`, error);
    }
  }
  return { ok: false };
}

export async function checkOrderOtp(phone: string, code: string): Promise<boolean> {
  const c = client();
  if (!c || !/^\d{4,10}$/.test(code)) return false;
  try {
    const check = await c.api.verificationChecks.create({ to: toE164(phone), code });
    return check.status === "approved";
  } catch (error) {
    // Expired / too many attempts / unknown → not approved.
    console.error("[otp] check failed", error);
    return false;
  }
}
