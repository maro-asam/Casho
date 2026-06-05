"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import {
  getStoreTheme,
  isStoreThemeId,
  isThemePresetId,
  type StoreThemeId,
  type ThemePresetId,
} from "@/constants/store-themes";
import { ARABIC_FONTS } from "@/constants/arabic-fonts";
import { ENGLISH_FONTS } from "@/constants/english-fonts";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type {
  ThemeCustomization,
  ThemeTokens,
  ThemeLayout,
  ThemeSections,
  SectionKey,
  SectionContentMap,
} from "@/types/store-theme.types";
import { DEFAULT_SECTION_ORDER } from "@/types/store-theme.types";

type ActionResult = { success: boolean; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getThemeConfig(storeId: string) {
  const existing = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: { themeConfig: true, themeId: true },
  });
  return (existing?.themeConfig as ThemeCustomization | null) ?? {
    presetId: (existing?.themeId as ThemePresetId) || "default",
  };
}

async function upsertThemeConfig(storeId: string, config: ThemeCustomization, extras?: Record<string, unknown>) {
  await prisma.storeSettings.upsert({
    where: { storeId },
    update: { themeConfig: config, ...extras },
    create: { storeId, themeConfig: config, ...extras },
  });
}

// ─── Theme preset ─────────────────────────────────────────────────────────────

