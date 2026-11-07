import { describe, expect, it } from "vitest";
import { bucketByMonth, lastMonths, levelProgress, monthStart, sortFollowUps } from "./insights";
import type { CommissionRuleSet } from "./rules";

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

describe("levelProgress", () => {
  it("starts at zero in Starter with Growth to unlock", () => {
    expect(levelProgress(0, RULE)).toEqual({
      next: { tier: "STARTER", rateBps: 1700 },
      unlock: { tier: "GROWTH", rateBps: 2000, remaining: 10 },
      progress: 0,
    });
  });

  it("counts down inside the Starter band", () => {
    const p = levelProgress(7, RULE);
    expect(p.next.tier).toBe("STARTER");
    expect(p.unlock?.remaining).toBe(3);
    expect(p.progress).toBeCloseTo(0.7);
  });

  it("gives the next customer the Growth rate once the Starter band is full", () => {
    expect(levelProgress(10, RULE)).toEqual({
      next: { tier: "GROWTH", rateBps: 2000 },
      unlock: { tier: "PRO", rateBps: 2200, remaining: 10 },
      progress: 0,
    });
    expect(levelProgress(15, RULE).progress).toBeCloseTo(0.5);
  });

  it("tops out at Pro", () => {
    expect(levelProgress(20, RULE)).toEqual({ next: { tier: "PRO", rateBps: 2200 }, unlock: null, progress: 1 });
    expect(levelProgress(57, RULE).unlock).toBeNull();
  });

  it("treats bad counts as zero", () => {
    expect(levelProgress(-3, RULE).unlock?.remaining).toBe(10);
  });
});

describe("lastMonths", () => {
  it("lists Cairo months oldest first, across a year boundary", () => {
    expect(lastMonths(new Date("2026-02-10T10:00:00Z"), 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("uses Cairo's calendar, not UTC's", () => {
    // 23:30 UTC on Oct 31 is already Nov 1 in Cairo.
    expect(lastMonths(new Date("2026-10-31T23:30:00Z"), 1)).toEqual(["2026-11"]);
  });

  it("monthStart is the Cairo midnight of the 1st", () => {
    expect(monthStart("2026-01").toISOString()).toBe("2025-12-31T22:00:00.000Z");
  });
});

describe("bucketByMonth", () => {
  const months = ["2026-09", "2026-10", "2026-11"];

  it("counts and sums per month, skipping out-of-range and missing dates", () => {
    const items = [
      { at: new Date("2026-09-15T12:00:00Z"), v: 100 },
      { at: new Date("2026-11-01T00:30:00Z"), v: 50 }, // Nov 1 in Cairo
      { at: new Date("2026-11-20T12:00:00Z"), v: 25 },
      { at: new Date("2026-06-01T12:00:00Z"), v: 999 },
      { at: null, v: 999 },
    ];
    expect(bucketByMonth(months, items, (i) => i.at)).toEqual([1, 0, 2]);
    expect(bucketByMonth(months, items, (i) => i.at, (i) => i.v)).toEqual([100, 0, 75]);
  });
});

describe("sortFollowUps", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  const row = (id: string, signedUpAt: string, trialEndDate: string | null) => ({
    id,
    signedUpAt: new Date(signedUpAt),
    trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
  });

  it("puts running trials first, ending soonest, then the newest signups", () => {
    const rows = [
      row("old-no-trial", "2026-10-01T00:00:00Z", null),
      row("trial-later", "2026-11-06T00:00:00Z", "2026-11-09T00:00:00Z"),
      row("trial-ended", "2026-11-01T00:00:00Z", "2026-11-04T00:00:00Z"),
      row("trial-soon", "2026-11-05T00:00:00Z", "2026-11-08T00:00:00Z"),
      row("new-no-trial", "2026-11-07T00:00:00Z", null),
    ];
    expect(sortFollowUps(rows, now).map((r) => r.id)).toEqual([
      "trial-soon",
      "trial-later",
      "new-no-trial",
      "trial-ended",
      "old-no-trial",
    ]);
  });
});
