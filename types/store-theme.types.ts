// ─────────────────────────────────────────────────────────────────────────────
//  Store Theme System — Core TypeScript Types
//  All theme-related types are defined here and used everywhere.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Preset IDs ──────────────────────────────────────────────────────────────

export const THEME_PRESET_IDS = [
  "default",
  "bold",
  "elegant",
  "modern",
  "minimal",
  "dark",
] as const;

export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return THEME_PRESET_IDS.includes(value as ThemePresetId);
}

// ─── Design Tokens ───────────────────────────────────────────────────────────

export type ThemeTokens = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
  heroOverlay: string;
  radius: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  glowPrimary: string;
};

// ─── Layout & Structure ───────────────────────────────────────────────────────

export type NavbarVariant = "default" | "centered" | "compact" | "allaia";
export type HeroStyle = "fullscreen" | "split" | "compact" | "minimal";
export type ProductCardStyle = "default" | "minimal" | "bold" | "elegant";
export type CategoryCardStyle = "square" | "circle" | "pill";
export type ButtonStyle = "sharp" | "rounded" | "pill";
export type ImageAspectRatio = "square" | "portrait" | "landscape";
export type AnimationStyle = "none" | "subtle" | "dynamic";
export type GridDensity = "compact" | "default" | "spacious";

export type ThemeLayout = {
  navbar: NavbarVariant;
  heroStyle: HeroStyle;
  productCardStyle: ProductCardStyle;
  categoryCardStyle: CategoryCardStyle;
  desktopGridCols: 3 | 4 | 5;
  density: GridDensity;
  animations: AnimationStyle;
  buttonStyle: ButtonStyle;
  imageAspectRatio: ImageAspectRatio;
};

// ─── Section Content Types ────────────────────────────────────────────────────
//
// Per-section configurable content.  Merchants edit these in the dashboard;
// they are serialised into ThemeCustomization.sectionContent (JSON).

export type OfferStripContent = {
  /** Scrolling items, e.g. "🚚 توصيل مجاني فوق 500 جنيه" */
  items: string[];
};

export type SocialProofContent = {
  headline?: string;
  stats: Array<{
    icon: string;   // emoji
    value: string;  // "10,000+"
    label: string;  // "عميل سعيد"
  }>;
};

export type BestSellersContent = {
  headline?: string;
  /** Max products to show (default 8) */
  maxProducts?: number;
};

export type WhyChooseUsContent = {
  headline?: string;
  cards: Array<{
    icon: string;        // emoji
    title: string;
    description: string;
  }>;
};

export type TestimonialItem = {
  name: string;
  avatar?: string;
  text: string;
  rating?: number; // 1-5
};

export type TestimonialsContent = {
  headline?: string;
  items: TestimonialItem[];
};

export type AboutBrandContent = {
  headline?: string;
  text?: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
};

export type NewsletterContent = {
  headline?: string;
  subheadline?: string;
  placeholder?: string;
  ctaText?: string;
};

export type UrgencyContent = {
  headline?: string;
  /** ISO date string — countdown timer target */
  timerEndDate?: string;
  timerLabel?: string;
  showStockBadge?: boolean;
  showViewersBadge?: boolean;
  minViewers?: number;
  maxViewers?: number;
};

export type CollectionItem = {
  name: string;
  image?: string;
  /** Link to category slug or full URL */
  link?: string;
};

export type CollectionsContent = {
  headline?: string;
  items: CollectionItem[];
};

/** Map of section content; only defined sections are stored */
export type SectionContentMap = {
  offerStrip?: OfferStripContent;
  socialProof?: SocialProofContent;
  bestSellers?: BestSellersContent;
  whyChooseUs?: WhyChooseUsContent;
  testimonials?: TestimonialsContent;
  aboutBrand?: AboutBrandContent;
  newsletter?: NewsletterContent;
  urgency?: UrgencyContent;
  collections?: CollectionsContent;
};

// ─── Section Visibility ────────────────────────────────────────────────────────
//
// Boolean flags for each page section.
// Stored inside ThemeCustomization.sectionOverrides.

/** All recognised home-page section keys */
export type SectionKey =
  // ── Core (existing) ──────────────────────────────────────────────────────
  | "showHero"
  | "showCategories"
  | "showFeaturedProducts"
  | "showLatestProducts"
  // ── Sales Funnel (new) ───────────────────────────────────────────────────
  | "showOfferStrip"
  | "showSocialProof"
  | "showBestSellers"
  | "showWhyChooseUs"
  | "showTestimonials"
  | "showAboutBrand"
  | "showNewsletter"
  | "showUrgency"
  | "showCollections";

/**
 * Recommended default section order for new stores.
 * Existing stores have their own sectionOrder saved in the DB.
 */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "showHero",
  "showOfferStrip",
  "showSocialProof",
  "showBestSellers",
  "showCategories",
  "showFeaturedProducts",
  "showCollections",
  "showWhyChooseUs",
  "showTestimonials",
  "showUrgency",
  "showLatestProducts",
  "showAboutBrand",
  "showNewsletter",
];

export type HomePageSections = {
  // ── Core ──────────────────────────────────────────────────────────────────
  showHero: boolean;
  showCategories: boolean;
  showFeaturedProducts: boolean;
  showLatestProducts: boolean;
  // ── Sales Funnel ──────────────────────────────────────────────────────────
  showOfferStrip: boolean;
  showSocialProof: boolean;
  showBestSellers: boolean;
  showWhyChooseUs: boolean;
  showTestimonials: boolean;
  showAboutBrand: boolean;
  showNewsletter: boolean;
  showUrgency: boolean;
  showCollections: boolean;
  /** Render order — falls back to DEFAULT_SECTION_ORDER */
  sectionOrder?: SectionKey[];
};

export type ThemeSections = {
  home: HomePageSections;
};

// ─── Full Theme Preset ─────────────────────────────────────────────────────

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  colorScheme: "light" | "dark";
  tokens: ThemeTokens;
  /** Tokens to apply when the user activates dark mode (overrides `tokens`). */
  darkTokens?: Partial<ThemeTokens>;
  layout: ThemeLayout;
  sections: ThemeSections;
};

// ─── Merchant Customization (stored in DB as JSON) ─────────────────────────

export type ThemeCustomization = {
  presetId: ThemePresetId;
  tokenOverrides?: Partial<ThemeTokens>;
  layoutOverrides?: Partial<ThemeLayout>;
  sectionOverrides?: DeepPartial<ThemeSections>;
  /** Per-section configurable content */
  sectionContent?: SectionContentMap;
};

// ─── Resolved Theme ───────────────────────────────────────────────────────

export type ResolvedTheme = {
  id: ThemePresetId;
  colorScheme: "light" | "dark";
  tokens: ThemeTokens;
  /** Dark-mode token overrides (applied when `.dark` class is active). */
  darkTokens?: Partial<ThemeTokens>;
  layout: ThemeLayout;
  sections: ThemeSections;
  /** Resolved section content (passed to section components) */
  sectionContent: SectionContentMap;
};

// ─── Utility ──────────────────────────────────────────────────────────────

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
