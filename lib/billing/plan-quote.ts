import type { BillingCycle, SubscriptionStatus } from "@prisma/client";
import { addMonths, addYears } from "date-fns";
import { getBillingPeriodDays } from "@/lib/subscriptions";

const DAY_MS = 86_400_000;

/**
 * How a plan change is billed, decided by where the store is in its cycle:
 *  - trial    → switch now, nothing charged; the first charge happens when the trial ends.
 *  - prorate  → paid period running: the unused part of the current period is credited,
 *               the new plan starts today for a full period, the difference is charged
 *               (or refunded to the balance when it's negative).
 *  - activate → no running paid period (expired / grace / inactive): the new plan is
 *               charged in full and a new period starts today.
 */
export type PlanQuoteMode = "same" | "trial" | "prorate" | "activate";

export type PlanQuoteStore = {
  balance: number;
  monthlyPrice: number; // price of the current billing period, piasters
  billingCycle: BillingCycle;
  planId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | null;
  trialEndDate: Date | null;
};

export type PlanQuoteTarget = {
  id: string;
  monthlyPrice: number;
  yearlyPrice: number;
};

export type PlanQuote = {
  mode: PlanQuoteMode;
  cycle: BillingCycle;
  /** Price of one period of the target plan in the chosen cycle. */
  price: number;
  /** Value of the unused days of the current period (prorate only). */
  credit: number;
  /** Positive = taken from balance now, negative = returned to balance. */
  charge: number;
  balanceAfter: number;
  /** How much the merchant must top up before the change can be applied. */
  shortfall: number;
  /** When the (new) period ends after applying. */
  periodEndsAt: Date | null;
  /** First charge date for trial mode. */
  firstChargeAt: Date | null;
  remainingDays: number;
};

export function priceForCycle(plan: PlanQuoteTarget, cycle: BillingCycle) {
  return cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
}

export type RenewalPlan = PlanQuoteTarget & { key: string; name: string };

/**
 * What the store's next period costs, and on which plan. The plan is the only
 * source of price — `Store.monthlyPrice` is just a cached copy for display.
 *  - a plan the merchant chose → that plan's price for their cycle
 *  - never chose (still on the trial plan) → the entry paid plan, so a trial
 *    never silently rolls into the most expensive plan
 *  - no plan at all (legacy rows) → the stored price
 */
export function resolveRenewal(
  store: { planSelected: boolean; billingCycle: BillingCycle; monthlyPrice: number; plan: RenewalPlan | null },
  entryPlan: RenewalPlan | null,
): { plan: RenewalPlan | null; price: number } {
  const plan = store.planSelected ? store.plan : (entryPlan ?? store.plan);
  if (!plan) return { plan: null, price: store.monthlyPrice };
  return { plan, price: priceForCycle(plan, store.billingCycle) };
}

export function nextPeriodEnd(from: Date, cycle: BillingCycle) {
  return cycle === "YEARLY" ? addYears(from, 1) : addMonths(from, 1);
}

export function isInTrial(store: PlanQuoteStore, now: Date) {
  const { trialEndDate, subscriptionEndsAt } = store;
  if (store.subscriptionStatus !== "ACTIVE" || !trialEndDate || !subscriptionEndsAt) return false;
  // Once the first paid period starts, subscriptionEndsAt moves past the trial end.
  return subscriptionEndsAt.getTime() <= trialEndDate.getTime() + 60_000 && subscriptionEndsAt.getTime() > now.getTime();
}

export function hasRunningPaidPeriod(store: PlanQuoteStore, now: Date) {
  return (
    store.subscriptionStatus === "ACTIVE" &&
    !!store.subscriptionEndsAt &&
    store.subscriptionEndsAt.getTime() > now.getTime() &&
    !isInTrial(store, now)
  );
}

export function quotePlanChange(store: PlanQuoteStore, target: PlanQuoteTarget, cycle: BillingCycle, now = new Date()): PlanQuote {
  const price = priceForCycle(target, cycle);
  const remainingMs = store.subscriptionEndsAt ? Math.max(0, store.subscriptionEndsAt.getTime() - now.getTime()) : 0;
  const remainingDays = Math.ceil(remainingMs / DAY_MS);
  const base = { cycle, price, credit: 0, remainingDays };

  const covered = isInTrial(store, now) || hasRunningPaidPeriod(store, now);
  if (store.planId === target.id && store.billingCycle === cycle && covered) {
    return { ...base, mode: "same", charge: 0, balanceAfter: store.balance, shortfall: 0, periodEndsAt: store.subscriptionEndsAt, firstChargeAt: null };
  }

  if (isInTrial(store, now)) {
    return {
      ...base,
      mode: "trial",
      charge: 0,
      balanceAfter: store.balance,
      shortfall: 0,
      periodEndsAt: store.subscriptionEndsAt,
      firstChargeAt: store.subscriptionEndsAt,
    };
  }

  if (hasRunningPaidPeriod(store, now)) {
    const periodMs = getBillingPeriodDays(store.billingCycle) * DAY_MS;
    const credit = Math.round(store.monthlyPrice * Math.min(1, remainingMs / periodMs));
    const charge = price - credit;
    return {
      ...base,
      mode: "prorate",
      credit,
      charge,
      balanceAfter: store.balance - charge,
      shortfall: Math.max(0, charge - store.balance),
      periodEndsAt: nextPeriodEnd(now, cycle),
      firstChargeAt: null,
    };
  }

  return {
    ...base,
    mode: "activate",
    charge: price,
    balanceAfter: store.balance - price,
    shortfall: Math.max(0, price - store.balance),
    periodEndsAt: nextPeriodEnd(now, cycle),
    firstChargeAt: null,
  };
}
