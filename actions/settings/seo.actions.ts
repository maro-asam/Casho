"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { storeSeoSchema } from "@/validations/store-seo.schema";

export type SeoSettingsState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

function parseKeywords(value: string | undefined) {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, arr) => arr.indexOf(keyword) === index);
}

export async function UpdateStoreSeoAction(
  storeId: string,
  prevState: SeoSettingsState | null,
  formData: FormData,
): Promise<SeoSettingsState> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const rawData = {
      seoTitle: String(formData.get("seoTitle") ?? ""),
      seoDescription: String(formData.get("seoDescription") ?? ""),
      seoKeywords: String(formData.get("seoKeywords") ?? ""),
      ogTitle: String(formData.get("ogTitle") ?? ""),
      ogDescription: String(formData.get("ogDescription") ?? ""),
      ogImage: String(formData.get("ogImage") ?? ""),
      isIndexed: formData.get("isIndexed") === "on",
    };

    const parsed = storeSeoSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "فيه بيانات محتاجة تتراجع",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        seoKeywords: parseKeywords(data.seoKeywords),
        ogTitle: data.ogTitle || null,
        ogDescription: data.ogDescription || null,
        ogImage: data.ogImage || null,
        isIndexed: data.isIndexed,
      },
      create: {
        storeId,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        seoKeywords: parseKeywords(data.seoKeywords),
        ogTitle: data.ogTitle || null,
        ogDescription: data.ogDescription || null,
        ogImage: data.ogImage || null,
        isIndexed: data.isIndexed,
      },
    });

    revalidatePath("/dashboard/settings/seo");
    revalidatePath("/dashboard/settings");
    revalidatePath("/store/[slug]", "layout");

    return {
      success: true,
      message: "تم حفظ إعدادات الـ SEO بنجاح",
    };
  } catch (error) {
    console.error("UpdateStoreSeoAction Error:", error);

    return {
      success: false,
      message: "حصل خطأ أثناء حفظ إعدادات الـ SEO",
    };
  }
}
