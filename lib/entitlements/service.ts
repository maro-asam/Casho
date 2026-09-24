import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { FEATURE_KEYS, PLAN_KEYS, type FeatureKey } from "./feature-keys";
import { getFeatureUsage, hasUsageCounter } from "./usage";
import { FeatureNotAvailableError, PlanLimitReachedError } from "./errors";

type ResolvedPlanFeature = {
  enabled: boolean;
  limitValue: number | null;
  isUnlimited: boolean;
  configuration: unknown;
};

type EntitlementContext = {
  planId: string;
  planKey: string;
  planSlug: string;
  planName: string;
  planSortOrder: number;
  features: Map<string, ResolvedPlanFeature>;
};

type PlanWithFeatures = {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  originalMonthlyPrice: number | null;
  originalYearlyPrice: number | null;
  discountPercent: number | null;
  sortOrder: number;
  planFeatures: {
    enabled: boolean;
    limitValue: number | null;
    isUnlimited: boolean;
    configuration: unknown;
    feature: { key: string; name: string; unit: string | null; isActive: boolean; sortOrder: number };
  }[];
};

function toContext(plan: PlanWithFeatures): EntitlementContext {
  const features = new Map<string, ResolvedPlanFeature>();
  for (const pf of plan.planFeatures) {
    features.set(pf.feature.key, {
      enabled: pf.enabled,
      limitValue: pf.limitValue,
      isUnlimited: pf.isUnlimited,
      configuration: pf.configuration,
    });
  }
  return {
    planId: plan.id,
    planKey: plan.key,
    planSlug: plan.slug,
    planName: plan.name,
    planSortOrder: plan.sortOrder,
    features,
  };
}

const PLAN_FEATURES_INCLUDE = { planFeatures: { include: { feature: true } } } as const;

// All active plans, ordered cheapest-first. Cached per-request — plan
// configuration changes propagate on the next request, never mid-request.
export const getAllActivePlans = cache(async (): Promise<PlanWithFeatures[]> => {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: PLAN_FEATURES_INCLUDE,
  });
});

/** The plan assigned to every new store's free trial (spec: 3-day trial with Platinum-level access). */
export const getDefaultTrialPlanId = cache(async (): Promise<string> => {
  const plan = await prisma.plan.findUnique({ where: { key: PLAN_KEYS.PLATINUM }, select: { id: true } });
  if (!plan) throw new Error("No Platinum plan configured. Run `npx tsx prisma/seed-plans.ts`.");
  return plan.id;
});

const getPlatinumFallback = cache(async (): Promise<EntitlementContext | null> => {
  const plan = await prisma.plan.findUnique({
    where: { key: PLAN_KEYS.PLATINUM },
    include: PLAN_FEATURES_INCLUDE,
  });
  return plan ? toContext(plan) : null;
});

// Per-request memoized: a store's plan is fetched at most once per request
// regardless of how many entitlement checks run against it.
export const getEntitlementContext = cache(async (storeId: string): Promise<EntitlementContext> => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { plan: { include: PLAN_FEATURES_INCLUDE } },
  });

  if (store?.plan) return toContext(store.plan);

  // Defensive fallback only — every Store should have a planId after the
  // initial backfill (prisma/seed-plans.ts) and every new Store is assigned
  // one at creation time. If a plan is ever missing anyway, fail OPEN on
  // entitlements (grant Platinum-level features) rather than fail closed —
  // platform *access* is governed separately by Store.subscriptionStatus,
  // so this can never let an inactive/canceled store back in, it can only
  // avoid wrongly blocking an active one due to a data gap.
  const fallback = await getPlatinumFallback();
  if (!fallback) {
    throw new Error("No Platinum plan configured. Run `npx tsx prisma/seed-plans.ts`.");
  }
  return fallback;
});

async function findRequiredPlanSlug(
  featureKey: FeatureKey,
  currentSortOrder: number,
  requirement: { mode: "boolean" } | { mode: "limit"; currentLimit: number | null },
): Promise<string | null> {
  const plans = await getAllActivePlans();
  const candidates = plans.filter((p) => p.sortOrder > currentSortOrder);

  for (const plan of candidates) {
    const pf = plan.planFeatures.find((f) => f.feature.key === featureKey);
    if (!pf || !pf.enabled) continue;

    if (requirement.mode === "boolean") return plan.slug;

    if (pf.isUnlimited) return plan.slug;
    if (requirement.currentLimit === null) continue; // current plan already unlimited (shouldn't reach here)
    if ((pf.limitValue ?? 0) > requirement.currentLimit) return plan.slug;
  }

  return null;
}

function resolveFeature(ctx: EntitlementContext, featureKey: FeatureKey) {
  const feature = ctx.features.get(featureKey);
  const enabled = feature?.enabled ?? false;
  const isUnlimitedFlag = feature?.isUnlimited ?? false;
  // limit is only a meaningful number for counted (numeric-limit) features.
  // A plain boolean toggle (e.g. "ai") has no ceiling to report — null, not 0.
  const limit = !enabled
    ? 0
    : isUnlimitedFlag
      ? null
      : hasUsageCounter(featureKey)
        ? feature?.limitValue ?? 0
        : null;
  return { enabled, isUnlimited: isUnlimitedFlag, limit };
}

