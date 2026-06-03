"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";

const schema = z.object({
  storeId: z.string().min(1),
  storeLanguage: z.enum(["ar", "en"]),
});

export async function UpdateStoreLanguageAction(input: {
  storeId: string;
  storeLanguage: "ar" | "en";
}) {
  try {
    const userId = await requireUserId();

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: "لغة غير صالحة" };
    }

    const { storeId, storeLanguage } = parsed.data;

    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    if (!store) {
      return { success: false, message: "المتجر غير موجود" };
    }

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { storeLanguage },
      create: { storeId, storeLanguage },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return {
      success: true,
      message: storeLanguage === "ar" ? "تم التحويل إلى العربية" : "Switched to English",
    };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}
