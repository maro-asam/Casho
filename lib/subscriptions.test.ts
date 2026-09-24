import { describe, it, expect } from "vitest";
import { SubscriptionStatus } from "@prisma/client";
import {
  isSubscriptionCurrentlyActive,
  shouldAttemptRenewal,
  canChargeMonthlyPlan,
  isTrialActive,
  getTrialDaysLeft,
  getFreeTrialEndDate,
  getBillingPeriodDays,
  addDays,
} from "./subscriptions";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("isSubscriptionCurrentlyActive", () => {
  it("is active while ACTIVE and subscriptionEndsAt is in the future", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: addDays(NOW, 5),
        gracePeriodEndsAt: null,
        now: NOW,
      }),
    ).toBe(true);
  });

  it("is inactive once ACTIVE but subscriptionEndsAt has passed (expired)", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: addDays(NOW, -1),
        gracePeriodEndsAt: null,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("is active during an unexpired grace period", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        subscriptionEndsAt: addDays(NOW, -1),
        gracePeriodEndsAt: addDays(NOW, 2),
        now: NOW,
      }),
    ).toBe(true);
  });

  it("is inactive once the grace period has expired", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        subscriptionEndsAt: addDays(NOW, -4),
        gracePeriodEndsAt: addDays(NOW, -1),
        now: NOW,
      }),
    ).toBe(false);
  });

  it("is never active once CANCELED, even with a future subscriptionEndsAt", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.CANCELED,
        subscriptionEndsAt: addDays(NOW, 10),
        gracePeriodEndsAt: null,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("is inactive for PAST_DUE", () => {
    expect(
      isSubscriptionCurrentlyActive({
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        subscriptionEndsAt: addDays(NOW, -10),
        gracePeriodEndsAt: addDays(NOW, -1),
        now: NOW,
      }),
    ).toBe(false);
  });
});

describe("shouldAttemptRenewal", () => {
  it("attempts renewal when autoRenew is on and the period has ended", () => {
    expect(shouldAttemptRenewal({ autoRenew: true, subscriptionEndsAt: addDays(NOW, -1), now: NOW })).toBe(true);
  });

  it("does not attempt renewal when autoRenew is off", () => {
    expect(shouldAttemptRenewal({ autoRenew: false, subscriptionEndsAt: addDays(NOW, -1), now: NOW })).toBe(false);
  });

  it("does not attempt renewal before the period ends", () => {
    expect(shouldAttemptRenewal({ autoRenew: true, subscriptionEndsAt: addDays(NOW, 1), now: NOW })).toBe(false);
  });
});

describe("canChargeMonthlyPlan", () => {
  it("can charge when balance covers the price", () => {
    expect(canChargeMonthlyPlan({ balance: 50000, monthlyPrice: 30000 })).toBe(true);
  });

  it("cannot charge when balance is short", () => {
    expect(canChargeMonthlyPlan({ balance: 10000, monthlyPrice: 30000 })).toBe(false);
  });
});

describe("trial helpers", () => {
  it("computes a 3-day trial end date", () => {
    expect(getFreeTrialEndDate(NOW).getTime()).toBe(addDays(NOW, 3).getTime());
  });

  it("is on trial while ACTIVE and trialEndDate is in the future", () => {
    expect(
      isTrialActive({ trialEndDate: addDays(NOW, 1), subscriptionStatus: SubscriptionStatus.ACTIVE, now: NOW }),
    ).toBe(true);
  });

  it("is not on trial once trialEndDate has passed", () => {
    expect(
      isTrialActive({ trialEndDate: addDays(NOW, -1), subscriptionStatus: SubscriptionStatus.ACTIVE, now: NOW }),
    ).toBe(false);
  });

  it("is not on trial if the subscription was canceled, even before trialEndDate", () => {
    expect(
      isTrialActive({ trialEndDate: addDays(NOW, 2), subscriptionStatus: SubscriptionStatus.CANCELED, now: NOW }),
    ).toBe(false);
  });

  it("counts whole days left in the trial, rounding up", () => {
    const trialEndDate = new Date(NOW.getTime() + 36 * 60 * 60 * 1000); // 1.5 days left
    expect(getTrialDaysLeft({ trialEndDate, now: NOW })).toBe(2);
  });

  it("returns 0 days left once expired", () => {
    expect(getTrialDaysLeft({ trialEndDate: addDays(NOW, -1), now: NOW })).toBe(0);
  });
});

describe("getBillingPeriodDays", () => {
  it("is 30 days for monthly billing", () => {
    expect(getBillingPeriodDays("MONTHLY")).toBe(30);
  });

  it("is 365 days for yearly billing", () => {
    expect(getBillingPeriodDays("YEARLY")).toBe(365);
  });
});
