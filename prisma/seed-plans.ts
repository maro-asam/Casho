// Idempotent seed for the subscription plan/feature/entitlement system.
// Safe to run repeatedly — every row is upserted by its unique key, so
// re-running never creates duplicates.
//
// Run with: npx tsx prisma/seed-plans.ts
//
// IMPORTANT: the exact Silver/Gold/Platinum prices below are PLACEHOLDERS.
// The handwritten spec gave ambiguous price pairs (300/450, 500/600, 700/800
// EGP) that could be monthly/yearly or old/new pricing — we could not
// confirm which, so we read them as "new price / old price" (a discount)
// and derived a placeholder yearly price (10x monthly, i.e. 2 months free,
// a common SaaS convention). Every Plan row has `pricingConfigured: false`
// until the founder confirms real numbers in the admin Plan editor —
// nothing here should be treated as final.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { FeatureType, PrismaClient } from "@prisma/client";
import { FEATURE_KEYS, PLAN_KEYS } from "@/lib/entitlements/feature-keys";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type FeatureSeed = {
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  unit?: string;
  sortOrder: number;
  /** false = scaffolding only, hidden from customer-facing comparison/usage UI until real enforcement exists. */
  isActive?: boolean;
};

const FEATURES: FeatureSeed[] = [
  { key: FEATURE_KEYS.PRODUCTS, name: "المنتجات", type: FeatureType.NUMERIC_LIMIT, unit: "منتج", sortOrder: 1 },
  { key: FEATURE_KEYS.DISCOUNT_CODES, name: "أكواد الخصم", type: FeatureType.NUMERIC_LIMIT, unit: "كود", sortOrder: 2 },
  { key: FEATURE_KEYS.TEAM_MEMBERS, name: "أعضاء الفريق", type: FeatureType.NUMERIC_LIMIT, unit: "عضو", sortOrder: 3 },
  {
    key: FEATURE_KEYS.BUNDLES,
    name: "الباقات المجمعة (Bundles)",
    description:
      "CONFIGURE_ME: no bundle-builder feature exists in the product yet. This entitlement is scaffolding only — not enforced anywhere until the feature is built. Limit values are placeholders.",
    type: FeatureType.NUMERIC_LIMIT,
    unit: "باقة",
    sortOrder: 4,
    isActive: false,
  },
  { key: FEATURE_KEYS.CUSTOM_DOMAIN, name: "الدومين الخاص", type: FeatureType.BOOLEAN, sortOrder: 5 },
  { key: FEATURE_KEYS.ORDER_EXPORT, name: "تصدير الطلبات", type: FeatureType.BOOLEAN, sortOrder: 6 },
  {
    key: FEATURE_KEYS.BLOG,
    name: "المدونة",
    description:
      "CONFIGURE_ME: there is no per-store merchant blog in the product — the existing Blog model is Casho's own platform marketing blog (admin-only). Scaffolding only, not enforced anywhere until a real per-store blog feature exists.",
    type: FeatureType.BOOLEAN,
    sortOrder: 7,
    isActive: false,
  },
  { key: FEATURE_KEYS.LOYALTY, name: "برنامج نقاط الولاء", type: FeatureType.BOOLEAN, sortOrder: 8 },
  { key: FEATURE_KEYS.ABANDONED_CART, name: "السلات المتروكة", type: FeatureType.BOOLEAN, sortOrder: 9 },
  { key: FEATURE_KEYS.CRM, name: "إدارة العملاء (CRM)", type: FeatureType.BOOLEAN, sortOrder: 10 },
  { key: FEATURE_KEYS.CRM_ADVANCED, name: "CRM متقدم (شرائح وتحليلات)", type: FeatureType.BOOLEAN, sortOrder: 11 },
  {
    key: FEATURE_KEYS.META_CAPI,
    name: "تكامل Meta CAPI",
    description:
      "CONFIGURE_ME: Meta CAPI today is a platform-wide integration configured via env vars (FACEBOOK_PIXEL_ID/FACEBOOK_CAPI_ACCESS_TOKEN), not a per-store setting — there is nothing per-store to gate yet. Scaffolding only until a per-store Meta CAPI config is built.",
    type: FeatureType.BOOLEAN,
    sortOrder: 12,
    isActive: false,
  },
  { key: FEATURE_KEYS.TELEGRAM, name: "تكامل تيليجرام", type: FeatureType.BOOLEAN, sortOrder: 13 },
  {
    key: FEATURE_KEYS.ALL_THEMES,
    name: "جميع القوالب",
    description:
      "CONFIGURE_ME: no free/premium split exists among the current theme presets — deciding which themes are premium is a product decision for the founder, not something to infer. Scaffolding only until that split is defined.",
    type: FeatureType.BOOLEAN,
    sortOrder: 14,
    isActive: false,
  },
  { key: FEATURE_KEYS.POS, name: "نقطة البيع (POS)", type: FeatureType.BOOLEAN, sortOrder: 15 },
  { key: FEATURE_KEYS.INVENTORY, name: "إدارة المخزون المتقدمة", type: FeatureType.BOOLEAN, sortOrder: 16 },
  { key: FEATURE_KEYS.AI, name: "الذكاء الاصطناعي", type: FeatureType.BOOLEAN, sortOrder: 17 },
  { key: FEATURE_KEYS.REPORTS, name: "التقارير", type: FeatureType.BOOLEAN, sortOrder: 18 },
  { key: FEATURE_KEYS.SEO, name: "تحسين محركات البحث (SEO)", type: FeatureType.BOOLEAN, sortOrder: 19 },
  {
    key: FEATURE_KEYS.BASIC_INTEGRATIONS,
    name: "التكاملات الأساسية",
    description:
      "CONFIGURE_ME: handwritten spec listed 'basic integrations' without specifics. Kept enabled on every plan so no existing integration breaks; revisit once the exact scope is confirmed.",
    type: FeatureType.BOOLEAN,
    sortOrder: 20,
    isActive: false,
  },
  {
    key: FEATURE_KEYS.ANALYTICS_ADVANCED,
    name: "تحليلات متقدمة",
    description:
      "CONFIGURE_ME: spec asks for a Gold+ 'advanced analytics' surface distinct from the existing reports page, but no such distinct page/data exists yet. Scaffolding only until that surface is built.",
    type: FeatureType.BOOLEAN,
    sortOrder: 21,
    isActive: false,
  },
  {
    key: FEATURE_KEYS.PRIORITY_SUPPORT,
    name: "دعم كاشو ذو أولوية",
    description:
      "CONFIGURE_ME: no priority mechanism exists on support requests yet. Scaffolding only — not enforced until the support system gains a priority concept.",
    type: FeatureType.BOOLEAN,
    sortOrder: 22,
    isActive: false,
  },
];

