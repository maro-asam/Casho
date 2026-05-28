// ─────────────────────────────────────────────────────────────────────────────
//  Store Theme Registry
//  Source of truth for all built-in theme presets.
//  Each preset = tokens + layout config + section defaults.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ThemePreset,
  ThemePresetId,
  ThemeCustomization,
  ResolvedTheme,
} from "@/types/store-theme.types";
import { THEME_PRESET_IDS, isThemePresetId } from "@/types/store-theme.types";
import type { StoreNavbarVariant } from "@/constants/store-navbar";

export { THEME_PRESET_IDS, isThemePresetId };
export type { ThemePresetId };

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

  // ── 2. Bold ─────────────────────────────────────────────────────────────
  bold: {
    id: "bold",
    name: "بولد",
    description: "تصميم جريء وعصري بأسلوب المجلات الفاخرة.",
    colorScheme: "light",
    tokens: {
      primary: "#111111",
      primaryForeground: "#ffffff",
      secondary: "#f4f1ee",
      secondaryForeground: "#0a0d1a",
      background: "#fafaf8",
      foreground: "#0a0d1a",
      surface: "#ffffff",
      surfaceForeground: "#0a0d1a",
      card: "#ffffff",
      cardForeground: "#0a0d1a",
      muted: "#f4f1ee",
      mutedForeground: "#64748b",
      border: "#e5e0d9",
      accent: "#f4f1ee",
      accentForeground: "#0a0d1a",
      heroOverlay:
        "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)",
      radius: "0.375rem",
      shadowSm: "0 1px 3px rgba(0,0,0,0.06)",
      shadowMd: "0 4px 16px rgba(0,0,0,0.10)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.14)",
      glowPrimary: "none",
    },
    darkTokens: {
      background: "#111111",
      foreground: "#f0f0f0",
      surface: "#191919",
      surfaceForeground: "#f0f0f0",
      card: "#191919",
      cardForeground: "#f0f0f0",
      muted: "#222222",
      mutedForeground: "#a0a0a0",
      border: "#333333",
      secondary: "#222222",
      secondaryForeground: "#f0f0f0",
      accent: "#222222",
      accentForeground: "#f0f0f0",
      heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
      shadowSm: "0 1px 3px rgba(0,0,0,0.5)",
      shadowMd: "0 4px 16px rgba(0,0,0,0.6)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.7)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "bold",
      categoryCardStyle: "square",
      desktopGridCols: 3,
      density: "spacious",
      animations: "subtle",
      buttonStyle: "sharp",
      imageAspectRatio: "portrait",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },

  // ── 3. Elegant ──────────────────────────────────────────────────────────
  elegant: {
    id: "elegant",
    name: "أنيق",
    description: "بوتيك فاخر بتصميم هادئ ومساحات واسعة — مثالي للموضة والمجوهرات.",
    colorScheme: "light",
    tokens: {
      primary: "#9b7d5a",
      primaryForeground: "#ffffff",
      secondary: "#f5f0eb",
      secondaryForeground: "#2c2017",
      background: "#faf9f7",
      foreground: "#2c2017",
      surface: "#ffffff",
      surfaceForeground: "#2c2017",
      card: "#ffffff",
      cardForeground: "#2c2017",
      muted: "#f0ece6",
      mutedForeground: "#8a7060",
      border: "#e8e0d5",
      accent: "#f5f0eb",
      accentForeground: "#2c2017",
      heroOverlay:
        "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)",
      radius: "0px",
      shadowSm: "0 1px 3px rgba(44,32,23,0.06)",
      shadowMd: "0 4px 16px rgba(44,32,23,0.08)",
      shadowLg: "0 20px 40px rgba(44,32,23,0.12)",
      glowPrimary: "none",
    },
    darkTokens: {
      background: "#18120a",
      foreground: "#f0e8d8",
      surface: "#221a0f",
      surfaceForeground: "#f0e8d8",
      card: "#221a0f",
      cardForeground: "#f0e8d8",
      muted: "#2a2015",
      mutedForeground: "#9a8878",
      border: "#3a3020",
      secondary: "#2a2015",
      secondaryForeground: "#f0e8d8",
      accent: "#2a2015",
      accentForeground: "#d4b896",
      heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
      shadowSm: "0 1px 3px rgba(0,0,0,0.4)",
      shadowMd: "0 4px 16px rgba(0,0,0,0.5)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.6)",
    },
    layout: {
      navbar: "centered",
      heroStyle: "split",
      productCardStyle: "elegant",
      categoryCardStyle: "circle",
      desktopGridCols: 4,
      density: "spacious",
      animations: "subtle",
      buttonStyle: "sharp",
      imageAspectRatio: "portrait",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },

  // ── 4. Modern ───────────────────────────────────────────────────────────
  modern: {
    id: "modern",
    name: "عصري",
    description: "واجهة حيوية بألوان مميزة وبطاقات عصرية — مناسبة للإلكترونيات والأزياء.",
    colorScheme: "light",
    tokens: {
      primary: "#6366f1",
      primaryForeground: "#ffffff",
      secondary: "#f0f0ff",
      secondaryForeground: "#0f0f1a",
      background: "#f8f9fb",
      foreground: "#0f0f1a",
      surface: "#ffffff",
      surfaceForeground: "#0f0f1a",
      card: "#ffffff",
      cardForeground: "#0f0f1a",
      muted: "#f0f2f8",
      mutedForeground: "#64748b",
      border: "#e4e8f0",
      accent: "#eef2ff",
      accentForeground: "#3730a3",
      heroOverlay:
        "linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.75) 100%)",
      radius: "1.25rem",
      shadowSm: "0 1px 3px rgba(99,102,241,0.08)",
      shadowMd: "0 4px 16px rgba(99,102,241,0.12)",
      shadowLg: "0 20px 40px rgba(99,102,241,0.18)",
      glowPrimary: "0 0 16px rgba(99,102,241,0.35)",
    },
    darkTokens: {
      background: "#09090f",
      foreground: "#e8e8ff",
      surface: "#0f0f1a",
      surfaceForeground: "#e8e8ff",
      card: "#0f0f1a",
      cardForeground: "#e8e8ff",
      muted: "#16162a",
      mutedForeground: "#7070a0",
      border: "#252540",
      secondary: "#16162a",
      secondaryForeground: "#e8e8ff",
      accent: "#16162a",
      accentForeground: "#a5b4fc",
      heroOverlay: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.8) 100%)",
      shadowSm: "0 1px 3px rgba(99,102,241,0.2)",
      shadowMd: "0 4px 16px rgba(99,102,241,0.25)",
      shadowLg: "0 20px 40px rgba(99,102,241,0.35)",
      glowPrimary: "0 0 24px rgba(99,102,241,0.5)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "pill",
      desktopGridCols: 4,
      density: "default",
      animations: "dynamic",
      buttonStyle: "pill",
      imageAspectRatio: "square",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },

  // ── 5. Minimal ──────────────────────────────────────────────────────────
  minimal: {
    id: "minimal",
    name: "مينيمال",
    description: "أبيض نقي، خطوط رفيعة، ومساحات هوائية — جمال التبسيط الكامل.",
    colorScheme: "light",
    tokens: {
      primary: "#171717",
      primaryForeground: "#ffffff",
      secondary: "#f5f5f5",
      secondaryForeground: "#171717",
      background: "#ffffff",
      foreground: "#171717",
      surface: "#ffffff",
      surfaceForeground: "#171717",
      card: "#fafafa",
      cardForeground: "#171717",
      muted: "#f5f5f5",
      mutedForeground: "#a3a3a3",
      border: "#e5e5e5",
      accent: "#f5f5f5",
      accentForeground: "#171717",
      heroOverlay: "none",
      radius: "0px",
      shadowSm: "0 1px 2px rgba(0,0,0,0.03)",
      shadowMd: "0 2px 8px rgba(0,0,0,0.05)",
      shadowLg: "0 8px 24px rgba(0,0,0,0.07)",
      glowPrimary: "none",
    },
    darkTokens: {
      background: "#0a0a0a",
      foreground: "#f5f5f5",
      surface: "#141414",
      surfaceForeground: "#f5f5f5",
      card: "#141414",
      cardForeground: "#f5f5f5",
      muted: "#1a1a1a",
      mutedForeground: "#888888",
      border: "#2a2a2a",
      secondary: "#141414",
      secondaryForeground: "#f5f5f5",
      accent: "#141414",
      accentForeground: "#f5f5f5",
      heroOverlay: "none",
      shadowSm: "0 1px 2px rgba(0,0,0,0.4)",
      shadowMd: "0 2px 8px rgba(0,0,0,0.5)",
      shadowLg: "0 8px 24px rgba(0,0,0,0.6)",
    },
    layout: {
      navbar: "compact",
      heroStyle: "minimal",
      productCardStyle: "minimal",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "spacious",
      animations: "none",
      buttonStyle: "sharp",
      imageAspectRatio: "portrait",
    },
    sections: { home: { ...DEFAULT_HOME_SECTIONS } },
  },

  // ── 6. Dark (Luxury) ────────────────────────────────────────────────────
  dark: {
    id: "dark",
    name: "داكن",
    description: "خلفية ليلية أنيقة مع إضاءات نيون — مثالية للتقنية والألعاب والموضة.",
    colorScheme: "dark",
    tokens: {
      primary: "#a78bfa",
      primaryForeground: "#0d0d14",
      secondary: "#1e1b4b",
      secondaryForeground: "#f1f5f9",
      background: "#0d0d14",
      foreground: "#f1f5f9",
      surface: "#13131f",
      surfaceForeground: "#f1f5f9",
      card: "#16162a",
      cardForeground: "#f1f5f9",
      muted: "#1e1e30",
      mutedForeground: "#94a3b8",
      border: "#2e2e45",
      accent: "#1e1e30",
      accentForeground: "#f1f5f9",
      heroOverlay:
        "linear-gradient(to bottom, rgba(13,13,20,0.2) 0%, rgba(13,13,20,0.85) 100%)",
      radius: "0.75rem",
      shadowSm: "0 1px 3px rgba(0,0,0,0.4)",
      shadowMd: "0 4px 16px rgba(0,0,0,0.5)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.6)",
      glowPrimary:
        "0 0 24px color-mix(in srgb, var(--store-primary) 40%, transparent)",
    },
    darkTokens: {
      background: "#0d0d14",
      foreground: "#f1f5f9",
      surface: "#13131f",
      surfaceForeground: "#f1f5f9",
      card: "#16162a",
      cardForeground: "#f1f5f9",
      muted: "#1e1e30",
      mutedForeground: "#94a3b8",
      border: "#2e2e45",
      accent: "#1e1e30",
      accentForeground: "#f1f5f9",
      heroOverlay: "linear-gradient(to bottom, rgba(13,13,20,0.2) 0%, rgba(13,13,20,0.85) 100%)",
      shadowSm: "0 1px 3px rgba(0,0,0,0.4)",
      shadowMd: "0 4px 16px rgba(0,0,0,0.5)",
      shadowLg: "0 20px 40px rgba(0,0,0,0.6)",
      glowPrimary: "0 0 24px color-mix(in srgb, var(--store-primary) 40%, transparent)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "bold",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "default",
      animations: "dynamic",
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
export function resolveStoreTheme(
  presetId: string | null | undefined,
  customization: ThemeCustomization | null | undefined,
  primaryColorOverride?: string | null,
  secondaryColorOverride?: string | null,
): ResolvedTheme {
  const preset = getThemePreset(presetId);

  const tokens = {
    ...preset.tokens,
    ...(primaryColorOverride ? { primary: primaryColorOverride } : {}),
    ...(secondaryColorOverride ? { secondary: secondaryColorOverride } : {}),
    ...(customization?.tokenOverrides ?? {}),
  };

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
