"use server";

import { z } from "zod";

import { requireAuth } from "./require.actions";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/auth/security-log";
import { maskEmail, sendVerificationCode, verifyCode, type SendCodeResult } from "@/lib/auth/email-verification";

export type VerifyEmailState = { success?: boolean; error?: string };

export type SendCodeState = { ok: boolean; message: string; retryIn?: number; maskedEmail?: string };

function sendMessage(result: SendCodeResult): string {
  if (result.ok) return "بعتنالك كود جديد.";
  switch (result.reason) {
    case "cooldown":
      return `استنى ${result.retryIn} ثانية وابعت تاني.`;
    case "limit":
      return "بعتنا أكواد كتير الساعة دي. جرّب تاني بعد شوية.";
    case "verified":
      return "إيميلك متأكد بالفعل.";
    default:
      return "مقدرناش نبعت الإيميل دلوقتي. جرّب تاني بعد دقيقة.";
  }
}

export async function VerifyEmailCodeAction(_prev: VerifyEmailState | null, formData: FormData): Promise<VerifyEmailState> {
  const user = await requireAuth();
  const result = await verifyCode(user.id, formData.get("code")?.toString() ?? "");

  if (result.ok) {
    logSecurityEvent({ event: "EMAIL_VERIFIED", userId: user.id, metadata: { email: user.email } });
    return { success: true };
  }

  switch (result.reason) {
    case "invalid":
      return { error: "اكتب الكود كامل — 6 أرقام." };
    case "wrong":
      return {
        error:
          result.attemptsLeft === 1
            ? "الكود مش صح. فاضلك محاولة واحدة، وبعدها هتحتاج كود جديد."
            : `الكود مش صح. فاضلك ${result.attemptsLeft} محاولات.`,
      };
    case "locked":
      return { error: "حاولت كتير بالكود ده. ابعت كود جديد." };
    default:
      return { error: "الكود ده خلص وقته. ابعت كود جديد." };
  }
}

export async function ResendEmailCodeAction(): Promise<SendCodeState> {
  const user = await requireAuth();
  const result = await sendVerificationCode(user.id);
  return { ok: result.ok, message: sendMessage(result), retryIn: result.retryIn };
}

const changeEmailSchema = z.object({
  email: z.string().trim().min(1, "اكتب الإيميل").email("الإيميل غير صحيح").max(254, "الإيميل طويل جدًا").transform((v) => v.toLowerCase()),
});

/** Fixes a typo'd signup email — only while it's still unconfirmed — and sends a code there. */
export async function ChangeSignupEmailAction(_prev: SendCodeState | null, formData: FormData): Promise<SendCodeState> {
  const user = await requireAuth();
  const parsed = changeEmailSchema.safeParse({ email: formData.get("email")?.toString() ?? "" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "الإيميل غير صحيح" };

  const { email } = parsed.data;
  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerified: true } });
  if (!account || account.emailVerified) return { ok: false, message: "إيميلك متأكد بالفعل." };
  if (email === account.email) return { ok: false, message: "ده نفس الإيميل الحالي." };

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { ok: false, message: "الإيميل ده مستخدم في حساب تاني." };

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { email } }),
      // Codes sent to the old address must not confirm the new one. Expired, not
      // deleted, so they still count toward the send limit.
      prisma.emailVerificationCode.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date() } }),
    ]);
  } catch {
    return { ok: false, message: "الإيميل ده مستخدم في حساب تاني." };
  }
  logSecurityEvent({ event: "EMAIL_CHANGED", userId: user.id, metadata: { from: account.email, to: email } });

  const result = await sendVerificationCode(user.id);
  return {
    ok: true,
    message: result.ok ? "غيّرنا الإيميل وبعتنالك كود عليه." : `غيّرنا الإيميل. ${sendMessage(result)}`,
    retryIn: result.retryIn,
    maskedEmail: maskEmail(email),
  };
}
