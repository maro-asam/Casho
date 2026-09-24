import type { ReactNode } from "react";
import { hasFeature, checkLimit, type FeatureKey } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "./UpgradeRequiredCard";

/**
 * Server-side page/section gate for a boolean plan feature (spec section 9).
 * Renders `children` if the store's plan includes the feature, otherwise a
 * premium "upgrade to unlock" card. This is UX only — the corresponding
 * server action must ALSO call `assertCanUse` so the feature can't be
 * reached by calling the action directly.
 */
export async function FeatureGate({
  storeId,
  feature,
  title,
  description,
  children,
}: {
  storeId: string;
  feature: FeatureKey;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const enabled = await hasFeature(storeId, feature);
  if (enabled) return <>{children}</>;

  const { requiredPlan } = await checkLimit(storeId, feature);
  return <UpgradeRequiredCard title={title} description={description} requiredPlanSlug={requiredPlan} />;
}
