"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import type { StoreNavbarVariant } from "@/constants/store-navbar";

const allowedVariants: StoreNavbarVariant[] = [
  "default",
  "centered",
  "compact",
];

type UpdateNavbarVariantInput = {
  storeId: string;
  variant: StoreNavbarVariant;
};

type ActionResult = {
  success: boolean;
  message: string;
};

export async function UpdateNavbarVariantAction({
  storeId,
  variant,
}: UpdateNavbarVariantInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!allowedVariants.includes(variant)) {
      return {
        success: false,
        message: "نوع النافبار غير صالح",
      };
    }

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        navbarVariant: variant,
      },
      create: {
        storeId,
        navbarVariant: variant,
      },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath("/dashboard/settings");
    revalidatePath(`/store/${storeId}`);

    return {
      success: true,
      message: "تم تحديث شكل النافبار بنجاح",
    };
  } catch (error) {
    console.error("UpdateNavbarVariantAction Error:", error);
    return {
      success: false,
      message: "حصل خطأ أثناء تحديث شكل النافبار",
    };
  }
}
