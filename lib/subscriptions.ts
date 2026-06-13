import { BalanceTransactionType, SubscriptionStatus } from "@prisma/client";

export const DEFAULT_GRACE_PERIOD_DAYS = 3;
export const FREE_TRIAL_DAYS = 30;

// ─── Plan Types & Config ────────────────────────────────────────────────────

export type PlanKey = "STARTER" | "GROWTH" | "PRO" | "SUPER";

export type PlanLimits = {
  products: number | null;       // null = unlimited
  coupons: number | null;
  members: number | null;        // staff members (excl. owner)
  // Feature flags
  customDomain: boolean;
  exportOrders: boolean;
  blog: boolean;
  loyalty: boolean;
  abandonedCart: boolean;
  crm: boolean;                  // basic customer list
  crmAdvanced: boolean;          // segments, analytics, LTV
  metaCapi: boolean;
  telegram: boolean;
  allThemes: boolean;
  pos: boolean;
  inventory: boolean;            // branches, POs, transfers
  instagramAI: boolean;
};

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  SUPER: {
    products: null,
    coupons: null,
    members: null,
    customDomain: true,
    exportOrders: true,
    blog: true,
    loyalty: true,
    abandonedCart: true,
    crm: true,
    crmAdvanced: true,
    metaCapi: true,
    telegram: true,
    allThemes: true,
    pos: true,
    inventory: true,
    instagramAI: true,
  },
  STARTER: {
    products: 100,
    coupons: 5,
    members: 0,
    customDomain: false,
    exportOrders: false,
    blog: false,
    loyalty: false,
    abandonedCart: false,
    crm: false,
    crmAdvanced: false,
    metaCapi: false,
    telegram: false,
    allThemes: false,
    pos: false,
    inventory: false,
    instagramAI: false,
  },
  GROWTH: {
    products: 1000,
    coupons: 50,
    members: 3,
    customDomain: true,
    exportOrders: true,
    blog: true,
    loyalty: true,
    abandonedCart: true,
    crm: true,
    crmAdvanced: false,
    metaCapi: true,
    telegram: true,
    allThemes: true,
    pos: false,
    inventory: false,
    instagramAI: false,
  },
  PRO: {
    products: null,
    coupons: null,
    members: null,
    customDomain: true,
    exportOrders: true,
    blog: true,
    loyalty: true,
    abandonedCart: true,
    crm: true,
    crmAdvanced: true,
    metaCapi: true,
    telegram: true,
    allThemes: true,
    pos: true,
    inventory: true,
    instagramAI: true,
  },
};

export const PLAN_PRICES: Record<PlanKey, number> = {
  SUPER: 29900,
  STARTER: 29900,
  GROWTH: 49900,
  PRO: 99900,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  SUPER: "باقة سوبر",
  STARTER: "باقة البداية",
  GROWTH: "باقة النمو",
  PRO: "باقة المحترف",
};

export function getPlanLimits(planName: string): PlanLimits {
  if (planName === "SUPER") return PLAN_LIMITS.SUPER;
  if (planName === "GROWTH") return PLAN_LIMITS.GROWTH;
  if (planName === "PRO") return PLAN_LIMITS.PRO;
  return PLAN_LIMITS.STARTER;
}

export function planHasFeature<K extends keyof PlanLimits>(
  planName: string,
  feature: K,
): PlanLimits[K] {
  return getPlanLimits(planName)[feature];
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getFreeTrialEndDate(fromDate?: Date) {
  const base = fromDate ? new Date(fromDate) : new Date();
  return addDays(base, FREE_TRIAL_DAYS);
}

export function isSubscriptionCurrentlyActive(params: {
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  now?: Date;
}) {
  const {
    subscriptionStatus,
    subscriptionEndsAt,
    gracePeriodEndsAt,
    now = new Date(),
  } = params;

  if (subscriptionStatus === SubscriptionStatus.CANCELED) return false;

  if (
    subscriptionStatus === SubscriptionStatus.ACTIVE &&
    subscriptionEndsAt &&
    subscriptionEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  if (
    subscriptionStatus === SubscriptionStatus.GRACE_PERIOD &&
    gracePeriodEndsAt &&
    gracePeriodEndsAt.getTime() > now.getTime()
  ) {
    return true;
  }

  return false;
}

export function shouldAttemptRenewal(params: {
  autoRenew: boolean;
  subscriptionEndsAt: Date | null;
  now?: Date;
}) {
  const { autoRenew, subscriptionEndsAt, now = new Date() } = params;

  if (!autoRenew) return false;
  if (!subscriptionEndsAt) return false;

  return subscriptionEndsAt.getTime() <= now.getTime();
}

export function canChargeMonthlyPlan(params: {
  balance: number;
  monthlyPrice: number;
}) {
  return params.balance >= params.monthlyPrice;
}

export function getNextSubscriptionEndDate(fromDate?: Date) {
  const base = fromDate ? new Date(fromDate) : new Date();
  return addDays(base, 30);
}

export function normalizeBalanceAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Invalid balance amount");
  }

  return amount;
}

export function formatMoneyFromPiasters(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export const BALANCE_TRANSACTION_LABELS: Record<
  BalanceTransactionType,
  string
> = {
  TOPUP: "شحن رصيد",
  SUBSCRIPTION_CHARGE: "خصم اشتراك",
  BONUS: "رصيد إضافي",
  MANUAL_ADJUSTMENT: "تعديل يدوي",
  REFUND: "استرجاع رصيد",
};
