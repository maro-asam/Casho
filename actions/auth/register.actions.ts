"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { RegisterState } from "./auth.types";
import { registerSchema } from "@/validations/auth.schema";
import { getFieldErrors } from "@/lib/zod";
import { normalizeStoreSlug } from "@/lib/store/slug";
import { createUserSession } from "@/lib/auth/session";

async function getAvailableSlug(tx: typeof prisma, baseSlug: string) {
  const existingStore = await tx.store.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existingStore) {
    return baseSlug;
  }

  for (let i = 0; i < 10; i++) {
    const random = Math.random().toString(36).slice(2, 6);
    const candidate = `${baseSlug}-${random}`;

    const candidateExists = await tx.store.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!candidateExists) {
      return candidate;
    }
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function RegisterAction(
  _prevState: RegisterState | null,
  formData: FormData,
): Promise<RegisterState> {
  const rawData = {
    storeName: formData.get("storeName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phoneNumber: formData.get("phoneNumber")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "يرجى مراجعة البيانات",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const { storeName, email, phoneNumber, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phoneNumber ? [{ phone_number: phoneNumber }] : []),
        ],
      },
      select: {
        id: true,
        email: true,
        phone_number: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return {
          error: "البريد الإلكتروني مستخدم بالفعل",
          fieldErrors: {
            email: "هذا البريد مستخدم بالفعل",
          },
        };
      }

      if (existingUser.phone_number === phoneNumber) {
        return {
          error: "رقم الموبايل مستخدم بالفعل",
          fieldErrors: {
            phoneNumber: "هذا الرقم مستخدم بالفعل",
          },
        };
      }
    }

    const baseSlug = normalizeStoreSlug(storeName);

    if (!baseSlug) {
      return {
        error: "اسم المتجر غير صالح",
        fieldErrors: {
          storeName: "اكتب اسم متجر صالح",
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const created = await prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const slug = await getAvailableSlug(tx, baseSlug);

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          phone_number: phoneNumber || null,
          stores: {
            create: {
              name: storeName.trim(),
              slug,
            },
          },
        },
        select: {
          id: true,
        },
      });

      return user;
    });

    await createUserSession(created.id);

    return {
      success: true,
      message: "تم إنشاء الحساب والمتجر بنجاح",
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("RegisterAction error:", error);

    const message =
      typeof error?.message === "string" ? error.message : "";

    if (
      message.includes("Unique constraint failed") ||
      message.includes("Unique constraint")
    ) {
      return {
        error: "البيانات مستخدمة بالفعل، جرّب بريد أو رقم موبايل مختلف",
      };
    }

    if (
      error?.code === "ETIMEDOUT" ||
      message.includes("ETIMEDOUT") ||
      message.includes("Can't reach database server") ||
      message.includes("timeout")
    ) {
      return {
        error: "تعذر الاتصال بقاعدة البيانات حاليًا، حاول مرة أخرى بعد لحظات",
      };
    }

    return {
      error: "حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى",
    };
  }
}