/** Does the store's plan include this feature at all? */
export async function hasFeature(storeId: string, featureKey: FeatureKey): Promise<boolean> {
  const ctx = await getEntitlementContext(storeId);
  return resolveFeature(ctx, featureKey).enabled;
}

/** Alias matching the spec's `entitlements.can(...)` naming. */
export const can = hasFeature;

export async function isUnlimited(storeId: string, featureKey: FeatureKey): Promise<boolean> {
  const ctx = await getEntitlementContext(storeId);
  return resolveFeature(ctx, featureKey).isUnlimited;
}

/** null = unlimited. 0 = feature disabled / no allowance. */
export async function getLimit(storeId: string, featureKey: FeatureKey): Promise<number | null> {
  const ctx = await getEntitlementContext(storeId);
  return resolveFeature(ctx, featureKey).limit;
}

/** null = unlimited remaining. */
export async function remaining(storeId: string, featureKey: FeatureKey): Promise<number | null> {
  const limit = await getLimit(storeId, featureKey);
  if (limit === null) return null;
  const current = await getFeatureUsage(storeId, featureKey);
  return Math.max(0, limit - current);
}

export type LimitCheckResult = {
  allowed: boolean;
  enabled: boolean;
  isUnlimited: boolean;
  limit: number | null;
  current: number;
  requiredPlan: string | null;
};

/** Non-throwing check — use this to render usage bars / "X of Y" UI. */
export async function checkLimit(storeId: string, featureKey: FeatureKey): Promise<LimitCheckResult> {
  const ctx = await getEntitlementContext(storeId);
  const { enabled, isUnlimited: isUnlimitedFlag, limit } = resolveFeature(ctx, featureKey);
  const isCounted = hasUsageCounter(featureKey);
  const current = enabled && isCounted ? await getFeatureUsage(storeId, featureKey) : 0;
  // A plain on/off feature (no counted resource) is "allowed" whenever it's
  // enabled — there's no ceiling to compare against. Only counted features
  // (products, discount_codes, team_members, bundles) need the limit check.
  const allowed = enabled && (!isCounted || isUnlimitedFlag || limit === null || current < limit);

  let requiredPlan: string | null = null;
  if (!allowed) {
    requiredPlan = await findRequiredPlanSlug(
      featureKey,
      ctx.planSortOrder,
      enabled && isCounted ? { mode: "limit", currentLimit: limit } : { mode: "boolean" },
    );
  }

  return { allowed, enabled, isUnlimited: isUnlimitedFlag, limit, current, requiredPlan };
}

/**
 * Throws FeatureNotAvailableError / PlanLimitReachedError when the store
 * cannot use this feature right now. This is the function every mutating
 * server action MUST call before creating a plan-limited resource —
 * frontend checks (hasFeature/checkLimit) are UX only, never enforcement.
 */
export async function assertCanUse(storeId: string, featureKey: FeatureKey): Promise<void> {
  const result = await checkLimit(storeId, featureKey);
  if (result.allowed) return;

  if (!result.enabled) {
    throw new FeatureNotAvailableError(featureKey, result.requiredPlan);
  }

  throw new PlanLimitReachedError({
    feature: featureKey,
    current: result.current,
    limit: result.limit ?? 0,
    requiredPlan: result.requiredPlan,
  });
}

export type EntitlementsSnapshot = {
  plan: { id: string; key: string; slug: string; name: string };
  entitlements: Record<string, { enabled: boolean; isUnlimited: boolean; limit: number | null }>;
  usage: Record<string, { used: number; limit: number | null; isUnlimited: boolean; percentUsed: number | null }>;
};

/** One-shot snapshot for dashboard/pricing/usage pages — avoids N round trips. */
export async function getEntitlementsSnapshot(storeId: string): Promise<EntitlementsSnapshot> {
  const ctx = await getEntitlementContext(storeId);
  const entitlements: EntitlementsSnapshot["entitlements"] = {};
  const usage: EntitlementsSnapshot["usage"] = {};

  for (const featureKey of Object.values(FEATURE_KEYS)) {
    const { enabled, isUnlimited: isUnlimitedFlag, limit } = resolveFeature(ctx, featureKey);
    entitlements[featureKey] = { enabled, isUnlimited: isUnlimitedFlag, limit };

    if (hasUsageCounter(featureKey)) {
      const used = enabled ? await getFeatureUsage(storeId, featureKey) : 0;
      usage[featureKey] = {
        used,
        limit,
        isUnlimited: isUnlimitedFlag,
        percentUsed: limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null,
      };
    }
  }

  return {
    plan: { id: ctx.planId, key: ctx.planKey, slug: ctx.planSlug, name: ctx.planName },
    entitlements,
    usage,
  };
}
