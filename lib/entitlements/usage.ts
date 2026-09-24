import { prisma } from "@/lib/prisma";
import { FEATURE_KEYS, type FeatureKey } from "./feature-keys";

type UsageCounter = (storeId: string) => Promise<number>;

// Single source of truth for "how do we count current usage of feature X".
// Only numeric-limit features need an entry here — boolean features have
// no usage to count.
const USAGE_COUNTERS: Partial<Record<FeatureKey, UsageCounter>> = {
  [FEATURE_KEYS.PRODUCTS]: (storeId) => prisma.product.count({ where: { storeId } }),
  [FEATURE_KEYS.DISCOUNT_CODES]: (storeId) => prisma.coupon.count({ where: { storeId } }),
  [FEATURE_KEYS.TEAM_MEMBERS]: (storeId) => prisma.storeMember.count({ where: { storeId } }),
};

export function hasUsageCounter(featureKey: FeatureKey): boolean {
  return featureKey in USAGE_COUNTERS;
}

export async function getFeatureUsage(storeId: string, featureKey: FeatureKey): Promise<number> {
  const counter = USAGE_COUNTERS[featureKey];
  if (!counter) return 0;
  return counter(storeId);
}
