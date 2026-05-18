import type { StoreNavbarVariant } from "@/constants/store-navbar";

export const STORE_THEME_IDS = [
  "classic",
  "boutique",
  "bold",
  "magazine",
] as const;

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

  boutique: {
    id: "boutique",
    name: "Boutique",
    description: "ستايل premium مناسب للملابس والهاند ميد والبراندات الناعمة.",
    navbarVariant: "centered",
    tokens: {
      primaryColor: "#be185d",
      secondaryColor: "#fdf2f8",
      background: "#fff7fb",
      surface: "#fffafd",
      card: "#ffffff",
      muted: "#fce7f3",
      border: "#fbcfe8",
      radius: "1.5rem",
      heroOverlay:
        "linear-gradient(to left, rgba(80,7,36,.72), rgba(80,7,36,.22), rgba(0,0,0,.12))",
    },
  },

  bold: {
    id: "bold",
    name: "Bold",
    description: "ستايل قوي وسريع مناسب للإلكترونيات، الجيم، والـ streetwear.",
    navbarVariant: "compact",
    tokens: {
      primaryColor: "#111827",
      secondaryColor: "#facc15",
      background: "#f9fafb",
      surface: "#ffffff",
      card: "#ffffff",
      muted: "#f3f4f6",
      border: "#d1d5db",
      radius: "0.625rem",
      heroOverlay:
        "linear-gradient(to left, rgba(0,0,0,.78), rgba(0,0,0,.42), rgba(0,0,0,.14))",
    },
  },
  magazine: {
    id: "magazine",
    name: "Magazine",
    description: "ستايل جذاب مناسب للنشرات والتصميمات الحديثة.",
    navbarVariant: "default",
    tokens: {
      primaryColor: "#0ea5e9",
      secondaryColor: "#f0f9ff",
      background: "#ffffff",
      surface: "#ffffff",
      card: "#ffffff",
      muted: "#f0f9ff",
      border: "#bfdbfe",
      radius: "0.875rem",
      heroOverlay:
        "linear-gradient(to left, rgba(14,165,233,.72), rgba(14,165,233,.22), rgba(0,0,0,.12))",
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
