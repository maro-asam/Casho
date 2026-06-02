"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { normalizeStoreSlug } from "@/lib/store/slug";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

const settingsSchema = z.object({
  storeId: z.string().min(1, "معرف المتجر مطلوب"),
  storeName: z
    .string()
    .trim()
    .min(2, "اسم المتجر لازم يكون حرفين على الأقل")
    .max(60, "اسم المتجر كبير جدًا"),

  shippingPrice: z.coerce
    .number("سعر الشحن لازم يكون رقم")
    .int("سعر الشحن لازم يكون رقم صحيح")
    .min(0, "سعر الشحن لا يمكن يكون أقل من صفر")
    .max(100000, "سعر الشحن كبير جدًا"),

  whatsappNumber: z.string().trim().max(30, "رقم الواتساب غير صالح").optional(),
  tiktok: z.string().trim().max(255, "رابط تيك توك غير صالح").optional(),
  instagram: z.string().trim().max(255, "رابط انستجرام غير صالح").optional(),
  facebook: z.string().trim().max(255, "رابط فيسبوك غير صالح").optional(),
  email: z
    .string()
    .trim()
    .max(255, "الإيميل طويل جدًا")
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "البريد الإلكتروني غير صالح",
    }),
});

export type StoreSettingsFormState = {
  success: boolean;
  message: string;
  errors?: {
    storeName?: string[];
    shippingPrice?: string[];
    whatsappNumber?: string[];
    tiktok?: string[];
    instagram?: string[];
    facebook?: string[];
    email?: string[];
    storeId?: string[];
  };
};

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

async function getAvailableStoreSlug(
  tx: Omit<
    typeof prisma,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  storeId: string,
  baseSlug: string,
) {
  const existingBase = await tx.store.findFirst({
    where: {
      id: { not: storeId },
      slug: baseSlug,
    },
    select: { id: true },
  });

  if (!existingBase) return baseSlug;

  for (let i = 0; i < 10; i++) {
    const random = Math.random().toString(36).slice(2, 6);
    const candidate = `${baseSlug}-${random}`;

    const exists = await tx.store.findFirst({
      where: {
        id: { not: storeId },
        slug: candidate,
      },
      select: { id: true },
    });

    if (!exists) return candidate;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function UpdateStoreSettingsAction(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  try {
    const userId = await requireUserId();

    const rawData = {
      storeId: formData.get("storeId")?.toString() ?? "",
      storeName: formData.get("storeName")?.toString() ?? "",
      shippingPrice: formData.get("shippingPrice")?.toString() ?? "0",
      whatsappNumber: formData.get("whatsappNumber")?.toString() ?? "",
      tiktok: formData.get("tiktok")?.toString() ?? "",
      instagram: formData.get("instagram")?.toString() ?? "",
      facebook: formData.get("facebook")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
    };

    const parsed = settingsSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "يرجى مراجعة البيانات",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      storeId,
      storeName,
      shippingPrice,
      whatsappNumber,
      tiktok,
      instagram,
      facebook,
      email,
    } = parsed.data;

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
      select: {
        id: true,
        slug: true,
        userId: true,
      },
    });

    if (!store) {
      return {
        success: false,
        message: "غير مصرح لك بتعديل هذا المتجر",
      };
    }

    const normalizedSlug = normalizeStoreSlug(storeName);

    if (!normalizedSlug) {
      return {
        success: false,
        message: "اسم المتجر غير صالح",
        errors: {
          storeName: ["اكتب اسم متجر صالح"],
        },
      };
    }

    let nextSlug = store.slug;

    await prisma.$transaction(async (tx) => {
      nextSlug = await getAvailableStoreSlug(tx, store.id, normalizedSlug);

      await tx.store.update({
        where: { id: store.id },
        data: {
          name: storeName.trim(),
          slug: nextSlug,
        },
      });

      await tx.storeSettings.upsert({
        where: { storeId: store.id },
        update: {
          shippingPrice,
          whatsappNumber: emptyToNull(whatsappNumber),
          tiktok: emptyToNull(tiktok),
          instagram: emptyToNull(instagram),
          facebook: emptyToNull(facebook),
          email: emptyToNull(email),
        },
        create: {
          storeId: store.id,
          shippingPrice,
          whatsappNumber: emptyToNull(whatsappNumber),
          tiktok: emptyToNull(tiktok),
          instagram: emptyToNull(instagram),
          facebook: emptyToNull(facebook),
          email: emptyToNull(email),
        },
      });
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath(`/store/${nextSlug}`);

    return {
      success: true,
      message: "تم حفظ إعدادات المتجر بنجاح",
    };
  } catch (error) {
    console.error("UpdateStoreSettingsAction error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء حفظ الإعدادات",
    };
  }
}
