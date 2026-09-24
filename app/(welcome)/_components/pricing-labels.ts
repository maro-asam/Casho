// Presentational i18n labels only — prices, limits, and which features
// belong to which plan always come live from the database (lib/entitlements),
// never hardcoded here. This file only translates *display strings* for
// the bilingual marketing page; Feature/Plan.name in the DB are Arabic-only.
import { FEATURE_KEYS, type FeatureKey } from "@/lib/entitlements/feature-keys";

export const PLAN_NAME_LABELS: Record<string, { ar: string; en: string }> = {
  SILVER: { ar: "سيلفر", en: "Silver" },
  GOLD: { ar: "جولد", en: "Gold" },
  PLATINUM: { ar: "بلاتينيوم", en: "Platinum" },
};

export const FEATURE_NAME_LABELS: Partial<Record<FeatureKey, { ar: string; en: string }>> = {
  [FEATURE_KEYS.PRODUCTS]: { ar: "المنتجات", en: "Products" },
  [FEATURE_KEYS.DISCOUNT_CODES]: { ar: "أكواد الخصم", en: "Discount codes" },
  [FEATURE_KEYS.TEAM_MEMBERS]: { ar: "أعضاء الفريق", en: "Team members" },
  [FEATURE_KEYS.CUSTOM_DOMAIN]: { ar: "الدومين الخاص", en: "Custom domain" },
  [FEATURE_KEYS.ORDER_EXPORT]: { ar: "تصدير الطلبات", en: "Order export" },
  [FEATURE_KEYS.LOYALTY]: { ar: "نظام نقاط الولاء", en: "Loyalty points" },
  [FEATURE_KEYS.ABANDONED_CART]: { ar: "السلات المتروكة", en: "Abandoned carts" },
  [FEATURE_KEYS.CRM]: { ar: "إدارة العملاء (CRM)", en: "Customer management (CRM)" },
  [FEATURE_KEYS.CRM_ADVANCED]: { ar: "CRM متقدم", en: "Advanced CRM" },
  [FEATURE_KEYS.TELEGRAM]: { ar: "تكامل تيليجرام", en: "Telegram integration" },
  [FEATURE_KEYS.POS]: { ar: "نقطة البيع (POS)", en: "Point of sale (POS)" },
  [FEATURE_KEYS.INVENTORY]: { ar: "إدارة المخزون المتقدمة", en: "Advanced inventory" },
  [FEATURE_KEYS.AI]: { ar: "الذكاء الاصطناعي", en: "AI features" },
  [FEATURE_KEYS.REPORTS]: { ar: "التقارير", en: "Reports" },
  [FEATURE_KEYS.SEO]: { ar: "تحسين محركات البحث (SEO)", en: "SEO" },
};

export function planNameLabel(key: string, fallbackName: string, lang: "ar" | "en") {
  return PLAN_NAME_LABELS[key]?.[lang] ?? fallbackName;
}

export function featureNameLabel(key: string, fallbackName: string, lang: "ar" | "en") {
  return FEATURE_NAME_LABELS[key as FeatureKey]?.[lang] ?? fallbackName;
}
