"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import {
  isThemePresetId,
  type ThemePresetId,
} from "@/constants/store-themes";
import type { ThemeCustomization, ThemeTokens, ThemeLayout, ThemeSections, SectionKey } from "@/types/store-theme.types";
import { DEFAULT_SECTION_ORDER } from "@/types/store-theme.types";

type ActionResult = { success: boolean; message: string };

// ─── Select preset ────────────────────────────────────────────────────────────

type SelectPresetInput = {
  storeId: string;
  presetId: ThemePresetId;
};

/**
 * Switch the store's active theme preset.
 * Resets all custom overrides; sets a fresh ThemeCustomization with no overrides.
 */
export async function SelectThemePresetAction({
  storeId,
  presetId,
}: SelectPresetInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!isThemePresetId(presetId)) {
      return { success: false, message: "الثيم غير صالح" };
    }

    const newConfig: ThemeCustomization = { presetId };

    // Fetch slug for correct cache revalidation (route is /store/[slug] not /store/[id])
    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        themeId: presetId,          // keep legacy field in sync
        themeConfig: newConfig,
        draftThemeConfig: newConfig, // reset draft too
      },
      create: {
        storeId,
        themeId: presetId,
        themeConfig: newConfig,
        draftThemeConfig: newConfig,
      },
    });

    revalidatePath("/dashboard/customization");
    if (storeInfo?.slug) {
      revalidatePath(`/store/${storeInfo.slug}`);
    }

    return { success: true, message: "تم تحديث ثيم المتجر بنجاح" };
  } catch (error) {
    console.error("SelectThemePresetAction:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}

// ─── Update token overrides ───────────────────────────────────────────────────

type UpdateTokenOverridesInput = {
  storeId: string;
  overrides: Partial<ThemeTokens>;
};

/**
 * Patch specific token values (e.g. colors) without changing the whole preset.
 * Also keeps legacy primaryColor / secondaryColor in sync for backward-compat.
 */
export async function UpdateThemeTokensAction({
  storeId,
  overrides,
}: UpdateTokenOverridesInput): Promise<ActionResult> {
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
      tokenOverrides: {
        ...(current.tokenOverrides ?? {}),
        ...overrides,
      },
    };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        themeConfig: updated,
        // Sync legacy flat fields for backward-compat
        ...(overrides.primary ? { primaryColor: overrides.primary } : {}),
        ...(overrides.secondary ? { secondaryColor: overrides.secondary } : {}),
      },
      create: {
        storeId,
        themeConfig: updated,
        ...(overrides.primary ? { primaryColor: overrides.primary } : {}),
        ...(overrides.secondary ? { secondaryColor: overrides.secondary } : {}),
      },
    });

    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch (error) {
    console.error("UpdateThemeTokensAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الألوان" };
  }
}

// ─── Update layout overrides ──────────────────────────────────────────────────

type UpdateLayoutOverridesInput = {
  storeId: string;
  overrides: Partial<ThemeLayout>;
};

export async function UpdateThemeLayoutAction({
  storeId,
  overrides,
}: UpdateLayoutOverridesInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const [existing, storeInfo] = await Promise.all([
      prisma.storeSettings.findUnique({
        where: { storeId },
        select: { themeConfig: true, themeId: true },
      }),
      prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } }),
    ]);

    const current = (existing?.themeConfig as ThemeCustomization | null) ?? {
      presetId: (existing?.themeId as ThemePresetId) || "default",
    };

    const updated: ThemeCustomization = {
      ...current,
      layoutOverrides: {
        ...(current.layoutOverrides ?? {}),
        ...overrides,
      },
    };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        themeConfig: updated,
        // Sync legacy navbarVariant field
        ...(overrides.navbar ? { navbarVariant: overrides.navbar } : {}),
      },
      create: {
        storeId,
        themeConfig: updated,
        ...(overrides.navbar ? { navbarVariant: overrides.navbar } : {}),
      },
    });

    revalidatePath("/dashboard/customization");
    if (storeInfo?.slug) {
      revalidatePath(`/store/${storeInfo.slug}`);
    }

    return { success: true, message: "تم حفظ إعدادات التصميم بنجاح" };
  } catch (error) {
    console.error("UpdateThemeLayoutAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ إعدادات التصميم" };
  }
}

// ─── Update section visibility ────────────────────────────────────────────────