type PlanFeatureSeed = {
  enabled: boolean;
  limitValue?: number | null;
  isUnlimited?: boolean;
};

type PlanSeed = {
  key: string;
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number; // piasters
  yearlyPrice: number; // piasters
  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;
  discountPercent?: number;
  sortOrder: number;
  features: Record<string, PlanFeatureSeed>;
};

const PLANS: PlanSeed[] = [
  {
    key: PLAN_KEYS.SILVER,
    slug: "silver",
    name: "سيلفر",
    description: "الباقة الأساسية لبدء متجرك الإلكتروني.",
    monthlyPrice: 30_000, // 300 EGP placeholder
    yearlyPrice: 300_000, // 3000 EGP placeholder (10x monthly)
    originalMonthlyPrice: 45_000, // 450 EGP — the other handwritten reading
    discountPercent: 33,
    sortOrder: 1,
    features: {
      [FEATURE_KEYS.PRODUCTS]: { enabled: true, limitValue: 100 },
      [FEATURE_KEYS.DISCOUNT_CODES]: { enabled: true, limitValue: 5 },
      [FEATURE_KEYS.TEAM_MEMBERS]: { enabled: true, limitValue: 0 },
      [FEATURE_KEYS.BUNDLES]: { enabled: false },
      [FEATURE_KEYS.CUSTOM_DOMAIN]: { enabled: false },
      [FEATURE_KEYS.ORDER_EXPORT]: { enabled: false },
      [FEATURE_KEYS.BLOG]: { enabled: false },
      [FEATURE_KEYS.LOYALTY]: { enabled: false },
      [FEATURE_KEYS.ABANDONED_CART]: { enabled: false },
      [FEATURE_KEYS.CRM]: { enabled: false },
      [FEATURE_KEYS.CRM_ADVANCED]: { enabled: false },
      [FEATURE_KEYS.META_CAPI]: { enabled: false },
      [FEATURE_KEYS.TELEGRAM]: { enabled: false },
      [FEATURE_KEYS.ALL_THEMES]: { enabled: false },
      [FEATURE_KEYS.POS]: { enabled: false },
      [FEATURE_KEYS.INVENTORY]: { enabled: false },
      [FEATURE_KEYS.AI]: { enabled: false },
      [FEATURE_KEYS.REPORTS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.SEO]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.BASIC_INTEGRATIONS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.ANALYTICS_ADVANCED]: { enabled: false },
      [FEATURE_KEYS.PRIORITY_SUPPORT]: { enabled: false },
    },
  },
  {
    key: PLAN_KEYS.GOLD,
    slug: "gold",
    name: "جولد",
    description: "للمتاجر النامية التي تحتاج مميزات وتكاملات أكثر.",
    monthlyPrice: 50_000, // 500 EGP placeholder
    yearlyPrice: 500_000, // 5000 EGP placeholder
    originalMonthlyPrice: 60_000, // 600 EGP
    discountPercent: 17,
    sortOrder: 2,
    features: {
      [FEATURE_KEYS.PRODUCTS]: { enabled: true, limitValue: 1000 },
      [FEATURE_KEYS.DISCOUNT_CODES]: { enabled: true, limitValue: 50 },
      [FEATURE_KEYS.TEAM_MEMBERS]: { enabled: true, limitValue: 3 },
      [FEATURE_KEYS.BUNDLES]: { enabled: true, limitValue: 10 },
      [FEATURE_KEYS.CUSTOM_DOMAIN]: { enabled: true },
      [FEATURE_KEYS.ORDER_EXPORT]: { enabled: true },
      [FEATURE_KEYS.BLOG]: { enabled: true },
      [FEATURE_KEYS.LOYALTY]: { enabled: true },
      [FEATURE_KEYS.ABANDONED_CART]: { enabled: true },
      [FEATURE_KEYS.CRM]: { enabled: true },
      [FEATURE_KEYS.CRM_ADVANCED]: { enabled: false },
      [FEATURE_KEYS.META_CAPI]: { enabled: true },
      [FEATURE_KEYS.TELEGRAM]: { enabled: true },
      [FEATURE_KEYS.ALL_THEMES]: { enabled: true },
      [FEATURE_KEYS.POS]: { enabled: false },
      [FEATURE_KEYS.INVENTORY]: { enabled: false },
      [FEATURE_KEYS.AI]: { enabled: true },
      [FEATURE_KEYS.REPORTS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.SEO]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.BASIC_INTEGRATIONS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.ANALYTICS_ADVANCED]: { enabled: true },
      [FEATURE_KEYS.PRIORITY_SUPPORT]: { enabled: false },
    },
  },
  {
    key: PLAN_KEYS.PLATINUM,
    slug: "platinum",
    name: "بلاتينيوم",
    description: "كل مميزات كاشو بدون حدود، مع دعم ذو أولوية.",
    monthlyPrice: 70_000, // 700 EGP placeholder
    yearlyPrice: 700_000, // 7000 EGP placeholder
    originalMonthlyPrice: 80_000, // 800 EGP
    discountPercent: 13,
    sortOrder: 3,
    features: {
      [FEATURE_KEYS.PRODUCTS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.DISCOUNT_CODES]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.TEAM_MEMBERS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.BUNDLES]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.CUSTOM_DOMAIN]: { enabled: true },
      [FEATURE_KEYS.ORDER_EXPORT]: { enabled: true },
      [FEATURE_KEYS.BLOG]: { enabled: true },
      [FEATURE_KEYS.LOYALTY]: { enabled: true },
      [FEATURE_KEYS.ABANDONED_CART]: { enabled: true },
      [FEATURE_KEYS.CRM]: { enabled: true },
      [FEATURE_KEYS.CRM_ADVANCED]: { enabled: true },
      [FEATURE_KEYS.META_CAPI]: { enabled: true },
      [FEATURE_KEYS.TELEGRAM]: { enabled: true },
      [FEATURE_KEYS.ALL_THEMES]: { enabled: true },
      [FEATURE_KEYS.POS]: { enabled: true },
      [FEATURE_KEYS.INVENTORY]: { enabled: true },
      [FEATURE_KEYS.AI]: { enabled: true },
      [FEATURE_KEYS.REPORTS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.SEO]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.BASIC_INTEGRATIONS]: { enabled: true, isUnlimited: true },
      [FEATURE_KEYS.ANALYTICS_ADVANCED]: { enabled: true },
      [FEATURE_KEYS.PRIORITY_SUPPORT]: { enabled: true },
    },
  },
];

