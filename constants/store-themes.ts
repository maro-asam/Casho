import type { StoreNavbarVariant } from "@/constants/store-navbar";

export const STORE_THEME_IDS = ["classic", "modern", "exclusive", "allaia"] as const;

export type StoreThemeId = (typeof STORE_THEME_IDS)[number];

export type StoreTheme = {
  id: StoreThemeId;
  name: string;
  description: string;
  navbarVariant: StoreNavbarVariant;
  tokens: {
    primaryColor: string;
    secondaryColor: string;
    background: string;
    surface: string;
    card: string;
    muted: string;
    border: string;
    radius: string;
    heroOverlay: string;
  };
};

export const STORE_THEMES: Record<StoreThemeId, StoreTheme> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "شكل واضح ومرتب مناسب لمعظم المتاجر.",
    navbarVariant: "default",
    tokens: {
      primaryColor: "#2563eb",
      secondaryColor: "#f3f4f6",
      background: "#ffffff",
      surface: "#ffffff",
      card: "#ffffff",
      muted: "#f8fafc",
      border: "#e5e7eb",
      radius: "0.875rem",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.55), rgba(0,0,0,.15))",
    },
  },

  modern: {
    id: "modern",
    name: "Modern",
    description: "تصميم عصري وأنيق بألوان داكنة وبطاقات منتجات portrait احترافية.",
    navbarVariant: "default",
    tokens: {
      primaryColor: "#18181b",
      secondaryColor: "#f59e0b",
      background: "#fafaf9",
      surface: "#f5f5f4",
      card: "#ffffff",
      muted: "#f5f5f4",
      border: "#e7e5e4",
      radius: "0.5rem",
      heroOverlay: "linear-gradient(to left, rgba(24,24,27,.90), rgba(24,24,27,.50), rgba(24,24,27,.15))",
    },
  },

  allaia: {
    id: "allaia",
    name: "Allaia",
    description: "تصميم إيديتوريال نظيف مستوحى من متاجر الموضة — أبيض ناصع، لوجو في المنتصف، بطاقات بدون حدود.",
    navbarVariant: "allaia",
    tokens: {
      primaryColor: "#1c1c1c",
      secondaryColor: "#f5f5f5",
      background: "#ffffff",
      surface: "#fafafa",
      card: "#ffffff",
      muted: "#f4f4f4",
      border: "#e8e8e8",
      radius: "0.25rem",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.55), rgba(0,0,0,.10))",
    },
  },

  exclusive: {
    id: "exclusive",
    name: "Exclusive",
    description: "تصميم احترافي بلون أحمر جريء مع أقسام عروض ومنتجات مميزة.",
    navbarVariant: "default",
    tokens: {
      primaryColor: "#DB4444",
      secondaryColor: "#000000",
      background: "#ffffff",
      surface: "#f5f5f5",
      card: "#ffffff",
      muted: "#f5f5f5",
      border: "#e8e8e8",
      radius: "0.375rem",
      heroOverlay: "linear-gradient(to left, rgba(0,0,0,.70), rgba(0,0,0,.30))",
    },
  },
};

export function isStoreThemeId(value: string): value is StoreThemeId {
  return STORE_THEME_IDS.includes(value as StoreThemeId);
}

export function getStoreTheme(themeId?: string | null): StoreTheme {
  if (themeId && isStoreThemeId(themeId)) {
    return STORE_THEMES[themeId];
  }
  return STORE_THEMES.classic;
}
