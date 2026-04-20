import { BalanceTransactionType, SubscriptionStatus } from "@prisma/client";

export const DEFAULT_GRACE_PERIOD_DAYS = 3;

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
