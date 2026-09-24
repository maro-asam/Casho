export { FEATURE_KEYS, PLAN_KEYS, type FeatureKey, type PlanTierKey } from "./feature-keys";
export {
  can,
  hasFeature,
  isUnlimited,
  getLimit,
  remaining,
  checkLimit,
  assertCanUse,
  getEntitlementsSnapshot,
  getEntitlementContext,
  getAllActivePlans,
  getDefaultTrialPlanId,
  type LimitCheckResult,
  type EntitlementsSnapshot,
} from "./service";
export {
  FeatureNotAvailableError,
  PlanLimitReachedError,
  isEntitlementError,
  entitlementErrorMessage,
  type EntitlementError,
  type FeatureNotAvailableJSON,
  type PlanLimitReachedJSON,
} from "./errors";
export { getFeatureUsage, hasUsageCounter } from "./usage";
export {
  previewPlanChange,
  type PlanChangePreview,
  type PlanChangeFeatureDiff,
  type PlanChangeOverage,
} from "./plan-change";
