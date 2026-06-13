"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { seedDemoData } from "@/lib/demo-data";

export type CompleteOnboardingResult =
  | { success: true }
  | { success: false; message: string };

export async function CompleteOnboardingAction(params: {
  storeName: string;
  businessCategory: string;
  language: string;
  useDemoData: boolean;
}): Promise<CompleteOnboardingResult> {
  try {
    const userId = await requireUserId();

    const store = await prisma.store.findFirst({
      where: { userId },
      select: { id: true, onboardingCompleted: true },
      orderBy: { createdAt: "asc" },
    });

    if (!store) {
      return { success: false, message: "لم يتم العثور على المتجر" };
    }

    if (store.onboardingCompleted) {
      return { success: true };
    }

    const allowedLanguages = ["ar", "en"];
    const safeLanguage = allowedLanguages.includes(params.language) ? params.language : "ar";

    await prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: store.id },
        data: {
          businessCategory: params.businessCategory || null,
          name: params.storeName.trim() || undefined,
          onboardingCompleted: true,
          planSelected: true,
        },
      });

      // Upsert StoreSettings with the chosen language
      await tx.storeSettings.upsert({
        where: { storeId: store.id },
        create: {
          storeId: store.id,
          storeLanguage: safeLanguage,
        },
        update: {
          storeLanguage: safeLanguage,
        },
      });
    });

    if (params.useDemoData) {
      await seedDemoData(store.id);
    }

    return { success: true };
  } catch (error) {
    console.error("CompleteOnboardingAction error:", error);
    return { success: false, message: "حدث خطأ أثناء إكمال الإعداد، حاول مرة أخرى" };
  }
}
