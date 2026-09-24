// Stable, machine-readable feature keys shared by the seed script, the
// entitlement service, and every call site that gates a feature. Never
// inline a raw string like "pos" at a call site — import FEATURE_KEYS so a
// typo becomes a type error instead of a silently-always-false check.

export const FEATURE_KEYS = {
  // Numeric limits
  PRODUCTS: "products",
  DISCOUNT_CODES: "discount_codes",
  TEAM_MEMBERS: "team_members",
  BUNDLES: "bundles",

  // Store capabilities
  CUSTOM_DOMAIN: "custom_domain",
  ORDER_EXPORT: "order_export",
  BLOG: "blog",
  LOYALTY: "loyalty",
  ABANDONED_CART: "abandoned_cart",
  CRM: "crm",
  CRM_ADVANCED: "crm_advanced",
  META_CAPI: "meta_capi",
  TELEGRAM: "telegram",
  ALL_THEMES: "all_themes",
  POS: "pos",
  INVENTORY: "inventory",
  AI: "ai",
  REPORTS: "reports",
  SEO: "seo",
  BASIC_INTEGRATIONS: "basic_integrations",
  ANALYTICS_ADVANCED: "analytics_advanced",
  PRIORITY_SUPPORT: "priority_support",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export const PLAN_KEYS = {
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
} as const;

export type PlanTierKey = (typeof PLAN_KEYS)[keyof typeof PLAN_KEYS];
