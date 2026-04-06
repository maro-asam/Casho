"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/validations/auth.schema";
import { generatePasswordResetToken, hashPasswordResetToken } from "@/helpers/password-reset";

type ForgotPasswordState = {
  success?: boolean;
  message?: string;
  error?: string;
  resetLink?: string;
  fieldErrors?: {
    email?: string;
  };
};

type ResetPasswordState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: {
    password?: string;
    confirmPassword?: string;
    token?: string;
  };
};

export async function ForgotPasswordAction(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const rawData = {
    email: formData.get("email")?.toString() ?? "",
  };

  const parsed = forgotPasswordSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: {
        email: fieldErrors.email?.[0],
      },
    };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // نفس الرسالة سواء الإيميل موجود أو لا
  if (!user) {
    return {
      success: true,
      message: "لو البريد الإلكتروني موجود، هتلاقي رابط استرجاع كلمة المرور.",
    };
  }

  // امسح أي توكنات قديمة للمستخدم
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 دقيقة

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

  // حالياً بنرجعه عشان تستخدمه لحد ما توصل خدمة الإيميل
  // بعدين تقدر تبعته بالإيميل بدل ما يظهر في الواجهة
  return {
    success: true,
    message: "تم إنشاء رابط إعادة تعيين كلمة المرور.",
    resetLink,
  };
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
    return {
      error: "رابط إعادة التعيين غير صالح أو منتهي.",
    };
  }

  if (resetRecord.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({
      where: { tokenHash },
    });

    return {
      error: "رابط إعادة التعيين منتهي الصلاحية.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: {
        password: hashedPassword,
      },
    });

    await tx.passwordResetToken.delete({
      where: { tokenHash },
    });

    // اختياري: تسجيل خروج كل الأجهزة القديمة
    await tx.session.deleteMany({
      where: { userId: resetRecord.userId },
    });
  });

  return {
    success: true,
    message: "تم تغيير كلمة المرور بنجاح. سجل دخولك الآن.",
  };
}
