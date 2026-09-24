import { prisma } from "@/lib/prisma";
import { getFeatureUsage, hasUsageCounter } from "./usage";
import type { FeatureKey } from "./feature-keys";

const PLAN_WITH_FEATURES_INCLUDE = {
  planFeatures: { include: { feature: true } },
} as const;

export type PlanChangeFeatureDiff = {
  key: string;
  name: string;
  unit: string | null;
};

export type PlanChangeOverage = {
  key: string;
  name: string;
  unit: string | null;
  current: number;
  newLimit: number;
};

export type PlanChangePreview = {
  fromPlan: { id: string; key: string; slug: string; name: string; sortOrder: number };
  toPlan: { id: string; key: string; slug: string; name: string; sortOrder: number };
  direction: "upgrade" | "downgrade" | "same";
  featuresGained: PlanChangeFeatureDiff[];
  featuresLost: PlanChangeFeatureDiff[];
  /** Numeric-limit features where current usage already exceeds the target plan's limit. */
  overages: PlanChangeOverage[];
};

/**
 * Compares the store's current plan against a target plan: which boolean
 * features would be gained/lost, and — critically for downgrades — which
 * counted resources (products, discount codes, team members, bundles)
 * already exceed the target plan's limit. Per spec section 14, an overage
 * never triggers deletion; it's surfaced so the UI can warn the merchant
 * before they confirm, and enforcement (assertCanUse) naturally blocks
 * further creation afterward since it always compares live usage to the
 * live plan limit.
 */
export async function previewPlanChange(storeId: string, targetPlanId: string): Promise<PlanChangePreview> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { plan: { include: PLAN_WITH_FEATURES_INCLUDE } },
  });
  if (!store?.plan) throw new Error("Store has no current plan configured.");

  const targetPlan = await prisma.plan.findUnique({
    where: { id: targetPlanId },
    include: PLAN_WITH_FEATURES_INCLUDE,
  });
  if (!targetPlan) throw new Error("Target plan not found.");

  const fromPlan = store.plan;
  const direction =
    targetPlan.sortOrder > fromPlan.sortOrder
      ? "upgrade"
      : targetPlan.sortOrder < fromPlan.sortOrder
        ? "downgrade"
        : "same";

  const fromFeatureMap = new Map(fromPlan.planFeatures.map((pf) => [pf.feature.key, pf]));
  const toFeatureMap = new Map(targetPlan.planFeatures.map((pf) => [pf.feature.key, pf]));

  const featuresGained: PlanChangeFeatureDiff[] = [];
  const featuresLost: PlanChangeFeatureDiff[] = [];
  const overages: PlanChangeOverage[] = [];

  for (const [key, toFeature] of toFeatureMap) {
    const fromFeature = fromFeatureMap.get(key);
    const wasEnabled = fromFeature?.enabled ?? false;
    const willBeEnabled = toFeature.enabled;

    if (willBeEnabled && !wasEnabled) {
      featuresGained.push({ key, name: toFeature.feature.name, unit: toFeature.feature.unit });
    } else if (!willBeEnabled && wasEnabled) {
      featuresLost.push({ key, name: toFeature.feature.name, unit: toFeature.feature.unit });
    }

    if (
      direction === "downgrade" &&
      willBeEnabled &&
      !toFeature.isUnlimited &&
      toFeature.limitValue !== null &&
      hasUsageCounter(key as FeatureKey)
    ) {
      const current = await getFeatureUsage(storeId, key as FeatureKey);
      if (current > toFeature.limitValue) {
        overages.push({
          key,
          name: toFeature.feature.name,
          unit: toFeature.feature.unit,
          current,
          newLimit: toFeature.limitValue,
        });
      }
    } else if (
      direction === "downgrade" &&
      !willBeEnabled &&
      wasEnabled &&
      hasUsageCounter(key as FeatureKey)
    ) {
      // Feature disabled entirely on the target plan but the store already
      // has usage on it (e.g. Silver disables discount_codes outright).
      const current = await getFeatureUsage(storeId, key as FeatureKey);
      if (current > 0) {
        overages.push({ key, name: toFeature.feature.name, unit: toFeature.feature.unit, current, newLimit: 0 });
      }
    }
  }

  return {
    fromPlan: { id: fromPlan.id, key: fromPlan.key, slug: fromPlan.slug, name: fromPlan.name, sortOrder: fromPlan.sortOrder },
    toPlan: { id: targetPlan.id, key: targetPlan.key, slug: targetPlan.slug, name: targetPlan.name, sortOrder: targetPlan.sortOrder },
    direction,
    featuresGained,
    featuresLost,
    overages,
  };
}
