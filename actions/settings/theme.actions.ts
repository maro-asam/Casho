"use server";

import { z } from "zod";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import {
  getThemePreset,
  isStoreThemeId,
  isThemePresetId,
  type StoreThemeId,
  type ThemePresetId,
} from "@/constants/store-themes";
import { ARABIC_FONTS } from "@/constants/arabic-fonts";
import { ENGLISH_FONTS } from "@/constants/english-fonts";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type { Appearance } from "@/lib/studio/appearance";
import { mutateAppearance, publishDraft, type AppearanceTarget } from "@/lib/studio/mutate";
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

/**
 * Every action takes an optional `target`: "live" (default — dashboard
 * shortcuts keep working as before) or "draft" (the Studio, published later).
 */
type Target = { target?: AppearanceTarget };

async function guard(storeId: string) {
  const userId = await requireUserId();
  return MustOwnStore(storeId, userId);
}

const withConfig = (a: Appearance, config: Partial<ThemeCustomization>): Appearance => ({
  ...a,
  themeConfig: { ...a.themeConfig, ...config },
});

// ─── Theme preset ─────────────────────────────────────────────────────────────

/** Switching theme resets its look (colors, layout, sections) but keeps the merchant's own text. */
function applyPreset(a: Appearance, presetId: ThemePresetId): Appearance {
  return {
    ...a,
    themeConfig: { presetId, ...(a.themeConfig.sectionContent ? { sectionContent: a.themeConfig.sectionContent } : {}) },
    navbarVariant: getThemePreset(presetId).layout.navbar,
  };
}

export async function SelectThemePresetAction({
  storeId,
  presetId,
  target,
}: { storeId: string; presetId: ThemePresetId } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    if (!isThemePresetId(presetId)) return { success: false, message: "الثيم غير صالح" };
    await mutateAppearance(storeId, (a) => applyPreset(a, presetId), target);
    return { success: true, message: "تم تحديث ثيم المتجر بنجاح" };
  } catch (error) {
    console.error("SelectThemePresetAction:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}

export async function UpdateStoreThemeAction({
  storeId,
  themeId,
  target,
}: { storeId: string; themeId: StoreThemeId } & Target): Promise<ActionResult> {
  try {
    if (!storeId) return { success: false, message: "معرف المتجر غير موجود" };
    if (!isStoreThemeId(themeId) || !isThemePresetId(themeId)) return { success: false, message: "الثيم غير صالح" };
    await guard(storeId);
    // Through the theme config: it takes precedence over the legacy themeId column.
    await mutateAppearance(storeId, (a) => applyPreset(a, themeId), target);
    return { success: true, message: "تم تحديث الثيم بنجاح" };
  } catch (error) {
    console.error("UpdateStoreThemeAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء تحديث الثيم" };
  }
}

export async function UpdateThemeAction({
  storeId,
  themeId,
  target,
}: { storeId: string; themeId: string } & Target): Promise<ActionResult> {
  if (!isThemePresetId(themeId)) return { success: false, message: "الثيم غير صالح" };
  return SelectThemePresetAction({ storeId, presetId: themeId, target });
}

// ─── Publish draft ────────────────────────────────────────────────────────────

export async function PublishThemeFromDraftAction({ storeId }: { storeId: string }): Promise<ActionResult> {
  try {
    await guard(storeId);
    const published = await publishDraft(storeId);
    return published
      ? { success: true, message: "المتجر اتحدّث بآخر تعديلاتك 🎉" }
      : { success: true, message: "مفيش تعديلات جديدة تتنشر" };
  } catch (error) {
    console.error("PublishThemeFromDraftAction:", error);
    return { success: false, message: "حصل خطأ أثناء النشر" };
  }
}

// ─── Token overrides (colors) ─────────────────────────────────────────────────

export async function UpdateThemeTokensAction({
  storeId,
  overrides,
  target,
}: { storeId: string; overrides: Partial<ThemeTokens> } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => ({
        ...withConfig(a, { tokenOverrides: { ...(a.themeConfig.tokenOverrides ?? {}), ...overrides } }),
        ...(overrides.primary ? { primaryColor: overrides.primary } : {}),
        ...(overrides.secondary ? { secondaryColor: overrides.secondary } : {}),
      }),
      target,
    );
    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch (error) {
    console.error("UpdateThemeTokensAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الألوان" };
  }
}

/** Back to the theme's own colors. */
export async function ResetThemeColorsAction({ storeId, target }: { storeId: string } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => {
        const themeConfig = { ...a.themeConfig };
        delete themeConfig.tokenOverrides;
        return { ...a, themeConfig, primaryColor: null, secondaryColor: null };
      },
      target,
    );
    return { success: true, message: "رجعنا ألوان الثيم الأصلية" };
  } catch (error) {
    console.error("ResetThemeColorsAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الألوان" };
  }
}

// ─── Colors (legacy flat fields) ─────────────────────────────────────────────

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح");
const colorsSchema = z.object({ storeId: z.string().min(1), primaryColor: hex, secondaryColor: hex });

