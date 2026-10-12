import { describe, expect, it } from "vitest";
import {
  allocateTiers,
  cairoMonthStart,
  cohortMonthOf,
  commissionAmount,
  decideChargeCommission,
  eligibleUntilFor,
  isWithinEligibility,
  levelForEligibleCount,
  normalizeReferralCode,
  refundClawback,
  salesRepAt,
  tierForPosition,
  type CommissionRuleSet,
} from "./rules";

const RULE: CommissionRuleSet = {
  id: "r1",
  starterRateBps: 1700,
  growthRateBps: 2000,
  proRateBps: 2200,
  starterMaxPosition: 10,
  growthMaxPosition: 20,
  renewalRateBps: 600,
  eligibilityMonths: 6,
};

/** Rate the next customer gets with `eligible` currently eligible customers. */
const nextRate = (eligible: number) => tierForPosition(eligible + 1, RULE).rateBps;

describe("tierForPosition — marginal tiers", () => {
  it("positions 1–10 earn 17%", () => {
    for (let p = 1; p <= 10; p++) expect(tierForPosition(p, RULE)).toEqual({ tier: "STARTER", rateBps: 1700 });
  });
  it("positions 11–20 earn 20%", () => {
    expect(tierForPosition(11, RULE)).toEqual({ tier: "GROWTH", rateBps: 2000 });
    expect(tierForPosition(20, RULE)).toEqual({ tier: "GROWTH", rateBps: 2000 });
  });
  it("position 21 and above earn 22%", () => {
    expect(tierForPosition(21, RULE)).toEqual({ tier: "PRO", rateBps: 2200 });
    expect(tierForPosition(250, RULE)).toEqual({ tier: "PRO", rateBps: 2200 });
  });
  it("rejects invalid positions", () => {
    expect(() => tierForPosition(0, RULE)).toThrow();
    expect(() => tierForPosition(1.5, RULE)).toThrow();
  });
});

describe("allocateTiers — not retroactive", () => {
  it("10 eligible → all at 17%", () => expect(allocateTiers(10, RULE)).toEqual({ STARTER: 10, GROWTH: 0, PRO: 0 }));
  it("11 eligible → 10 + 1", () => expect(allocateTiers(11, RULE)).toEqual({ STARTER: 10, GROWTH: 1, PRO: 0 }));
  it("20 eligible → 10 + 10", () => expect(allocateTiers(20, RULE)).toEqual({ STARTER: 10, GROWTH: 10, PRO: 0 }));
  it("21 eligible → 10 + 10 + 1", () => expect(allocateTiers(21, RULE)).toEqual({ STARTER: 10, GROWTH: 10, PRO: 1 }));
  it("25 eligible → 10 + 10 + 5 (22% is NOT applied to everyone)", () =>
    expect(allocateTiers(25, RULE)).toEqual({ STARTER: 10, GROWTH: 10, PRO: 5 }));
  it("100 eligible", () => expect(allocateTiers(100, RULE)).toEqual({ STARTER: 10, GROWTH: 10, PRO: 80 }));
  it("0 eligible", () => expect(allocateTiers(0, RULE)).toEqual({ STARTER: 0, GROWTH: 0, PRO: 0 }));
});

describe("cohort expiration changes only future tier allocation", () => {
  it("25 eligible, 5 expire → 20 → the next customer is #21 at 22%", () => {
    expect(nextRate(25)).toBe(2200);
    expect(nextRate(20)).toBe(2200);
    expect(levelForEligibleCount(20, RULE)).toBe("GROWTH");
  });
  it("drops to 9 → the next customer is #10 at 17%", () => {
    expect(nextRate(9)).toBe(1700);
    expect(levelForEligibleCount(9, RULE)).toBe("STARTER");
  });
  it("10 eligible → next is #11 at 20%", () => expect(nextRate(10)).toBe(2000));
});

describe("commissionAmount — integer piasters, half-up", () => {
  it("17% of 299 EGP", () => expect(commissionAmount(29_900, 1700)).toBe(5_083));
  it("6% of 299 EGP", () => expect(commissionAmount(29_900, 600)).toBe(1_794));
  it("rounds half up", () => {
    expect(commissionAmount(25, 1000)).toBe(3); // 2.5 → 3
    expect(commissionAmount(24, 1000)).toBe(2); // 2.4 → 2
  });
  it("large yearly amounts stay exact", () => expect(commissionAmount(358_800, 2200)).toBe(78_936));
  it("rejects non-integer or negative bases and bad rates", () => {
    expect(() => commissionAmount(10.5, 600)).toThrow();
    expect(() => commissionAmount(-1, 600)).toThrow();
    expect(() => commissionAmount(100, 10_001)).toThrow();
  });
});

