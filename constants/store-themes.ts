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

  // ── 2. Riwaq (editorial · paper, ink & arches) ──────────────────────────
  riwaq: {
    id: "riwaq",
    name: "رواق",
    description: "تصميم تحريري بروح أروقة الأسواق القديمة: ورق دافئ، حبر، وأقواس.",
    colorScheme: "light",
    categories: ["fashion", "beauty", "home", "general"],
    tokens: {
      primary: "#a8432a",
      primaryForeground: "#fbf6ee",
      secondary: "#e6dfd2",
      secondaryForeground: "#1d1a16",
      background: "#f2ece1",
      foreground: "#1d1a16",
      surface: "#f8f4ec",
      surfaceForeground: "#1d1a16",
      card: "#eae3d6",
      cardForeground: "#1d1a16",
      muted: "#e6dfd2",
      mutedForeground: "#6a6157",
      border: "#d6ccbb",
      accent: "#efd9cb",
      accentForeground: "#7a2e1b",
      heroOverlay: "linear-gradient(to top, rgba(29,26,22,.7), rgba(29,26,22,0))",
      radius: "0rem",
      shadowSm: "none",
      shadowMd: "0 10px 30px -18px rgba(60,40,20,0.35)",
      shadowLg: "0 24px 60px -30px rgba(60,40,20,0.45)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#d9673f",
      primaryForeground: "#15120f",
      background: "#15120f",
      foreground: "#eee6d7",
      surface: "#1c1814",
      surfaceForeground: "#eee6d7",
      card: "#221d18",
      cardForeground: "#eee6d7",
      muted: "#26201a",
      mutedForeground: "#a99d8c",
      border: "#3a3229",
      secondary: "#26201a",
      secondaryForeground: "#eee6d7",
      accent: "#3a2219",
      accentForeground: "#f0b89f",
      heroOverlay: "linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0))",
      shadowMd: "0 10px 30px -18px rgba(0,0,0,0.7)",
      shadowLg: "0 24px 60px -30px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "centered",
      heroStyle: "split",
      productCardStyle: "elegant",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "spacious",
      animations: "subtle",
      buttonStyle: "sharp",
      imageAspectRatio: "portrait",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },

  // ── 3. Mada (premium modular · pine & signal) ───────────────────────────
  mada: {
    id: "mada",
    name: "مدى",
    description: "ثيم متكامل بأقسام مرنة، قائمة كبيرة، سلة جانبية، ونظرة سريعة على المنتجات.",
    colorScheme: "light",
    categories: ["fashion", "beauty", "electronics", "home", "general"],
    tokens: {
      primary: "#123b30",
      primaryForeground: "#f2f7ec",
      secondary: "#eceee8",
      secondaryForeground: "#121714",
      background: "#f7f7f4",
      foreground: "#121714",
      surface: "#ffffff",
      surfaceForeground: "#121714",
      card: "#ffffff",
      cardForeground: "#121714",
      muted: "#eceee8",
      mutedForeground: "#5b635e",
      border: "#e2e4de",
      accent: "#d5ee6a",
      accentForeground: "#121714",
      heroOverlay: "linear-gradient(to top, rgba(12,17,15,.65), rgba(12,17,15,0) 60%)",
      radius: "1.125rem",
      shadowSm: "0 1px 2px rgba(18,23,20,0.06)",
      shadowMd: "0 12px 32px -16px rgba(18,59,48,0.22)",
      shadowLg: "0 30px 70px -30px rgba(18,59,48,0.35)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#d5ee6a",
      primaryForeground: "#0c110f",
      secondary: "#19211d",
      secondaryForeground: "#eef2ec",
      background: "#0c110f",
      foreground: "#eef2ec",
      surface: "#131a17",
      surfaceForeground: "#eef2ec",
      card: "#131a17",
      cardForeground: "#eef2ec",
      muted: "#19211d",
      mutedForeground: "#9ba59e",
      border: "#26302b",
      accent: "#d5ee6a",
      accentForeground: "#0c110f",
      heroOverlay: "linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0) 60%)",
      shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
      shadowMd: "0 12px 32px -16px rgba(0,0,0,0.7)",
      shadowLg: "0 30px 70px -30px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "default",
      animations: "subtle",
      buttonStyle: "pill",
      imageAspectRatio: "portrait",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
      },
    },
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
  if (process.env.NODE_ENV === "development") return THEME_PRESETS.mada; // QA-TEMP — remove
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