export async function UpdateStoreColorsAction(
  input: { storeId: string; primaryColor: string; secondaryColor: string } & Target,
): Promise<ActionResult> {
  try {
    const parsed = colorsSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "ألوان غير صالحة" };
    const { storeId, primaryColor, secondaryColor } = parsed.data;
    await guard(storeId);

    // themeConfig.tokenOverrides wins over the flat fields when resolving the
    // theme, so keep both in sync — and let the readable text colors be recomputed.
    await mutateAppearance(
      storeId,
      (a) => {
        const tokenOverrides = { ...(a.themeConfig.tokenOverrides ?? {}), primary: primaryColor, secondary: secondaryColor };
        delete tokenOverrides.primaryForeground;
        delete tokenOverrides.secondaryForeground;
        return { ...withConfig(a, { tokenOverrides }), primaryColor, secondaryColor };
      },
      input.target,
    );
    return { success: true, message: "تم حفظ الألوان بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

// ─── Layout overrides ─────────────────────────────────────────────────────────

export async function UpdateThemeLayoutAction({
  storeId,
  overrides,
  target,
}: { storeId: string; overrides: Partial<ThemeLayout> } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => ({
        ...withConfig(a, { layoutOverrides: { ...(a.themeConfig.layoutOverrides ?? {}), ...overrides } }),
        ...(overrides.navbar ? { navbarVariant: overrides.navbar } : {}),
      }),
      target,
    );
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
  target,
}: { storeId: string; variant: StoreNavbarVariant } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    if (!allowedNavbarVariants.includes(variant)) return { success: false, message: "نوع النافبار غير صالح" };
    await mutateAppearance(
      storeId,
      (a) => ({
        ...withConfig(a, { layoutOverrides: { ...(a.themeConfig.layoutOverrides ?? {}), navbar: variant } }),
        navbarVariant: variant,
      }),
      target,
    );
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

export async function UpdateStoreFontAction(input: { storeId: string; fontId: string } & Target): Promise<ActionResult> {
  try {
    const parsed = fontSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "خط غير صالح" };
    await guard(parsed.data.storeId);
    await mutateAppearance(parsed.data.storeId, (a) => ({ ...a, fontId: parsed.data.fontId }), input.target);
    return { success: true, message: "تم حفظ الخط بنجاح" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

// ─── Language ─────────────────────────────────────────────────────────────────

const languageSchema = z.object({ storeId: z.string().min(1), storeLanguage: z.enum(["ar", "en"]) });

export async function UpdateStoreLanguageAction(
  input: {
    storeId: string;
    storeLanguage: "ar" | "en";
    /** Also switch to the language's default font (one undo step). */
    withDefaultFont?: boolean;
  } & Target,
): Promise<ActionResult> {
  try {
    const parsed = languageSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "لغة غير صالحة" };
    const { storeId, storeLanguage } = parsed.data;
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => ({
        ...a,
        storeLanguage,
        ...(input.withDefaultFont ? { fontId: storeLanguage === "en" ? "inter" : "cairo" } : {}),
      }),
      input.target,
    );
    return { success: true, message: storeLanguage === "ar" ? "تم التحويل إلى العربية" : "Switched to English" };
  } catch {
    return { success: false, message: "حدث خطأ أثناء الحفظ" };
  }
}

// ─── Sections visibility ──────────────────────────────────────────────────────

type HomeOverrides = { sectionOrder?: SectionKey[] } & Partial<Record<SectionKey, boolean>>;
const homeOf = (a: Appearance) => (a.themeConfig.sectionOverrides?.home ?? {}) as HomeOverrides;

export async function UpdateThemeSectionsAction({
  storeId,
  page,
  updates,
  target,
}: {
  storeId: string;
  page: keyof ThemeSections;
  updates: Partial<ThemeSections[keyof ThemeSections]>;
} & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => {
        const current = homeOf(a);
        // A newly enabled section that isn't in the saved order goes last.
        const order = current.sectionOrder ?? DEFAULT_SECTION_ORDER;
        const added = (Object.entries(updates) as [SectionKey, unknown][])
          .filter(([k, v]) => v === true && !order.includes(k))
          .map(([k]) => k);
        return withConfig(a, {
          sectionOverrides: {
            ...(a.themeConfig.sectionOverrides ?? {}),
            [page]: { ...current, ...updates, ...(added.length ? { sectionOrder: [...order, ...added] } : {}) },
          },
        });
      },
      target,
    );
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
  target,
}: { storeId: string; order: SectionKey[] } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) =>
        withConfig(a, {
          sectionOverrides: { ...(a.themeConfig.sectionOverrides ?? {}), home: { ...homeOf(a), sectionOrder: order } },
        }),
      target,
    );
    return { success: true, message: "تم حفظ ترتيب الأقسام" };
  } catch (error) {
    console.error("UpdateSectionOrderAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ الترتيب" };
  }
}

/** Turn a section on and put it at `index` in the home order (section library "add here"). */
export async function InsertSectionAction({
  storeId,
  key,
  index,
  target,
}: { storeId: string; key: SectionKey; index: number } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => {
        const current = homeOf(a);
        const order = (current.sectionOrder ?? DEFAULT_SECTION_ORDER).filter((k) => k !== key);
        const at = Math.max(0, Math.min(order.length, Math.round(index)));
        return withConfig(a, {
          sectionOverrides: {
            ...(a.themeConfig.sectionOverrides ?? {}),
            home: { ...current, [key]: true, sectionOrder: [...order.slice(0, at), key, ...order.slice(at)] },
          },
        });
      },
      target,
    );
    return { success: true, message: "اتضاف القسم" };
  } catch (error) {
    console.error("InsertSectionAction:", error);
    return { success: false, message: "حصل خطأ أثناء إضافة القسم" };
  }
}

// ─── Section content ──────────────────────────────────────────────────────────

export async function UpdateSectionContentAction({
  storeId,
  updates,
  target,
}: { storeId: string; updates: Partial<SectionContentMap> } & Target): Promise<ActionResult> {
  try {
    await guard(storeId);
    await mutateAppearance(
      storeId,
      (a) => withConfig(a, { sectionContent: { ...(a.themeConfig.sectionContent ?? {}), ...updates } }),
      target,
    );
    return { success: true, message: "تم حفظ محتوى القسم بنجاح" };
  } catch (error) {
    console.error("UpdateSectionContentAction:", error);
    return { success: false, message: "حصل خطأ أثناء حفظ المحتوى" };
  }
}
