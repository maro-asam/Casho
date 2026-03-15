"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { transliterate } from "@/lib/utils";

type RegisterState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: {
    storeName?: string;
    email?: string;
    password?: string;
  };
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSlug(value: string) {
  return transliterate(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function RegisterAction(
  _prevState: RegisterState | null,
  formData: FormData,
): Promise<RegisterState> {
  const storeName = formData.get("storeName")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const password = formData.get("password")?.toString().trim() || "";

  const fieldErrors: RegisterState["fieldErrors"] = {};

  if (!storeName) {
    fieldErrors.storeName = "اسم المتجر مطلوب";
  } else if (storeName.length < 3) {
    fieldErrors.storeName = "اسم المتجر لازم يكون 3 حروف على الأقل";
  } else if (storeName.length > 40) {
    fieldErrors.storeName = "اسم المتجر كبير جدًا";
  }

  if (!email) {
    fieldErrors.email = "البريد الإلكتروني مطلوب";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "البريد الإلكتروني غير صالح";
  }

  if (!password) {
    fieldErrors.password = "كلمة المرور مطلوبة";
  } else if (password.length < 6) {
    fieldErrors.password = "كلمة المرور لازم تكون 6 أحرف على الأقل";
  } else if (password.length > 100) {
    fieldErrors.password = "كلمة المرور طويلة جدًا";
  }

  if (
    fieldErrors.storeName ||
    fieldErrors.email ||
    fieldErrors.password
  ) {
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors,
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error: "البريد الإلكتروني مستخدم بالفعل",
        fieldErrors: {
          email: "هذا البريد مستخدم بالفعل",
        },
      };
    }

    const baseSlug = normalizeSlug(storeName);

    if (!baseSlug) {
      return {
        error: "اسم المتجر غير صالح",
        fieldErrors: {
          storeName: "اكتب اسم متجر صالح",
        },
      };
    }

    const existingStore = await prisma.store.findFirst({
      where: { slug: baseSlug },
      select: { id: true },
    });

    const slug = existingStore
      ? `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`
      : baseSlug;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        stores: {
          create: {
            name: storeName,
            slug,
          },
        },
      },
    });

    (await cookies()).set("sessionToken", user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      message: "تم إنشاء الحساب والمتجر بنجاح",
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      error: "حدث خطأ ما أثناء إنشاء الحساب، حاول مرة أخرى",
    };
  }
}