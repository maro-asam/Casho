"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { LoginState } from "./auth.types";
import { loginSchema } from "@/validations/auth.schema";
import { getFieldErrors } from "@/lib/zod";
import { createUserSession } from "@/lib/auth/session";

export async function LoginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const rawData = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return {
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return {
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      };
    }

    await createUserSession(user.id);

    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح جاري التحويل...",
    };
  } catch (error) {
    console.error("LoginAction error:", error);

    return {
      error: "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى",
    };
  }
}