export async function SelectThemePresetAction({
  storeId,
  presetId,
}: {
  storeId: string;
  presetId: ThemePresetId;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!isThemePresetId(presetId)) {
      return { success: false, message: "الثيم غير صالح" };
    }

    const newConfig: ThemeCustomization = { presetId };

    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeId: presetId, themeConfig: newConfig, draftThemeConfig: newConfig },
      create: { storeId, themeId: presetId, themeConfig: newConfig, draftThemeConfig: newConfig },
    });

    revalidatePath("/dashboard/customization");
    if (storeInfo?.slug) revalidatePath(`/store/${storeInfo.slug}`);

    return { success: true, message: "تم تحديث ثيم المتجر بنجاح" };
  } catch (error) {
    console.error("SelectThemePresetAction:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}

export async function UpdateStoreThemeAction({
  storeId,
  themeId,
}: {
  storeId: string;
  themeId: StoreThemeId;
}): Promise<ActionResult> {
  try {
    if (!storeId) return { success: false, message: "معرف المتجر غير موجود" };
    if (!isStoreThemeId(themeId)) return { success: false, message: "الثيم غير صالح" };

    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    if (!store) return { success: false, message: "المتجر غير موجود" };

    const theme = getStoreTheme(themeId);

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { themeId, navbarVariant: theme.navbarVariant },
      create: { storeId, themeId, navbarVariant: theme.navbarVariant },
    });

    revalidatePath("/dashboard/themes");
    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);
    revalidatePath(`/store/${store.slug}/products`);
    revalidatePath(`/store/${store.slug}/categories`);

    return { success: true, message: "تم تحديث الثيم بنجاح" };
  } catch (error) {
    console.error("UpdateStoreThemeAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}

export async function UpdateThemeAction({
  storeId,
  themeId,
}: {
  storeId: string;
  themeId: string;
}): Promise<ActionResult> {
  if (!isThemePresetId(themeId)) return { success: false, message: "الثيم غير صالح" };
  return SelectThemePresetAction({ storeId, presetId: themeId });
}

// ─── Publish draft ────────────────────────────────────────────────────────────

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

    if (!draft) return { success: true, message: "المتجر محدّث بالفعل" };

    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    await prisma.storeSettings.update({
      where: { storeId },
      data: {
        themeConfig: draft,
        ...(isThemePresetId(draft.presetId) ? { themeId: draft.presetId } : {}),
        ...(draft.tokenOverrides?.primary ? { primaryColor: draft.tokenOverrides.primary } : {}),
        ...(draft.tokenOverrides?.secondary ? { secondaryColor: draft.tokenOverrides.secondary } : {}),
      },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath("/builder");
    if (storeInfo?.slug) revalidatePath(`/store/${storeInfo.slug}`);

    return { success: true, message: "تم نشر التغييرات بنجاح 🎉" };
  } catch (error) {
    console.error("PublishThemeFromDraftAction:", error);
    return { success: false, message: "حصل خطأ أثناء النشر" };
  }
}

// ─── Token overrides (colors) ─────────────────────────────────────────────────

export async function UpdateThemeTokensAction({
  storeId,
  overrides,
}: {
  storeId: string;
  overrides: Partial<ThemeTokens>;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const current = await getThemeConfig(storeId);
    const updated: ThemeCustomization = {
      ...current,
      tokenOverrides: { ...(current.tokenOverrides ?? {}), ...overrides },
    };

    await upsertThemeConfig(storeId, updated, {
      ...(overrides.primary ? { primaryColor: overrides.primary } : {}),
      ...(overrides.secondary ? { secondaryColor: overrides.secondary } : {}),
    });

    revalidatePath("/dashboard/customization");
    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch (error) {
    console.error("UpdateThemeTokensAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الألوان" };
  }
}

// ─── Colors (legacy flat fields) ─────────────────────────────────────────────

const colorsSchema = z.object({
  storeId: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
});

export async function UpdateStoreColorsAction(input: {
  storeId: string;
  primaryColor: string;
  secondaryColor: string;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = colorsSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "ألوان غير صالحة" };

    const { storeId, primaryColor, secondaryColor } = parsed.data;
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
    if (!store) return { success: false, message: "المتجر غير موجود" };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { primaryColor, secondaryColor },
      create: { storeId, primaryColor, secondaryColor },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

// ─── Layout overrides ─────────────────────────────────────────────────────────

export async function UpdateThemeLayoutAction({
  storeId,
  overrides,
}: {
  storeId: string;
  overrides: Partial<ThemeLayout>;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const [current, storeInfo] = await Promise.all([
      getThemeConfig(storeId),
      prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } }),
    ]);

    const updated: ThemeCustomization = {
      ...current,
      layoutOverrides: { ...(current.layoutOverrides ?? {}), ...overrides },
    };

    await upsertThemeConfig(storeId, updated, {
      ...(overrides.navbar ? { navbarVariant: overrides.navbar } : {}),
    });

    revalidatePath("/dashboard/customization");
    if (storeInfo?.slug) revalidatePath(`/store/${storeInfo.slug}`);

    return { success: true, message: "تم حفظ إعدادات التصميم بنجاح" };
  } catch (error) {
    console.error("UpdateThemeLayoutAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ إعدادات التصميم" };
  }
}

// ─── Navbar variant ───────────────────────────────────────────────────────────

const allowedNavbarVariants: StoreNavbarVariant[] = ["default", "centered", "compact"];

export async function UpdateNavbarVariantAction({
  storeId,
  variant,
}: {
  storeId: string;
  variant: StoreNavbarVariant;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    if (!allowedNavbarVariants.includes(variant)) {
      return { success: false, message: "نوع النافبار غير صالح" };
    }

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { navbarVariant: variant },
      create: { storeId, navbarVariant: variant },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath("/dashboard/settings");
    revalidatePath(`/store/${storeId}`);

    return { success: true, message: "تم تحديث شكل النافبار بنجاح" };
  } catch (error) {
    console.error("UpdateNavbarVariantAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث شكل النافبار" };
  }
}

// ─── Font ─────────────────────────────────────────────────────────────────────

const VALID_FONT_IDS = [...Object.keys(ARABIC_FONTS), ...Object.keys(ENGLISH_FONTS)];

const fontSchema = z.object({
  storeId: z.string().min(1),
  fontId: z.string().refine((v) => VALID_FONT_IDS.includes(v), "خط غير صالح"),
});

export async function UpdateStoreFontAction(input: {
  storeId: string;
  fontId: string;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = fontSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "خط غير صالح" };

    const { storeId, fontId } = parsed.data;
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
    if (!store) return { success: false, message: "المتجر غير موجود" };

    await prisma.storeSettings.upsert({
      where: { storeId },
      update: { fontId },
      create: { storeId, fontId },
    });

    revalidatePath("/dashboard/customization");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, message: "تم حفظ الخط بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

// ─── Language ─────────────────────────────────────────────────────────────────

const languageSchema = z.object({
  storeId: z.string().min(1),
  storeLanguage: z.enum(["ar", "en"]),
});

export async function UpdateStoreLanguageAction(input: {
  storeId: string;
  storeLanguage: "ar" | "en";
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = languageSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "لغة غير صالحة" };

    const { storeId, storeLanguage } = parsed.data;
    await MustOwnStore(storeId, userId);

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
    if (!store) return { success: false, message: "المتجر غير موجود" };

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

// ─── Sections visibility ──────────────────────────────────────────────────────

export async function UpdateThemeSectionsAction({
  storeId,
  page,
  updates,
}: {
  storeId: string;
  page: keyof ThemeSections;
  updates: Partial<ThemeSections[keyof ThemeSections]>;
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const current = await getThemeConfig(storeId);

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
          ...(updatedHomeOrder ? { sectionOrder: updatedHomeOrder } : {}),
        },
      },
    };

    await upsertThemeConfig(storeId, updated);
    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم تحديث الأقسام بنجاح" };
  } catch (error) {
    console.error("UpdateThemeSectionsAction:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الأقسام" };
  }
}

// ─── Section order ────────────────────────────────────────────────────────────

export async function UpdateSectionOrderAction({
  storeId,
  order,
}: {
  storeId: string;
  order: SectionKey[];
}): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await MustOwnStore(storeId, userId);

    const current = await getThemeConfig(storeId);
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

    await upsertThemeConfig(storeId, updated);
    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم حفظ ترتيب الأقسام" };
  } catch (error) {
    console.error("UpdateSectionOrderAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الترتيب" };
  }
}

// ─── Section content ──────────────────────────────────────────────────────────

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

    const current = await getThemeConfig(storeId);
    const updated: ThemeCustomization = {
      ...current,
      sectionContent: { ...(current.sectionContent ?? {}), ...updates },
    };

    await upsertThemeConfig(storeId, updated);
    revalidatePath("/dashboard/customization");

    return { success: true, message: "تم حفظ محتوى القسم بنجاح" };
  } catch (error) {
    console.error("UpdateSectionContentAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ المحتوى" };
  }
}
