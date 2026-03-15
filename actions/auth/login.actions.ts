"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

type LoginState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function LoginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    (await cookies()).set("sessionToken", user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح",
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "حدث خطأ ما، حاول مرة أخرى" };
  }
}
