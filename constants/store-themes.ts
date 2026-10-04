// ─────────────────────────────────────────────────────────────────────────────
//  Store Theme Registry
//  Source of truth for all built-in theme presets.
//  Each preset = tokens + layout config + section defaults.
// ─────────────────────────────────────────────────────────────────────────────

import { hexToRgb, readableOn } from "@/lib/theme/contrast";
import type {
  ThemePreset,
  ThemePresetId,
  ThemeCustomization,
  ResolvedTheme,
  ThemeTokens,
  ThemeCategoryId,
} from "@/types/store-theme.types";
import { THEME_PRESET_IDS, THEME_CATEGORY_IDS, isThemePresetId } from "@/types/store-theme.types";
import type { StoreNavbarVariant } from "@/constants/store-navbar";

export { THEME_PRESET_IDS, isThemePresetId };
export type { ThemePresetId, ThemeCategoryId };

// ─── Theme Categories ─────────────────────────────────────────────────────

export const THEME_CATEGORIES: Record<ThemeCategoryId, { label: string; description: string }> = {
  general: { label: "متجر عام", description: "مناسب لأي نوع من المنتجات" },
  fashion: { label: "أزياء وإكسسوارات", description: "ملابس، شنط، أحذية، ومجوهرات" },
  electronics: { label: "إلكترونيات وتقنية", description: "موبايلات، أجهزة، جيمنج، وإكسسواراتها" },
  beauty: { label: "تجميل وعطور", description: "مستحضرات تجميل، عناية، وعطور" },
  food: { label: "أكل ومشروبات", description: "مطاعم، حلويات، قهوة، ومنتجات غذائية" },
  home: { label: "منزل وديكور", description: "أثاث، ديكور، وأدوات منزلية" },
};

export const THEME_CATEGORY_LIST = THEME_CATEGORY_IDS.map((id) => ({ id, ...THEME_CATEGORIES[id] }));

// ─── Backward-Compat Alias ────────────────────────────────────────────────
// Some code still imports StoreThemeId / isStoreThemeId from here.
export type StoreThemeId = ThemePresetId;
export function isStoreThemeId(value: unknown): value is StoreThemeId {
  return isThemePresetId(value);
}

// ─── Default Section Visibility ──────────────────────────────────────────

const DEFAULT_HOME_SECTIONS = {
  // ── Core (always on for new stores) ──────────────────────────────────────
  showHero: true,
  showCategories: true,
  showFeaturedProducts: true,
  showLatestProducts: true,
  // ── Sales Funnel (off by default — merchant enables as needed) ────────────
  showOfferStrip: false,
  showSocialProof: false,
  showBestSellers: false,
  showWhyChooseUs: false,
  showTestimonials: false,
  showAboutBrand: false,
  showNewsletter: false,
  showUrgency: false,
  showCollections: false,
  // ── Visual Builder (off by default — merchant designs as needed) ──────────
  showHeroBanner: false,
  showRichText: false,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {

  // ── 1. Default (Classic Light) ──────────────────────────────────────────
  default: {
    id: "default",
    name: "كلاسيك",
    description: "تصميم نظيف واحترافي مناسب لجميع أنواع المتاجر.",
    colorScheme: "light",
    categories: ["general", "electronics", "food", "home"],
    tokens: {
      primary: "#2563eb",
      primaryForeground: "#ffffff",
      secondary: "#f3f4f6",
      secondaryForeground: "#0a0d1a",
      background: "#ffffff",
      foreground: "#0a0d1a",
      surface: "#ffffff",
      surfaceForeground: "#0a0d1a",
      card: "#f8fafc",
      cardForeground: "#0a0d1a",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      accent: "#eff6ff",
      accentForeground: "#1e40af",
      heroOverlay:
        "linear-gradient(to left, rgba(0,0,0,.6), rgba(0,0,0,.15))",
      radius: "1rem",
      shadowSm: "0 1px 2px rgba(0,0,0,0.04)",
      shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.12)",
      glowPrimary: "none",
    },
    darkTokens: {
      background: "#0a0d1a",
      foreground: "#e4e7f0",
      surface: "#0f1221",
      surfaceForeground: "#e4e7f0",
      card: "#0f1221",
      cardForeground: "#e4e7f0",
      muted: "#161b2e",
      mutedForeground: "#8892b0",
      border: "#252d47",
      secondary: "#161b2e",
      secondaryForeground: "#e4e7f0",
      accent: "#161b2e",
      accentForeground: "#93c5fd",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.8), rgba(0,0,0,.3))",
      shadowSm: "0 1px 2px rgba(0,0,0,0.4)",
      shadowMd: "0 4px 12px rgba(0,0,0,0.5)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.6)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "default",
      animations: "subtle",
      buttonStyle: "rounded",
      imageAspectRatio: "square",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },
};

