// ─────────────────────────────────────────────────────────────────────────────
//  Store appearance — everything the Studio edits, as one snapshot.
//
//  Live values sit in their own StoreSettings columns. The Studio works on a
//  *draft* stored in `StoreSettings.draftThemeConfig` (a versioned envelope, so
//  the older themeConfig snapshots that column used to hold are ignored) and
//  copies it to the columns on publish. Undo/redo history lives in the same
//  envelope, server-side, so it survives reloads.
// ─────────────────────────────────────────────────────────────────────────────

import type { Prisma } from "@prisma/client";
import { isThemePresetId, type ThemeCustomization, type ThemePresetId } from "@/types/store-theme.types";

export type Appearance = {
  themeConfig: ThemeCustomization;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontId: string;
  storeLanguage: "ar" | "en";
  navbarVariant: string;
  logo: string | null;
  logoRadius: number;
  logoSize: number;
  coverImage: string | null;
  description: string | null;
  announcementText: string | null;
  showStoreName: boolean;
};

/** Columns read to build an Appearance (spread into a Prisma `select`). */
export const APPEARANCE_SELECT = {
  themeId: true,
  themeConfig: true,
  primaryColor: true,
  secondaryColor: true,
  fontId: true,
  storeLanguage: true,
  navbarVariant: true,
  logo: true,
  logoRadius: true,
  logoSize: true,
  coverImage: true,
  description: true,
  announcementText: true,
  showStoreName: true,
} satisfies Prisma.StoreSettingsSelect;

export type AppearanceRow = Prisma.StoreSettingsGetPayload<{ select: typeof APPEARANCE_SELECT }>;

export function liveAppearance(row: AppearanceRow | null | undefined): Appearance {
  const config = row?.themeConfig as ThemeCustomization | null | undefined;
  const presetId: ThemePresetId = config?.presetId ?? (isThemePresetId(row?.themeId) ? row.themeId : "default");
  return {
    themeConfig: { ...(config ?? {}), presetId },
    primaryColor: row?.primaryColor ?? null,
    secondaryColor: row?.secondaryColor ?? null,
    fontId: row?.fontId ?? "cairo",
    storeLanguage: row?.storeLanguage === "en" ? "en" : "ar",
    navbarVariant: row?.navbarVariant ?? "default",
    logo: row?.logo ?? null,
    logoRadius: row?.logoRadius ?? 8,
    logoSize: row?.logoSize ?? 80,
    coverImage: row?.coverImage ?? null,
    description: row?.description ?? null,
    announcementText: row?.announcementText ?? null,
    showStoreName: row?.showStoreName ?? true,
  };
}

/** Column values for writing an Appearance back to StoreSettings. */
export function appearanceColumns(a: Appearance) {
  return {
    themeId: a.themeConfig.presetId,
    themeConfig: a.themeConfig as Prisma.InputJsonValue,
    primaryColor: a.primaryColor,
    secondaryColor: a.secondaryColor,
    fontId: a.fontId,
    storeLanguage: a.storeLanguage,
    navbarVariant: a.navbarVariant,
    logo: a.logo,
    logoRadius: a.logoRadius,
    logoSize: a.logoSize,
    coverImage: a.coverImage,
    description: a.description,
    announcementText: a.announcementText,
    showStoreName: a.showStoreName,
  };
}

/** Same fields, overlaid on a settings row (for the storefront draft preview). */
export function overlayAppearance<T extends object>(row: T, a: Appearance): T {
  return { ...row, ...appearanceColumns(a) };
}

// ─── Draft envelope ──────────────────────────────────────────────────────────

const DRAFT_VERSION = 2;
/** Undo steps kept per draft. */
export const HISTORY_LIMIT = 30;

export type StudioDraft = {
  v: typeof DRAFT_VERSION;
  appearance: Appearance;
  /** Older states, most recent last. */
  history: Appearance[];
  /** States undone, most recent last (cleared by any new edit). */
  future: Appearance[];
  updatedAt: string;
};

export function readStudioDraft(json: unknown): StudioDraft | null {
  if (!json || typeof json !== "object") return null;
  const d = json as Partial<StudioDraft>;
  if (d.v !== DRAFT_VERSION || !d.appearance || typeof d.appearance !== "object") return null;
  return {
    v: DRAFT_VERSION,
    appearance: d.appearance,
    history: Array.isArray(d.history) ? d.history : [],
    future: Array.isArray(d.future) ? d.future : [],
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : new Date(0).toISOString(),
  };
}

export function draftJson(draft: StudioDraft): Prisma.InputJsonValue {
  return draft as unknown as Prisma.InputJsonValue;
}

/** Order-insensitive deep equality for JSON-ish values. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return (a ?? null) === (b ?? null);
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((v, i) => sameValue(v, bb[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) {
    // `undefined` and a missing key mean the same thing in stored JSON.
    if (!sameValue(ao[k] ?? null, bo[k] ?? null)) return false;
  }
  return true;
}

// ─── What changed (for the publish summary) ──────────────────────────────────

export type ChangeArea = "theme" | "colors" | "fonts" | "layout" | "sections" | "content" | "identity";

export function changedAreas(live: Appearance, draft: Appearance): ChangeArea[] {
  const L = live.themeConfig;
  const D = draft.themeConfig;
  const areas: ChangeArea[] = [];
  if (L.presetId !== D.presetId) areas.push("theme");
  if (
    !sameValue(L.tokenOverrides, D.tokenOverrides) ||
    live.primaryColor !== draft.primaryColor ||
    live.secondaryColor !== draft.secondaryColor
  )
    areas.push("colors");
  if (live.fontId !== draft.fontId || live.storeLanguage !== draft.storeLanguage) areas.push("fonts");
  if (!sameValue(L.layoutOverrides, D.layoutOverrides) || live.navbarVariant !== draft.navbarVariant) areas.push("layout");
  if (!sameValue(L.sectionOverrides, D.sectionOverrides)) areas.push("sections");
  if (!sameValue(L.sectionContent, D.sectionContent)) areas.push("content");
  if (
    live.logo !== draft.logo ||
    live.logoRadius !== draft.logoRadius ||
    live.logoSize !== draft.logoSize ||
    live.coverImage !== draft.coverImage ||
    live.description !== draft.description ||
    live.announcementText !== draft.announcementText ||
    live.showStoreName !== draft.showStoreName
  )
    areas.push("identity");
  return areas;
}

/** Studio status shown in the toolbar (serializable, passed to the client). */
export type StudioStatus = {
  hasDraft: boolean;
  canUndo: boolean;
  canRedo: boolean;
  updatedAt: string | null;
  changes: ChangeArea[];
};

export function studioStatus(live: Appearance, draft: StudioDraft | null): StudioStatus {
  if (!draft) return { hasDraft: false, canUndo: false, canRedo: false, updatedAt: null, changes: [] };
  return {
    hasDraft: true,
    canUndo: draft.history.length > 0,
    canRedo: draft.future.length > 0,
    updatedAt: draft.updatedAt,
    changes: changedAreas(live, draft.appearance),
  };
}
