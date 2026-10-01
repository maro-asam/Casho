export type Cycle = "MONTHLY" | "YEARLY";

export type PlanFeatureForUI = {
  key: string;
  name: string;
  unit: string | null;
  enabled: boolean;
  isUnlimited: boolean;
  limitValue: number | null;
};

export type PlanForUI = {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice: number | null;
  originalYearlyPrice: number | null;
  sortOrder: number;
  features: PlanFeatureForUI[];
};

export const nf = new Intl.NumberFormat("ar-EG");

export function featureValueLabel(feature: PlanFeatureForUI) {
  if (!feature.enabled) return null;
  if (feature.isUnlimited) return "غير محدود";
  if (feature.limitValue !== null) return `${nf.format(feature.limitValue)} ${feature.unit ?? ""}`.trim();
  return null;
}

export const priceOf = (plan: PlanForUI, cycle: Cycle) => (cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice);

/** Yearly saving vs paying monthly for 12 months, piasters (≤0 = no saving). */
export const yearlySaving = (plan: PlanForUI) => plan.monthlyPrice * 12 - plan.yearlyPrice;
