"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "../auth/require-user-id.actions";

export type StoreSettingsFormState = {
  success: boolean;
  message: string;
  errors?: {
    logo?: string[];
    coverImage?: string[];
    primaryColor?: string[];
    secondaryColor?: string[];
    announcementText?: string[];
    whatsappNumber?: string[];
    instagram?: string[];
    facebook?: string[];
    tiktok?: string[];
    email?: string[];
    description?: string[];
  };
};

function normalizeOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function isValidHexColor(value: string) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function UpdateStoreSettingsAction(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!store) {
      return {
        success: false,
        message: "المتجر غير موجود",
      };
    }

    const logo = normalizeOptional(formData.get("logo"));
    const coverImage = normalizeOptional(formData.get("coverImage"));
    const primaryColor = normalizeOptional(formData.get("primaryColor"));
    const secondaryColor = normalizeOptional(formData.get("secondaryColor"));
    const announcementText = normalizeOptional(
      formData.get("announcementText"),
    );
    const whatsappNumber = normalizeOptional(formData.get("whatsappNumber"));
    const instagram = normalizeOptional(formData.get("instagram"));
    const facebook = normalizeOptional(formData.get("facebook"));
    const tiktok = normalizeOptional(formData.get("tiktok"));
    const email = normalizeOptional(formData.get("email"));
    const description = normalizeOptional(formData.get("description"));

    const errors: StoreSettingsFormState["errors"] = {};

    if (logo && !isValidUrl(logo)) {
      errors.logo = ["رابط اللوجو غير صالح"];
    }

    if (coverImage && !isValidUrl(coverImage)) {
      errors.coverImage = ["رابط صورة الغلاف غير صالح"];
    }

    if (instagram && !isValidUrl(instagram)) {
      errors.instagram = ["رابط إنستجرام غير صالح"];
    }

    if (facebook && !isValidUrl(facebook)) {
      errors.facebook = ["رابط فيسبوك غير صالح"];
    }

    if (tiktok && !isValidUrl(tiktok)) {
      errors.tiktok = ["رابط تيك توك غير صالح"];
    }

    if (primaryColor && !isValidHexColor(primaryColor)) {
      errors.primaryColor = ["اكتب لون صحيح مثل #000000"];
    }

    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      errors.secondaryColor = ["اكتب لون صحيح مثل #ffffff"];
    }

    if (whatsappNumber && whatsappNumber.length < 8) {
      errors.whatsappNumber = ["رقم واتساب غير صالح"];
    }

    if (description && description.length < 10) {
      errors.description = ["وصف المتجر يجب أن يكون أكثر من 10 أحرف"];
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = ["البريد الإلكتروني غير صالح"];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "فيه بيانات محتاجة تعديل",
        errors,
      };
    }

    await prisma.storeSettings.upsert({
      where: {
        storeId: store.id,
      },
      update: {
        logo,
        coverImage,
        primaryColor,
        secondaryColor,
        announcementText,
        whatsappNumber,
        instagram,
        facebook,
        tiktok,
        email,
        description,
      },
      create: {
        storeId: store.id,
        logo,
        coverImage,
        primaryColor,
        secondaryColor,
        announcementText,
        whatsappNumber,
        instagram,
        facebook,
        tiktok,
        email,
        description,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: "تم حفظ إعدادات المتجر بنجاح",
    };
  } catch (error) {
    console.error("UpdateStoreSettingsAction Error:", error);

    return {
      success: false,
      message: "حدث خطأ أثناء حفظ إعدادات المتجر",
    };
  }
}
