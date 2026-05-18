"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import {
  getStoreTheme,
  isStoreThemeId,
  type StoreThemeId,
} from "@/constants/store-themes";

type UpdateStoreThemeInput = {
  storeId: string;
  themeId: StoreThemeId;
};

export async function UpdateStoreThemeAction({
  storeId,
  themeId,
}: UpdateStoreThemeInput) {
  try {
    if (!storeId) {
      return {
        success: false,
        message: "معرف المتجر غير موجود",
      };
    }

    if (!isStoreThemeId(themeId)) {
      return {
        success: false,
        message: "الثيم غير صالح",
      };
    }

    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    if (!store) {
      return {
        success: false,
        message: "المتجر غير موجود",
      };
    }

    const theme = getStoreTheme(themeId);

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        themeId,
        navbarVariant: theme.navbarVariant,
      },
      create: {
        storeId,
        themeId,
        navbarVariant: theme.navbarVariant,
      },
    });

    revalidatePath("/dashboard/themes");
    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);
    revalidatePath(`/store/${store.slug}/products`);
    revalidatePath(`/store/${store.slug}/categories`);

    return {
      success: true,
      message: "تم تحديث الثيم بنجاح",
    };
  } catch (error) {
    console.error("UpdateStoreThemeAction Error:", error);

    return {
      success: false,
      message: "حصل خطأ أثناء تحديث الثيم",
    };
  }
}