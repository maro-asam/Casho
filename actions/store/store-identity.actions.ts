"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

const identitySchema = z.object({
  storeId: z.string().min(1, "معرف المتجر مطلوب"),
  logo: z.string().trim().optional(),
  logoRadius: z.coerce.number().int().min(0).max(50).optional(),
  logoSize: z.coerce.number().int().min(32).max(160).optional(),
  coverImage: z.string().trim().optional(),
  description: z.string().trim().max(1000, "وصف المتجر طويل جدًا").optional(),
  announcementText: z
    .string()
    .trim()
    .max(300, "النص العلوي طويل جدًا")
    .optional(),
  showStoreName: z.boolean().optional(),
});

export type StoreIdentityFormState = {
  success: boolean;
  message: string;
  errors?: {
    storeId?: string[];
    logo?: string[];
    logoRadius?: string[];
    logoSize?: string[];
    coverImage?: string[];
    description?: string[];
    announcementText?: string[];
    showStoreName?: string[];
  };
};

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export async function UpdateStoreIdentityAction(
  _prevState: StoreIdentityFormState,
  formData: FormData,
): Promise<StoreIdentityFormState> {
  try {
    const userId = await requireUserId();

    const parsed = identitySchema.safeParse({
      storeId: formData.get("storeId")?.toString() ?? "",
      logo: formData.get("logo")?.toString() ?? "",
      logoRadius: formData.get("logoRadius")?.toString() ?? "8",
      logoSize: formData.get("logoSize")?.toString() ?? "80",
      coverImage: formData.get("coverImage")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      announcementText: formData.get("announcementText")?.toString() ?? "",
      showStoreName: formData.get("showStoreName") === "true",
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "يرجى مراجعة البيانات",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { storeId, logo, logoRadius, logoSize, coverImage, description, announcementText, showStoreName } =
      parsed.data;

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
      select: { id: true, slug: true },
    });

    if (!store) {
      return {
        success: false,
        message: "غير مصرح لك بتعديل هذا المتجر",
      };
    }

    await prisma.storeSettings.upsert({
      where: { storeId: store.id },
      update: {
        logo: emptyToNull(logo),
        logoRadius: logoRadius ?? 8,
        logoSize: logoSize ?? 80,
        coverImage: emptyToNull(coverImage),
        description: emptyToNull(description),
        announcementText: emptyToNull(announcementText),
        showStoreName: showStoreName ?? true,
      },
      create: {
        storeId: store.id,
        logo: emptyToNull(logo),
        logoRadius: logoRadius ?? 8,
        logoSize: logoSize ?? 80,
        coverImage: emptyToNull(coverImage),
        description: emptyToNull(description),
        announcementText: emptyToNull(announcementText),
        showStoreName: showStoreName ?? true,
      },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, message: "تم حفظ الهوية بنجاح" };
  } catch (error) {
    console.error("UpdateStoreIdentityAction error:", error);
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}
