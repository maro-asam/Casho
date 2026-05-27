"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { isStoreThemeId, type StoreThemeId } from "@/constants/store-themes";

type UpdateThemeInput = {
  storeId: string;
  themeId: StoreThemeId;
};

type ActionResult = {
  success: boolean;
  message: string;
};

export async function UpdateThemeAction({ storeId, themeId }: UpdateThemeInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!isStoreThemeId(themeId)) {
      return { success: false, message: "الثيم غير صالح" };
    }

    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeId },
      create: { storeId, themeId },
    });

    revalidatePath("/dashboard/customization");
    if (storeInfo?.slug) {
      revalidatePath(`/store/${storeInfo.slug}`);
    }

    return { success: true, message: "تم تحديث ثيم المتجر بنجاح" };
  } catch (error) {
    console.error("UpdateThemeAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}
