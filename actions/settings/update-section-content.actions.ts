"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import type {
  ThemeCustomization,
  SectionContentMap,
} from "@/types/store-theme.types";
import type { ThemePresetId } from "@/constants/store-themes";

type ActionResult = { success: boolean; message: string };

/**
 * Persist per-section content (text, stats, testimonials, etc.)
 * into ThemeCustomization.sectionContent in the DB.
 *
 * Only the keys present in `updates` are changed; everything else is preserved.
 */
export async function UpdateSectionContentAction({
  storeId,
  updates,
}: {
  storeId: string;
  updates: Partial<SectionContentMap>;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const existing = await prisma.storeSettings.findUnique({
      where: { storeId },
      select: { themeConfig: true, themeId: true },
    });

    const current = (existing?.themeConfig as ThemeCustomization | null) ?? {
      presetId: (existing?.themeId as ThemePresetId) || "default",
    };

    const updated: ThemeCustomization = {
      ...current,
      sectionContent: {
        ...(current.sectionContent ?? {}),
        ...updates,
      },
    };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeConfig: updated },
      create: { storeId, themeConfig: updated },
    });

    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم حفظ محتوى القسم بنجاح" };
  } catch (error) {
    console.error("UpdateSectionContentAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ المحتوى" };
  }
}