type UpdateSectionVisibilityInput = {
  storeId: string;
  page: keyof ThemeSections;
  updates: Partial<ThemeSections[keyof ThemeSections]>;
};

export async function UpdateThemeSectionsAction({
  storeId,
  page,
  updates,
}: UpdateSectionVisibilityInput): Promise<ActionResult> {
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

    // ── Auto-update sectionOrder when enabling new sections ──────────────────
    // If the saved order doesn't contain an enabled section key, append it
    // so it renders on the store page without requiring manual reorder.
    let updatedHomeOrder: SectionKey[] | undefined;
    if (page === "home") {
      const currentOrder: SectionKey[] =
        (current.sectionOverrides?.home as { sectionOrder?: SectionKey[] } | undefined)
          ?.sectionOrder ?? DEFAULT_SECTION_ORDER;

      const newlyEnabled = (Object.entries(updates) as [SectionKey, unknown][])
        .filter(([, v]) => v === true)
        .map(([k]) => k)
        .filter((k) => !currentOrder.includes(k));

      if (newlyEnabled.length > 0) {
        updatedHomeOrder = [...currentOrder, ...newlyEnabled];
      }
    }

    const updated: ThemeCustomization = {
      ...current,
      sectionOverrides: {
        ...(current.sectionOverrides ?? {}),
        [page]: {
          ...(current.sectionOverrides?.[page] ?? {}),
          ...updates,
          // Inject updated order only if we added new keys
          ...(updatedHomeOrder ? { sectionOrder: updatedHomeOrder } : {}),
        },
      },
    };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeConfig: updated },
      create: { storeId, themeConfig: updated },
    });

    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم تحديث الأقسام بنجاح" };
  } catch (error) {
    console.error("UpdateThemeSectionsAction:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الأقسام" };
  }
}

// ─── Update section order ─────────────────────────────────────────────────────

type UpdateSectionOrderInput = {
  storeId: string;
  order: SectionKey[];
};

export async function UpdateSectionOrderAction({
  storeId,
  order,
}: UpdateSectionOrderInput): Promise<ActionResult> {
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
      sectionOverrides: {
        ...(current.sectionOverrides ?? {}),
        home: {
          ...(current.sectionOverrides?.home ?? {}),
          sectionOrder: order,
        },
      },
    };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeConfig: updated },
      create: { storeId, themeConfig: updated },
    });

    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم حفظ ترتيب الأقسام" };
  } catch (error) {
    console.error("UpdateSectionOrderAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الترتيب" };
  }
}

// ─── Legacy compat: existing UpdateThemeAction still works ───────────────────

export async function UpdateThemeAction({
  storeId,
  themeId,
}: {
  storeId: string;
  themeId: string;
}): Promise<ActionResult> {
  if (!isThemePresetId(themeId)) {
    return { success: false, message: "الثيم غير صالح" };
  }
  return SelectThemePresetAction({ storeId, presetId: themeId });
}

// ─── Visual Builder: publish draft → live ────────────────────────────────────

/**
 * Copies draftThemeConfig → themeConfig and revalidates the storefront.
 * Called from the builder's "نشر" (Publish) button.
 */
export async function PublishThemeFromDraftAction({
  storeId,
}: {
  storeId: string;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const settings = await prisma.storeSettings.findUnique({
      where: { storeId },
      select: { draftThemeConfig: true, themeId: true },
    });

    const draft = settings?.draftThemeConfig as ThemeCustomization | null;

    // If no draft exists, nothing to publish — current live config is already up-to-date
    if (!draft) {
      return { success: true, message: "المتجر محدّث بالفعل" };
    }

    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    await prisma.storeSettings.update({
      where: { storeId },
      data: {
        themeConfig: draft,
        // Sync legacy fields
        ...(isThemePresetId(draft.presetId) ? { themeId: draft.presetId } : {}),
        ...(draft.tokenOverrides?.primary ? { primaryColor: draft.tokenOverrides.primary } : {}),
        ...(draft.tokenOverrides?.secondary ? { secondaryColor: draft.tokenOverrides.secondary } : {}),
      },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath("/builder");
    if (storeInfo?.slug) {
      revalidatePath(`/store/${storeInfo.slug}`);
    }

    return { success: true, message: "تم نشر التغييرات بنجاح 🎉" };
  } catch (error) {
    console.error("PublishThemeFromDraftAction:", error);
    return { success: false, message: "حصل خطأ أثناء النشر" };
  }
}