async function main() {
  // This seed only ever CREATES missing rows — it never updates an existing
  // Plan/Feature/PlanFeature. Once seeded, all further changes (prices,
  // limits, descriptions) happen through the admin panel and must survive
  // this script being re-run on every deploy.
  console.log("Seeding features...");
  const featureIdByKey = new Map<string, string>();

  for (const feature of FEATURES) {
    const existing = await prisma.feature.findUnique({ where: { key: feature.key } });
    const row =
      existing ??
      (await prisma.feature.create({
        data: {
          key: feature.key,
          name: feature.name,
          description: feature.description,
          type: feature.type,
          unit: feature.unit,
          sortOrder: feature.sortOrder,
          isActive: feature.isActive ?? true,
        },
      }));
    featureIdByKey.set(feature.key, row.id);
  }

  console.log("Seeding plans...");
  let platinumPlanId: string | null = null;

  for (const plan of PLANS) {
    const existingPlan = await prisma.plan.findUnique({ where: { key: plan.key } });
    const row =
      existingPlan ??
      (await prisma.plan.create({
        data: {
          key: plan.key,
          slug: plan.slug,
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          originalMonthlyPrice: plan.originalMonthlyPrice,
          originalYearlyPrice: plan.originalYearlyPrice,
          discountPercent: plan.discountPercent,
          pricingConfigured: false,
          sortOrder: plan.sortOrder,
        },
      }));

    if (plan.key === PLAN_KEYS.PLATINUM) platinumPlanId = row.id;

    for (const [featureKey, config] of Object.entries(plan.features)) {
      const featureId = featureIdByKey.get(featureKey);
      if (!featureId) throw new Error(`Unknown feature key in plan seed: ${featureKey}`);

      const existingPlanFeature = await prisma.planFeature.findUnique({
        where: { planId_featureId: { planId: row.id, featureId } },
      });
      if (existingPlanFeature) continue;

      await prisma.planFeature.create({
        data: {
          planId: row.id,
          featureId,
          enabled: config.enabled,
          limitValue: config.limitValue ?? null,
          isUnlimited: config.isUnlimited ?? false,
        },
      });
    }
  }

  if (!platinumPlanId) throw new Error("Platinum plan missing after seed");

  console.log("Backfilling existing stores without a plan to Platinum...");
  const backfilled = await prisma.store.updateMany({
    where: { planId: null },
    data: { planId: platinumPlanId },
  });
  console.log(`Backfilled ${backfilled.count} store(s) to Platinum.`);

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
