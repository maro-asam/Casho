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
import { tr } from "@/lib/i18n/dashboard";

export { THEME_PRESET_IDS, isThemePresetId };
export type { ThemePresetId, ThemeCategoryId };

// ─── Theme Categories ─────────────────────────────────────────────────────

export const THEME_CATEGORIES: Record<ThemeCategoryId, { label: string; description: string }> = {
  general: { get label() { return tr("متجر عام"); }, get description() { return tr("مناسب لأي نوع من المنتجات"); } },
  fashion: { get label() { return tr("أزياء وإكسسوارات"); }, get description() { return tr("ملابس، شنط، أحذية، ومجوهرات"); } },
  electronics: { get label() { return tr("إلكترونيات وتقنية"); }, get description() { return tr("موبايلات، أجهزة، جيمنج، وإكسسواراتها"); } },
  beauty: { get label() { return tr("تجميل وعطور"); }, get description() { return tr("مستحضرات تجميل، عناية، وعطور"); } },
  food: { get label() { return tr("أكل ومشروبات"); }, get description() { return tr("مطاعم، حلويات، قهوة، ومنتجات غذائية"); } },
  home: { get label() { return tr("منزل وديكور"); }, get description() { return tr("أثاث، ديكور، وأدوات منزلية"); } },
  health: { get label() { return tr("صيدليات وصحة"); }, get description() { return tr("أدوية، فيتامينات، عناية شخصية، ومستلزمات طبية"); } },
  sports: { get label() { return tr("جيم ورياضة"); }, get description() { return tr("مكملات، أدوات جيم، ملابس رياضية، ومعدات"); } },
  grocery: { get label() { return tr("سوبر ماركت وأكشاك"); }, get description() { return tr("سوبر ماركت، بقالة، أكشاك، خضار وفاكهة، ومنتجات يومية"); } },
  jewelry: { get label() { return tr("مجوهرات وإكسسوارات"); }, get description() { return tr("دهب، فضة، إكسسوارات، ساعات، وهدايا"); } },
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
  // ── Theme-specific ────────────────────────────────────────────────────────
  showCalculator: false,
  showShoppingList: false,
  showSpotlight: false,
  showGiftFinder: false,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  THEME PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {

  // ── 1. Default (Classic Light) ──────────────────────────────────────────
  default: {
    id: "default",
    get name() { return tr("كلاسيك"); },
    get description() { return tr("تصميم نظيف واحترافي مناسب لجميع أنواع المتاجر."); },
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
    get name() { return tr("رواق"); },
    get description() { return tr("تصميم تحريري بروح أروقة الأسواق القديمة: ورق دافئ، حبر، وأقواس."); },
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
    get name() { return tr("مدى"); },
    get description() { return tr("ثيم متكامل بأقسام مرنة، قائمة كبيرة، سلة جانبية، ونظرة سريعة على المنتجات."); },
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

  // ── 4. Casho Dune (editorial · fog, ink & umber) ────────────────────────
  dune: {
    id: "dune",
    get name() { return tr("كاشو ديون"); },
    get description() { return tr("ثيم تحريري فاخر: صور كبيرة، عناوين Serif، هيدر شفاف فوق الهيرو، قائمة كبيرة، سلة جانبية، وحركة هادية."); },
    colorScheme: "light",
    categories: ["general", "fashion", "beauty", "home", "electronics", "food"],
    tokens: {
      primary: "#2a2a28",
      primaryForeground: "#fafaf8",
      secondary: "#e5e5e5",
      secondaryForeground: "#2a2a28",
      background: "#f7f7f7",
      foreground: "#2a2a28",
      surface: "#fcfcfc",
      surfaceForeground: "#2a2a28",
      card: "#f0eee9",
      cardForeground: "#2a2a28",
      muted: "#e5e5e5",
      mutedForeground: "#68645d",
      border: "#ccc9c1",
      accent: "#785c43",
      accentForeground: "#f5f3f0",
      heroOverlay: "linear-gradient(to top, rgba(20,20,18,.6), rgba(20,20,18,0) 55%)",
      radius: "0rem",
      shadowSm: "none",
      shadowMd: "0 12px 32px -18px rgba(42,42,40,0.3)",
      shadowLg: "0 24px 60px -28px rgba(42,42,40,0.35)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#ece9e3",
      primaryForeground: "#161513",
      secondary: "#24221f",
      secondaryForeground: "#ece9e3",
      background: "#161513",
      foreground: "#ece9e3",
      surface: "#1d1c1a",
      surfaceForeground: "#ece9e3",
      card: "#22201d",
      cardForeground: "#ece9e3",
      muted: "#2a2825",
      mutedForeground: "#a8a29a",
      border: "#3a3733",
      accent: "#c7b8a1",
      accentForeground: "#161513",
      heroOverlay: "linear-gradient(to top, rgba(0,0,0,.7), rgba(0,0,0,0) 55%)",
      shadowMd: "0 12px 32px -18px rgba(0,0,0,0.7)",
      shadowLg: "0 24px 60px -28px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "minimal",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "spacious",
      animations: "subtle",
      buttonStyle: "pill",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
      },
    },
  },

  // ── 5. Maximize (large catalog · emerald, grey plates & red deals) ─────────
  maximize: {
    id: "maximize",
    get name() { return tr("ماكسيمايز"); },
    get description() { return tr("ثيم للمتاجر الكبيرة: بحث بالتصنيف، قائمة تصنيفات كبيرة، شبكة عروض، منتجات كثيفة بفلاتر، نظرة سريعة، وسلة جانبية."); },
    colorScheme: "light",
    categories: ["electronics", "general", "home", "beauty", "fashion"],
    tokens: {
      primary: "#0b7f6f",
      primaryForeground: "#ffffff",
      secondary: "#e7e7e7",
      secondaryForeground: "#393838",
      background: "#ffffff",
      foreground: "#100f0f",
      surface: "#ffffff",
      surfaceForeground: "#100f0f",
      card: "#f4f4f5",
      cardForeground: "#100f0f",
      muted: "#f4f4f5",
      mutedForeground: "#686b73",
      border: "#e7e7ea",
      accent: "#e3f4f1",
      accentForeground: "#075e52",
      heroOverlay: "linear-gradient(to left, rgba(16,15,15,.7), rgba(16,15,15,0) 70%)",
      radius: "0.625rem",
      shadowSm: "0 2px 10px -4px rgba(16,24,40,0.14)",
      shadowMd: "0 10px 30px -14px rgba(16,24,40,0.22)",
      shadowLg: "0 18px 50px -20px rgba(16,24,40,0.28)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#2bbfa8",
      primaryForeground: "#0b1512",
      secondary: "#2a3a4b",
      secondaryForeground: "#ffffff",
      background: "#171a22",
      foreground: "#ffffff",
      surface: "#1d212b",
      surfaceForeground: "#ffffff",
      card: "#232834",
      cardForeground: "#ffffff",
      muted: "#232834",
      mutedForeground: "#a9adb8",
      border: "#2c313d",
      accent: "#12332f",
      accentForeground: "#7fdcc9",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.75), rgba(0,0,0,0) 70%)",
      shadowSm: "0 2px 10px -4px rgba(0,0,0,0.6)",
      shadowMd: "0 10px 30px -14px rgba(0,0,0,0.7)",
      shadowLg: "0 18px 50px -20px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "default",
      heroStyle: "split",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 5,
      density: "compact",
      animations: "subtle",
      buttonStyle: "rounded",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
      },
    },
  },

  // ── 6. Cello (electronics · Casho blue, navy chrome & yellow search) ────────
  cello: {
    id: "cello",
    get name() { return tr("تشيلو"); },
    get description() { return tr("ثيم إلكترونيات أنيق: سلايدر رئيسي، بحث كبير، قائمة تصنيفات، عروض بعدّاد، كروت منتجات بنظرة سريعة، وفوتر كحلي."); },
    colorScheme: "light",
    categories: ["electronics", "general", "home", "fashion"],
    tokens: {
      primary: "#1447e6",
      primaryForeground: "#ffffff",
      secondary: "#fdc500",
      secondaryForeground: "#202020",
      background: "#f8f8f8",
      foreground: "#202020",
      surface: "#ffffff",
      surfaceForeground: "#202020",
      card: "#ffffff",
      cardForeground: "#202020",
      muted: "#f1f2f4",
      mutedForeground: "#5d6470",
      border: "#e6e8ec",
      accent: "#e9effd",
      accentForeground: "#0f37b4",
      heroOverlay: "linear-gradient(to left, rgba(0,20,60,.65), rgba(0,20,60,0) 70%)",
      radius: "0.5rem",
      shadowSm: "0 1px 3px rgba(16,24,40,0.08)",
      shadowMd: "0 8px 24px -12px rgba(16,24,40,0.2)",
      shadowLg: "0 18px 50px -20px rgba(16,24,40,0.28)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#4d7bff",
      primaryForeground: "#ffffff",
      secondary: "#fdc500",
      secondaryForeground: "#1a1a1a",
      background: "#0f1420",
      foreground: "#f2f4f8",
      surface: "#161c2b",
      surfaceForeground: "#f2f4f8",
      card: "#161c2b",
      cardForeground: "#f2f4f8",
      muted: "#1c2335",
      mutedForeground: "#a3abbd",
      border: "#263049",
      accent: "#16224a",
      accentForeground: "#a9c0ff",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.75), rgba(0,0,0,0) 70%)",
      shadowSm: "0 1px 3px rgba(0,0,0,0.5)",
      shadowMd: "0 8px 24px -12px rgba(0,0,0,0.7)",
      shadowLg: "0 18px 50px -20px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 5,
      density: "default",
      animations: "subtle",
      buttonStyle: "rounded",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
      },
    },
  },

  // ── 7. Casho Medical (pharmacy · clinical teal, mint & white) ──────────────
  medical: {
    id: "medical",
    get name() { return tr("كاشو ميديكال"); },
    get description() { return tr("ثيم طبي احترافي للصيدليات: بحث كبير، أقسام بأيقونات، روشتة على واتساب، اسأل الصيدلي، كروت منتجات واضحة، وسلة جانبية."); },
    colorScheme: "light",
    categories: ["health", "beauty", "general"],
    tokens: {
      primary: "#0a6c74",
      primaryForeground: "#ffffff",
      secondary: "#e3f3f1",
      secondaryForeground: "#0a4a50",
      background: "#f4f8f8",
      foreground: "#0f2a2e",
      surface: "#ffffff",
      surfaceForeground: "#0f2a2e",
      card: "#ffffff",
      cardForeground: "#0f2a2e",
      muted: "#ecf3f3",
      mutedForeground: "#56706f",
      border: "#d9e6e6",
      accent: "#dcf0ed",
      accentForeground: "#07595f",
      heroOverlay: "linear-gradient(to left, rgba(4,34,38,.72), rgba(4,34,38,.08) 70%)",
      radius: "0.875rem",
      shadowSm: "0 1px 2px rgba(10,40,44,0.05)",
      shadowMd: "0 10px 28px -14px rgba(10,40,44,0.22)",
      shadowLg: "0 22px 50px -22px rgba(10,40,44,0.3)",
      glowPrimary: "none",
    },
    darkTokens: {
      primary: "#2ab3aa",
      primaryForeground: "#04201f",
      secondary: "#12302f",
      secondaryForeground: "#bfe8e3",
      background: "#0a1617",
      foreground: "#e5f1f0",
      surface: "#0f1f20",
      surfaceForeground: "#e5f1f0",
      card: "#112324",
      cardForeground: "#e5f1f0",
      muted: "#15292a",
      mutedForeground: "#93aeae",
      border: "#21393a",
      accent: "#12302f",
      accentForeground: "#7fd8cf",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.78), rgba(0,0,0,.1) 70%)",
      shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
      shadowMd: "0 10px 28px -14px rgba(0,0,0,0.7)",
      shadowLg: "0 22px 50px -22px rgba(0,0,0,0.8)",
    },
    layout: {
      navbar: "compact",
      heroStyle: "split",
      productCardStyle: "default",
      categoryCardStyle: "circle",
      desktopGridCols: 5,
      density: "default",
      animations: "subtle",
      buttonStyle: "rounded",
      imageAspectRatio: "square",
      // The Studio's "pharmacy features" switch (Layout panel) turns this off.
      pharmacy: true,
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
      },
    },
  },

  // ── 8. Casho Gym (supplements & equipment · iron, chalk & gym red) ─────────
  // Dark by default. gym.css mixes every surface from background / foreground /
  // primary, so these tokens only seed the look; the Studio repaints all of it.
  gym: {
    id: "gym",
    get name() { return tr("كاشو جيم"); },
    get description() { return tr("ثيم جيم قوي للمكملات والأدوات: أسود وأحمر، هيرو ضخم، أقسام زي الأوزان، ترتيب الأكثر مبيعًا، عروض بعدّاد، وحاسبة بروتين."); },
    colorScheme: "dark",
    categories: ["sports", "health"],
    tokens: {
      primary: "#e10600",
      primaryForeground: "#ffffff",
      secondary: "#efece6",
      secondaryForeground: "#121214",
      background: "#0b0b0d",
      foreground: "#f5f3ef",
      surface: "#151518",
      surfaceForeground: "#f5f3ef",
      card: "#151518",
      cardForeground: "#f5f3ef",
      muted: "#1c1c20",
      mutedForeground: "#a3a19c",
      border: "#2a2a2f",
      accent: "#2a0d0c",
      accentForeground: "#ff6a5e",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.82), rgba(0,0,0,.12) 72%)",
      radius: "0.25rem",
      shadowSm: "0 2px 10px -4px rgba(0,0,0,0.5)",
      shadowMd: "0 12px 30px -14px rgba(0,0,0,0.7)",
      shadowLg: "0 24px 56px -24px rgba(0,0,0,0.75)",
      glowPrimary: "0 22px 50px -24px rgba(225,6,0,0.7)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "default",
      animations: "dynamic",
      buttonStyle: "sharp",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
        showUrgency: true,
        showCalculator: true,
        sectionOrder: [
          "showHero",
          "showHeroBanner",
          "showOfferStrip",
          "showCategories",
          "showBestSellers",
          "showUrgency",
          "showFeaturedProducts",
          "showCollections",
          "showCalculator",
          "showLatestProducts",
          "showSocialProof",
          "showWhyChooseUs",
          "showTestimonials",
          "showAboutBrand",
          "showRichText",
          "showNewsletter",
        ],
      },
    },
  },
  // ── 9. Casho Market (supermarkets & kiosks · Apple's language, in orange) ─
  // Adaptive: market.css mixes every surface from background / foreground, and
  // darkTokens only swap those two plus the tints. See market/DESIGN.md.
  market: {
    id: "market",
    get name() { return tr("كاشو ماركت"); },
    get description() { return tr("ثيم سوبر ماركت وأكشاك بروح Apple: فاتح وغامق، أقسام زي أيقونات الموبايل، زرار + بيتحول لعدّاد على الكارت، شريط سفلي زي التطبيقات، وقايمة مشتريات تتبعت واتساب."); },
    colorScheme: "light",
    adaptive: true,
    categories: ["grocery", "food"],
    tokens: {
      primary: "#f26a00",
      primaryForeground: "#ffffff",
      secondary: "#fff1e4",
      secondaryForeground: "#7a3500",
      background: "#ffffff",
      foreground: "#1d1d1f",
      surface: "#ffffff",
      surfaceForeground: "#1d1d1f",
      card: "#f5f5f7",
      cardForeground: "#1d1d1f",
      muted: "#ededf0",
      mutedForeground: "#6e6e73",
      border: "#e2e2e7",
      accent: "#fff1e4",
      accentForeground: "#a84a00",
      heroOverlay: "linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.28) 45%, rgba(0,0,0,0) 72%)",
      radius: "1.125rem",
      shadowSm: "0 1px 3px rgba(0,0,0,0.06)",
      shadowMd: "0 8px 24px -8px rgba(0,0,0,0.12)",
      shadowLg: "0 24px 56px -20px rgba(0,0,0,0.18)",
      glowPrimary: "0 12px 28px -12px rgba(242,106,0,0.5)",
    },
    darkTokens: {
      primary: "#ff9230",
      primaryForeground: "#1f1000",
      secondary: "#3a2410",
      secondaryForeground: "#ffd9b5",
      background: "#000000",
      foreground: "#f5f5f7",
      surface: "#1c1c1e",
      surfaceForeground: "#f5f5f7",
      card: "#1c1c1e",
      cardForeground: "#f5f5f7",
      muted: "#2c2c2e",
      mutedForeground: "#a1a1a6",
      border: "#38383a",
      accent: "#3a2410",
      accentForeground: "#ffb067",
      shadowSm: "0 1px 3px rgba(0,0,0,0.5)",
      shadowMd: "0 8px 24px -8px rgba(0,0,0,0.6)",
      shadowLg: "0 24px 56px -20px rgba(0,0,0,0.75)",
      glowPrimary: "0 12px 28px -12px rgba(255,146,48,0.45)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 5,
      density: "default",
      animations: "subtle",
      buttonStyle: "pill",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
        showUrgency: true,
        showCollections: true,
        showShoppingList: true,
        sectionOrder: [
          "showHero",
          "showCategories",
          "showOfferStrip",
          "showBestSellers",
          "showUrgency",
          "showFeaturedProducts",
          "showShoppingList",
          "showHeroBanner",
          "showCollections",
          "showLatestProducts",
          "showWhyChooseUs",
          "showSocialProof",
          "showTestimonials",
          "showAboutBrand",
          "showRichText",
          "showNewsletter",
        ],
      },
    },
  },
  // ── 10. Casho Stage (brands, any field · apple.com's store, light and dark) ─
  // Adaptive like Market: stage.css mixes every surface from background /
  // foreground; the night tiles stay dark in both modes. See stage/DESIGN.md.
  stage: {
    id: "stage",
    get name() { return tr("كاشو ستيدج"); },
    get description() { return tr("ثيم براندات بروح موقع Apple: عناوين ضخمة، بلاطات فاتحة وغامقة، منتج تحت الأضواء بيتحرك مع السكرول، صفحة شراء زي Apple بشريط ثابت، وفاتح وغامق. ينفع لأي مجال."); },
    colorScheme: "light",
    adaptive: true,
    categories: ["general", "fashion", "electronics", "beauty", "home"],
    tokens: {
      primary: "#0071e3",
      primaryForeground: "#ffffff",
      secondary: "#e8f1fc",
      secondaryForeground: "#0b4f9c",
      background: "#ffffff",
      foreground: "#1d1d1f",
      surface: "#ffffff",
      surfaceForeground: "#1d1d1f",
      card: "#f5f5f7",
      cardForeground: "#1d1d1f",
      muted: "#f5f5f7",
      mutedForeground: "#6e6e73",
      border: "#d2d2d7",
      accent: "#f5f5f7",
      accentForeground: "#1d1d1f",
      heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,.66), rgba(0,0,0,.24) 40%, rgba(0,0,0,0) 62%)",
      radius: "1.125rem",
      shadowSm: "0 2px 8px rgba(0,0,0,0.04)",
      shadowMd: "0 4px 18px rgba(0,0,0,0.08)",
      shadowLg: "0 22px 50px -20px rgba(0,0,0,0.25)",
      glowPrimary: "0 12px 28px -12px rgba(0,113,227,0.45)",
    },
    darkTokens: {
      primary: "#0a84ff",
      primaryForeground: "#ffffff",
      secondary: "#0d2a4a",
      secondaryForeground: "#a8d1ff",
      background: "#000000",
      foreground: "#f5f5f7",
      surface: "#1c1c1e",
      surfaceForeground: "#f5f5f7",
      card: "#1c1c1e",
      cardForeground: "#f5f5f7",
      muted: "#1c1c1e",
      mutedForeground: "#a1a1a6",
      border: "#424245",
      accent: "#1c1c1e",
      accentForeground: "#f5f5f7",
      shadowSm: "0 2px 8px rgba(0,0,0,0.5)",
      shadowMd: "0 4px 18px rgba(0,0,0,0.6)",
      shadowLg: "0 22px 50px -20px rgba(0,0,0,0.8)",
      glowPrimary: "0 12px 28px -12px rgba(10,132,255,0.5)",
    },
    layout: {
      navbar: "default",
      heroStyle: "fullscreen",
      productCardStyle: "default",
      categoryCardStyle: "square",
      desktopGridCols: 4,
      density: "default",
      animations: "dynamic",
      buttonStyle: "pill",
      imageAspectRatio: "square",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
        showCollections: true,
        showWhyChooseUs: true,
        showNewsletter: true,
        showSpotlight: true,
        sectionOrder: [
          "showHero",
          "showCategories",
          "showOfferStrip",
          "showFeaturedProducts",
          "showSpotlight",
          "showCollections",
          "showBestSellers",
          "showUrgency",
          "showLatestProducts",
          "showHeroBanner",
          "showWhyChooseUs",
          "showSocialProof",
          "showTestimonials",
          "showAboutBrand",
          "showRichText",
          "showNewsletter",
        ],
      },
    },
  },
  // ── 11. Casho Qirat (jewelers & accessories · the jeweler's vitrine) ─────
  // Adaptive like Stage: qirat.css mixes every surface from background /
  // foreground and the gold from accent; velvet bands follow the merchant's
  // primary. See qirat/DESIGN.md.
  qirat: {
    id: "qirat",
    get name() { return tr("كاشو قيراط"); },
    get description() { return tr("ثيم مجوهرات وإكسسوارات فاخر: خط سيريف راقي وتفاصيل دهبي رفيعة، كروت زي علب المجوهرات بلمعة على الصورة، ألوان المعادن على حقيقتها، قايمة أمنيات تتبعت لحد يهاديك، دليل مقاسات الخواتم، ومساعد هدايا. فاتح وغامق."); },
    colorScheme: "light",
    adaptive: true,
    categories: ["jewelry", "fashion", "beauty"],
    tokens: {
      primary: "#1f1a14",
      primaryForeground: "#fbf8f2",
      secondary: "#f4ede1",
      secondaryForeground: "#5b4630",
      background: "#fbf9f5",
      foreground: "#1f1a14",
      surface: "#ffffff",
      surfaceForeground: "#1f1a14",
      card: "#f5f0e8",
      cardForeground: "#1f1a14",
      muted: "#efe8dd",
      mutedForeground: "#6f6457",
      border: "#e6dccd",
      accent: "#b08d57",
      accentForeground: "#1f1a14",
      heroOverlay: "linear-gradient(to top, rgba(18,14,10,.74), rgba(18,14,10,.2) 48%, rgba(18,14,10,0) 72%)",
      radius: "0.375rem",
      shadowSm: "0 1px 2px rgba(31,26,20,0.05)",
      shadowMd: "0 10px 30px -12px rgba(31,26,20,0.14)",
      shadowLg: "0 30px 60px -24px rgba(31,26,20,0.22)",
      glowPrimary: "0 14px 30px -14px rgba(176,141,87,0.55)",
    },
    darkTokens: {
      primary: "#d8bd8a",
      primaryForeground: "#17130e",
      secondary: "#2a2219",
      secondaryForeground: "#ead9bb",
      background: "#100d0a",
      foreground: "#f1eadf",
      surface: "#1a1611",
      surfaceForeground: "#f1eadf",
      card: "#1a1611",
      cardForeground: "#f1eadf",
      muted: "#241e17",
      mutedForeground: "#b3a795",
      border: "#3a3128",
      accent: "#c9a66b",
      accentForeground: "#17130e",
      shadowSm: "0 1px 2px rgba(0,0,0,0.5)",
      shadowMd: "0 10px 30px -12px rgba(0,0,0,0.6)",
      shadowLg: "0 30px 60px -24px rgba(0,0,0,0.75)",
      glowPrimary: "0 14px 30px -14px rgba(216,189,138,0.45)",
    },
    layout: {
      navbar: "centered",
      heroStyle: "fullscreen",
      productCardStyle: "elegant",
      categoryCardStyle: "circle",
      desktopGridCols: 4,
      density: "default",
      animations: "subtle",
      buttonStyle: "sharp",
      imageAspectRatio: "portrait",
    },
    sections: {
      home: {
        ...DEFAULT_HOME_SECTIONS,
        showBestSellers: true,
        showCollections: true,
        showGiftFinder: true,
        showWhyChooseUs: true,
        showAboutBrand: true,
        showNewsletter: true,
        sectionOrder: [
          "showHero",
          "showOfferStrip",
          "showCategories",
          "showFeaturedProducts",
          "showCollections",
          "showBestSellers",
          "showGiftFinder",
          "showUrgency",
          "showHeroBanner",
          "showLatestProducts",
          "showWhyChooseUs",
          "showAboutBrand",
          "showSocialProof",
          "showTestimonials",
          "showRichText",
          "showNewsletter",
        ],
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
const SURFACE_TOKENS = ["background", "foreground", "surface", "surfaceForeground", "card", "cardForeground", "muted", "mutedForeground", "border"] as const;

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
  const darkOverrides = { ...(customization?.tokenOverrides ?? {}) };
  if (preset.adaptive) for (const key of SURFACE_TOKENS) delete darkOverrides[key];
  const mergedDark = preset.darkTokens
    ? {
        ...preset.darkTokens,
        ...(primaryColorOverride ? { primary: primaryColorOverride } : {}),
        ...(secondaryColorOverride ? { secondary: secondaryColorOverride } : {}),
        ...darkOverrides,
      }
    : undefined;
  const darkTokens =
    mergedDark && preset.adaptive
      ? withReadableForegrounds({ ...preset.tokens, ...mergedDark }, { ...preset.tokens, ...preset.darkTokens }, customization?.tokenOverrides)
      : mergedDark;

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
