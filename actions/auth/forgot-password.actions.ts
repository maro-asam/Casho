"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/validations/auth.schema";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/helpers/password-reset";
import { sendPasswordResetEmail } from "@/helpers/send-reset-email";
import { hashPassword } from "@/lib/auth/password";
import { logSecurityEvent } from "@/lib/auth/security-log";

type ForgotPasswordState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: { email?: string };
};

type ResetPasswordState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: { password?: string; confirmPassword?: string; token?: string };
};

async function getIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

// Max 3 reset requests per email per hour
async function isResetRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.passwordResetToken.count({
    where: { userId, createdAt: { gte: since } },
  });
  return count >= 3;
}

export async function ForgotPasswordAction(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const rawData = { email: formData.get("email")?.toString() ?? "" };
  const parsed = forgotPasswordSchema.safeParse(rawData);
  const ipAddress = await getIp();

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: { email: fieldErrors.email?.[0] },
    };
  }

  const { email } = parsed.data;
  const GENERIC_MESSAGE = "لو البريد الإلكتروني موجود، هتلاقي رسالة لإعادة تعيين كلمة المرور.";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return { success: true, message: GENERIC_MESSAGE };
  }

  // Rate limit: max 3 requests per hour per account
  if (await isResetRateLimited(user.id)) {
    return { success: true, message: GENERIC_MESSAGE };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://casho.store";
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail(user.email, resetLink);

  logSecurityEvent({
    event: "PASSWORD_RESET_REQUESTED",
    userId: user.id,
    ipAddress,
    metadata: { email },
  });

  return { success: true, message: GENERIC_MESSAGE };
}

export async function ResetPasswordAction(
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const rawData = {
    token: formData.get("token")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  };

  const parsed = resetPasswordSchema.safeParse(rawData);
  const ipAddress = await getIp();

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: {
        token: fieldErrors.token?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashPasswordResetToken(token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) {
    return { error: "رابط إعادة التعيين غير صالح أو منتهي." };
  }

  if (resetRecord.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({ where: { tokenHash } });
    return { error: "رابط إعادة التعيين منتهي الصلاحية." };
  }

  // argon2id — consistent with register
  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword, passwordAlgo: "argon2id" },
    });
    await tx.passwordResetToken.delete({ where: { tokenHash } });
    // Invalidate ALL active sessions after password change
    await tx.session.deleteMany({ where: { userId: resetRecord.userId } });
  });

  logSecurityEvent({
    event: "PASSWORD_RESET_COMPLETED",
    userId: resetRecord.userId,
    ipAddress,
  });

  return {
    success: true,
    message: "تم تغيير كلمة المرور بنجاح. سجل دخولك الآن.",
  };
}
