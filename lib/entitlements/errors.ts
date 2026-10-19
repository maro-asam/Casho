import { tr } from "@/lib/i18n/dashboard";
// Structured entitlement errors (spec section 22). Server actions catch
// these and turn them into a friendly message; API routes can serialize
// `.toJSON()` directly as the response body.

export type FeatureNotAvailableJSON = {
  code: "FEATURE_NOT_AVAILABLE";
  feature: string;
  requiredPlan: string | null;
};

export class FeatureNotAvailableError extends Error {
  readonly code = "FEATURE_NOT_AVAILABLE" as const;
  readonly feature: string;
  readonly requiredPlan: string | null;

  constructor(feature: string, requiredPlan: string | null) {
    super(`Feature "${feature}" is not available on the current plan.`);
    this.name = "FeatureNotAvailableError";
    this.feature = feature;
    this.requiredPlan = requiredPlan;
  }

  toJSON(): FeatureNotAvailableJSON {
    return { code: this.code, feature: this.feature, requiredPlan: this.requiredPlan };
  }
}

export type PlanLimitReachedJSON = {
  code: "PLAN_LIMIT_REACHED";
  feature: string;
  current: number;
  limit: number;
  requiredPlan: string | null;
};

export class PlanLimitReachedError extends Error {
  readonly code = "PLAN_LIMIT_REACHED" as const;
  readonly feature: string;
  readonly current: number;
  readonly limit: number;
  readonly requiredPlan: string | null;

  constructor(params: { feature: string; current: number; limit: number; requiredPlan: string | null }) {
    super(`Plan limit reached for "${params.feature}": ${params.current}/${params.limit}.`);
    this.name = "PlanLimitReachedError";
    this.feature = params.feature;
    this.current = params.current;
    this.limit = params.limit;
    this.requiredPlan = params.requiredPlan;
  }

  toJSON(): PlanLimitReachedJSON {
    return {
      code: this.code,
      feature: this.feature,
      current: this.current,
      limit: this.limit,
      requiredPlan: this.requiredPlan,
    };
  }
}

export type EntitlementError = FeatureNotAvailableError | PlanLimitReachedError;

export function isEntitlementError(error: unknown): error is EntitlementError {
  return error instanceof FeatureNotAvailableError || error instanceof PlanLimitReachedError;
}

// requiredPlan on the error is the machine-readable plan slug (e.g. "gold"),
// matching the API error shape in spec section 22. This maps it to an
// Arabic label for human-facing messages only.
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  get silver() { return tr("سيلفر"); },
  get gold() { return tr("جولد"); },
  get platinum() { return tr("بلاتينيوم"); },
};

function planLabel(slug: string | null): string {
  if (!slug) return tr("أعلى");
  return PLAN_DISPLAY_NAMES[slug] ?? slug;
}

// Friendly Arabic messages for server actions that catch an EntitlementError
// and need to return { success: false, message } instead of a JSON body.
export function entitlementErrorMessage(error: EntitlementError): string {
  if (error.code === "FEATURE_NOT_AVAILABLE") {
    return error.requiredPlan
      ? tr("هذه الميزة غير متاحة في باقتك الحالية. قم بالترقية إلى باقة {0} أو أعلى لاستخدامها.", planLabel(error.requiredPlan))
      : tr("هذه الميزة غير متاحة في باقتك الحالية.");
  }

  return error.requiredPlan
    ? tr("وصلت للحد الأقصى ({0}/{1}). قم بالترقية إلى باقة {2} أو أعلى للمزيد.", error.current, error.limit, planLabel(error.requiredPlan))
    : tr("وصلت للحد الأقصى ({0}/{1}).", error.current, error.limit);
}
