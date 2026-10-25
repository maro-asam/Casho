// Email confirmation for email/password signups: a 6-digit code is emailed,
// and the app stays locked (requireVerifiedEmail) until it's entered. Accounts
// created before this existed (mustVerifyEmail = false) are never locked.
//
// Codes: only an HMAC is stored; each lives 10 minutes and allows 5 wrong
// guesses. Sending: one per minute, five per hour.

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";

import { isMailConfigured, sendMail } from "@/lib/mail";
import { codeBlock, renderEmail } from "@/lib/notifications/email/layout";
import { prisma } from "@/lib/prisma";
import { CODE_LENGTH, normalizeCode } from "./verification-code";

export { CODE_LENGTH, normalizeCode };

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

/** Where a confirmed account goes next. */
export const AFTER_VERIFY_PATH = "/onboarding";

export function generateCode() {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

export function hashCode(userId: string, code: string) {
  const pepper = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || "casho-email-verification";
  return createHmac("sha256", pepper).update(`${userId}:${code}`).digest("hex");
}

export function needsEmailVerification(user: { emailVerified: boolean; mustVerifyEmail: boolean }) {
  return user.mustVerifyEmail && !user.emailVerified;
}

/** Layout gate: unconfirmed new accounts only get to /verify-email. */
export async function requireVerifiedEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, mustVerifyEmail: true } });
  if (user && needsEmailVerification(user)) redirect("/verify-email");
}

/** "ma•••@gmail.com" — enough to recognise, not enough to harvest. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const shown = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${shown}${"•".repeat(Math.min(Math.max(local.length - shown.length, 1), 5))}@${domain}`;
}

export function buildVerificationEmail(code: string, appUrl: string) {
  const html = renderEmail({
    brand: { name: "كاشو", logo: null, accent: "#1447e6", url: appUrl },
    preheader: `كود التأكيد: ${code}`,
    heading: "أكّد إيميلك",
    intro: "اكتب الكود ده في كاشو علشان تكمّل إنشاء متجرك. الكود صالح لمدة 10 دقايق.",
    body: codeBlock(code),
    footer: "لو إنت معملتش حساب على كاشو، تجاهل الإيميل ده ومحدش هيقدر يستخدم إيميلك.",
  });
  const text = `كود تأكيد إيميلك على كاشو: ${code}\nالكود صالح لمدة 10 دقايق.`;
  return { subject: `${code} هو كود تأكيد إيميلك على كاشو`, html, text };
}

/** What the verify page needs: is there a code to type, and how long until "send again" works. */
export async function getCodeStatus(userId: string) {
  const latest = await prisma.emailVerificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, expiresAt: true },
  });
  const now = Date.now();
  return {
    hasActiveCode: !!latest && latest.expiresAt.getTime() > now,
    retryIn: latest ? Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - (now - latest.createdAt.getTime()) / 1000)) : 0,
  };
}

export type SendCodeResult =
  | { ok: true; retryIn: number }
  | { ok: false; reason: "cooldown" | "limit" | "unavailable" | "failed" | "verified"; retryIn?: number };

/** Emails a fresh code (older ones stop working). Safe to call repeatedly — it rate-limits itself. */
export async function sendVerificationCode(userId: string): Promise<SendCodeResult> {
  if (!isMailConfigured()) return { ok: false, reason: "unavailable" };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!user) return { ok: false, reason: "failed" };
  if (user.emailVerified) return { ok: false, reason: "verified" };

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.emailVerificationCode.findMany({
    where: { userId, createdAt: { gte: hourAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const sinceLast = recent[0] ? (Date.now() - recent[0].createdAt.getTime()) / 1000 : Infinity;
  if (sinceLast < RESEND_COOLDOWN_SECONDS) {
    return { ok: false, reason: "cooldown", retryIn: Math.ceil(RESEND_COOLDOWN_SECONDS - sinceLast) };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    const oldest = recent[recent.length - 1].createdAt.getTime();
    return { ok: false, reason: "limit", retryIn: Math.ceil((oldest + 60 * 60 * 1000 - Date.now()) / 1000) };
  }

  const code = generateCode();
  await prisma.emailVerificationCode.create({
    data: { userId, codeHash: hashCode(userId, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  try {
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://casho.store";
    await sendMail({ ...buildVerificationEmail(code, appUrl), to: user.email, fromName: "كاشو" });
  } catch (error) {
    console.error("[email-verification] send", error);
    return { ok: false, reason: "failed" };
  }
  return { ok: true, retryIn: RESEND_COOLDOWN_SECONDS };
}

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "locked" | "wrong"; attemptsLeft?: number };

/** Checks against the newest code only; a match confirms the email and clears the codes. */
export async function verifyCode(userId: string, rawCode: string): Promise<VerifyCodeResult> {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) return { ok: false, reason: "invalid" };

  const latest = await prisma.emailVerificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, attempts: true, expiresAt: true },
  });
  if (!latest || latest.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (latest.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  const expected = Buffer.from(latest.codeHash, "hex");
  const given = Buffer.from(hashCode(userId, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    // Conditional increment: concurrent guesses can't slip past the limit.
    await prisma.emailVerificationCode.updateMany({
      where: { id: latest.id, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    const attemptsLeft = MAX_ATTEMPTS - latest.attempts - 1;
    return attemptsLeft > 0 ? { ok: false, reason: "wrong", attemptsLeft } : { ok: false, reason: "locked" };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
    prisma.emailVerificationCode.deleteMany({ where: { userId } }),
  ]);
  return { ok: true };
}