describe("calendar-month cohorts in Africa/Cairo", () => {
  it("uses Cairo wall time, not UTC, for the cohort month", () => {
    // 2026-03-31 22:30 UTC = 2026-04-01 00:30 in Cairo (UTC+2)
    expect(cohortMonthOf(new Date("2026-03-31T22:30:00Z"))).toBe("2026-04");
    expect(cohortMonthOf(new Date("2026-03-31T21:30:00Z"))).toBe("2026-03");
  });

  it("eligibility ends at 00:00 Cairo on the 1st of month M+6, whatever day of M", () => {
    const early = eligibleUntilFor(new Date("2026-04-01T08:00:00Z"), 6);
    const late = eligibleUntilFor(new Date("2026-04-30T18:00:00Z"), 6);
    expect(early.toISOString()).toBe(late.toISOString());
    expect(cohortMonthOf(early)).toBe("2026-10");
    expect(cohortMonthOf(new Date(early.getTime() - 1))).toBe("2026-09");
  });

  it("handles Egypt DST and year wrap", () => {
    // Oct 1 2026 is in Egyptian summer time (UTC+3)
    expect(cairoMonthStart(2026, 10).toISOString()).toBe("2026-09-30T21:00:00.000Z");
    // Mar 1 2027 is standard time (UTC+2)
    expect(eligibleUntilFor(new Date("2026-09-10T10:00:00Z"), 6).toISOString()).toBe("2027-02-28T22:00:00.000Z");
    expect(cairoMonthStart(2026, 13).toISOString()).toBe(cairoMonthStart(2027, 1).toISOString());
    expect(cairoMonthStart(2026, 0).toISOString()).toBe(cairoMonthStart(2025, 12).toISOString());
  });

  it("isWithinEligibility is exclusive at the end", () => {
    const end = new Date("2026-09-30T21:00:00Z");
    expect(isWithinEligibility(new Date(end.getTime() - 1), end)).toBe(true);
    expect(isWithinEligibility(end, end)).toBe(false);
    expect(isWithinEligibility(new Date(), null)).toBe(false);
  });
});

describe("decideChargeCommission", () => {
  const acquiredAt = new Date("2026-04-10T10:00:00Z");
  const eligibleUntil = eligibleUntilFor(acquiredAt, 6);
  const base = { chargeAt: acquiredAt, eligibleUntil, eligibleCountBefore: 0, rule: RULE };

  it("the first charge is an acquisition, never a renewal", () => {
    const d = decideChargeCommission({ ...base, isFirstCharge: true, chargeLedgerAmount: -29_900 });
    expect(d).toEqual({ kind: "ACQUISITION", basisAmount: 29_900, rateBps: 1700, amount: 5_083, tier: "STARTER", customerPosition: 1 });
  });

  it("acquisition position follows the current eligible count", () => {
    const d = decideChargeCommission({ ...base, isFirstCharge: true, chargeLedgerAmount: -10_000, eligibleCountBefore: 10 });
    expect(d).toMatchObject({ kind: "ACQUISITION", customerPosition: 11, tier: "GROWTH", rateBps: 2000, amount: 2_000 });
    const pro = decideChargeCommission({ ...base, isFirstCharge: true, chargeLedgerAmount: -10_000, eligibleCountBefore: 20 });
    expect(pro).toMatchObject({ customerPosition: 21, tier: "PRO", rateBps: 2200, amount: 2_200 });
  });

  it("a later charge inside the window is a 6% renewal", () => {
    const d = decideChargeCommission({ ...base, isFirstCharge: false, chargeLedgerAmount: -29_900, chargeAt: new Date("2026-09-30T20:59:59Z") });
    expect(d).toEqual({ kind: "RENEWAL", basisAmount: 29_900, rateBps: 600, amount: 1_794 });
  });

  it("a renewal at/after the window end earns nothing", () => {
    const d = decideChargeCommission({ ...base, isFirstCharge: false, chargeLedgerAmount: -29_900, chargeAt: eligibleUntil });
    expect(d).toEqual({ kind: "NONE", reason: "outside_window" });
  });

  it("an acquisition is earned even if processed late (window does not gate the first charge)", () => {
    const d = decideChargeCommission({ ...base, isFirstCharge: true, chargeLedgerAmount: -100, chargeAt: new Date("2030-01-01Z") });
    expect(d.kind).toBe("ACQUISITION");
  });

  it("zero and positive ledger rows are not charges", () => {
    expect(decideChargeCommission({ ...base, isFirstCharge: false, chargeLedgerAmount: 0 })).toEqual({ kind: "NONE", reason: "zero_amount" });
    expect(decideChargeCommission({ ...base, isFirstCharge: false, chargeLedgerAmount: 500 })).toEqual({ kind: "NONE", reason: "not_a_charge" });
  });
});

describe("refundClawback", () => {
  it("refund × the funding commission's rate", () => {
    expect(refundClawback({ refundAmount: 15_000, commissionRateBps: 600, commissionNet: 1_794 })).toBe(900);
  });
  it("is capped at the remaining net (never negative)", () => {
    expect(refundClawback({ refundAmount: 100_000, commissionRateBps: 2200, commissionNet: 500 })).toBe(500);
    expect(refundClawback({ refundAmount: 100, commissionRateBps: 600, commissionNet: 0 })).toBe(0);
  });
});

describe("salesRepAt — attribution history replay", () => {
  const attribution = {
    originalSalesRepId: "repA",
    createdAt: new Date("2026-01-01Z"),
    changes: [{ toSalesRepId: "repB", createdAt: new Date("2026-03-01Z") }],
  };
  it("null before the attribution existed (no retroactive credit)", () => {
    expect(salesRepAt(new Date("2025-12-31Z"), attribution)).toBeNull();
  });
  it("original rep until the reassignment, new rep after", () => {
    expect(salesRepAt(new Date("2026-02-15Z"), attribution)).toBe("repA");
    expect(salesRepAt(new Date("2026-03-01Z"), attribution)).toBe("repB");
    expect(salesRepAt(new Date("2026-06-01Z"), attribution)).toBe("repB");
  });
});

describe("normalizeReferralCode", () => {
  it("accepts and upper-cases codes", () => expect(normalizeReferralCode(" ab12cd34ef ")).toBe("AB12CD34EF"));
  it("rejects anything else without touching the DB", () => {
    expect(normalizeReferralCode("")).toBeNull();
    expect(normalizeReferralCode(null)).toBeNull();
    expect(normalizeReferralCode("abc")).toBeNull();
    expect(normalizeReferralCode("x'; DROP TABLE")).toBeNull();
    expect(normalizeReferralCode("A".repeat(33))).toBeNull();
  });
});
