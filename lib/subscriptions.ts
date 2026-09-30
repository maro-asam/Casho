import { BalanceTransactionType, SubscriptionStatus } from "@prisma/client";

export const DEFAULT_GRACE_PERIOD_DAYS = 3;
export const FREE_TRIAL_DAYS = 3;

// Plan/feature configuration (limits, prices, capabilities) lives entirely in
// the database now — see lib/entitlements/ (Plan/Feature/PlanFeature models,
// admin-editable at /admin/plans). The STARTER/GROWTH/PRO/SUPER config that
// used to live here was dead code (getPlanLimits() always returned SUPER
// regardless of input) and has been removed to avoid a second, stale source
// of truth.

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getFreeTrialEndDate(fromDate?: Date) {
  const base = fromDate ? new Date(fromDate) : new Date();
  return addDays(base, FREE_TRIAL_DAYS);
}

export function isTrialActive(params: {
  trialEndDate: Date | null;
  subscriptionStatus: SubscriptionStatus;
  now?: Date;
}) {
  const { trialEndDate, subscriptionStatus, now = new Date() } = params;
  if (subscriptionStatus !== SubscriptionStatus.ACTIVE) return false;
  if (!trialEndDate) return false;
  return trialEndDate.getTime() > now.getTime();
}

export function getTrialDaysLeft(params: {
  trialEndDate: Date | null;
  now?: Date;
}) {
  const { trialEndDate, now = new Date() } = params;
  if (!trialEndDate) return 0;
  const msLeft = trialEndDate.getTime() - now.getTime();
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
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

export function getNextSubscriptionEndDate(fromDate?: Date, periodDays: number = 30) {
  const base = fromDate ? new Date(fromDate) : new Date();
  return addDays(base, periodDays);
}

/** Renewal period length for a billing cycle — used by the balance-ledger renewal engine in actions/subscription. */
export function getBillingPeriodDays(billingCycle: "MONTHLY" | "YEARLY"): number {
  return billingCycle === "YEARLY" ? 365 : 30;
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
  REFERRAL_REWARD: "مكافأة إحالة",
};