// ─── Backward-Compat: Legacy StoreTheme shape ─────────────────────────────
// Pages that import STORE_THEMES still work unchanged.

export type StoreTheme = {
  id: ThemePresetId;
  name: string;
  description: string;
  categories: ThemeCategoryId[];
  navbarVariant: StoreNavbarVariant;
  tokens: {
    primaryColor: string;
    secondaryColor: string;
    foreground: string;
    mutedForeground: string;
    background: string;
    surface: string;
    card: string;
    muted: string;
    border: string;
    radius: string;
    heroOverlay: string;
  };
};

function presetToLegacy(p: ThemePreset): StoreTheme {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    categories: p.categories,
    navbarVariant: p.layout.navbar as StoreNavbarVariant,
    tokens: {
      primaryColor: p.tokens.primary,
      secondaryColor: p.tokens.secondary,
      foreground: p.tokens.foreground,
      mutedForeground: p.tokens.mutedForeground,
      background: p.tokens.background,
      surface: p.tokens.surface,
      card: p.tokens.card,
      muted: p.tokens.muted,
      border: p.tokens.border,
      radius: p.tokens.radius,
      heroOverlay: p.tokens.heroOverlay,
    },
  };
}

export const STORE_THEMES: Record<StoreThemeId, StoreTheme> = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([id, preset]) => [id, presetToLegacy(preset)])
) as Record<StoreThemeId, StoreTheme>;

// ─── Resolver ─────────────────────────────────────────────────────────────

export function getThemePreset(id?: string | null): ThemePreset {
  if (id && isThemePresetId(id)) return THEME_PRESETS[id];
  return THEME_PRESETS.default;
}

/** Legacy helper — still works everywhere */
export function getStoreTheme(themeId?: string | null): StoreTheme {
  return presetToLegacy(getThemePreset(themeId));
}

/** Build a ResolvedTheme from a preset id + optional merchant customization JSON */
/**
 * When the merchant swaps primary/secondary, the preset's text colors may no
 * longer be readable on them (e.g. white on yellow). Pick a readable one —
 * unless the merchant set the foreground explicitly.
 */
function withReadableForegrounds(
  tokens: ThemeTokens,
  presetTokens: ThemeTokens,
  explicit?: Partial<ThemeTokens>,
): ThemeTokens {
  const next = { ...tokens };
  if (tokens.primary !== presetTokens.primary && !explicit?.primaryForeground && hexToRgb(tokens.primary)) {
    next.primaryForeground = readableOn(tokens.primary);
  }
  if (tokens.secondary !== presetTokens.secondary && !explicit?.secondaryForeground && hexToRgb(tokens.secondary)) {
    next.secondaryForeground = readableOn(tokens.secondary);
  }
  return next;
}

export function resolveStoreTheme(
  presetId: string | null | undefined,
  customization: ThemeCustomization | null | undefined,
  primaryColorOverride?: string | null,
  secondaryColorOverride?: string | null,
): ResolvedTheme {
  const preset = getThemePreset(presetId);

  const tokens = withReadableForegrounds(
    {
      ...preset.tokens,
      ...(primaryColorOverride ? { primary: primaryColorOverride } : {}),
      ...(secondaryColorOverride ? { secondary: secondaryColorOverride } : {}),
      ...(customization?.tokenOverrides ?? {}),
    },
    preset.tokens,
    customization?.tokenOverrides,
  );

  const layout = {
    ...preset.layout,
    ...(customization?.layoutOverrides ?? {}),
  };

  const sections = {
    home: {
      ...preset.sections.home,
      ...(customization?.sectionOverrides?.home ?? {}),
    },
  };

  // Merge dark token overrides from the preset, plus any merchant token
  // overrides that were also passed in customization.
  const darkTokens = preset.darkTokens
    ? {
        ...preset.darkTokens,
        ...(primaryColorOverride ? { primary: primaryColorOverride } : {}),
        ...(secondaryColorOverride ? { secondary: secondaryColorOverride } : {}),
        ...(customization?.tokenOverrides ?? {}),
      }
    : undefined;

  return {
    id: preset.id,
    colorScheme: preset.colorScheme,
    tokens,
    darkTokens,
    layout,
    sections,
    sectionContent: customization?.sectionContent ?? {},
  };
}
