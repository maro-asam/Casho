import { describe, expect, it } from "vitest";
import {
  applyCampaignRate,
  bonusDue,
  campaignDaysFromWindow,
  campaignDaysLeft,
  campaignRateFor,
  campaignWindowFromDays,
  isPharmacyBusiness,
  isWithinCampaign,
  type CampaignTerms,
} from "./campaign";

const TERMS: CampaignTerms = { baseRateBps: 2000, pharmacyRateBps: 3000, posRateBps: 3200 };
const WINDOW = { startsAt: new Date("2026-11-07T22:00:00Z"), endsAt: new Date("2026-12-08T22:00:00Z") };

describe("isPharmacyBusiness", () => {
  it("matches the signup type and common spellings", () => {
    expect(isPharmacyBusiness("صيدلية")).toBe(true);
    expect(isPharmacyBusiness("صيدليات")).toBe(true);
    expect(isPharmacyBusiness(" Pharmacy ")).toBe(true);
    expect(isPharmacyBusiness(null, "صيدلية")).toBe(true);
  });

  it("doesn't match other health businesses", () => {
    expect(isPharmacyBusiness("صحة وجمال")).toBe(false);
    expect(isPharmacyBusiness(null, undefined, "")).toBe(false);
  });
});

describe("isWithinCampaign", () => {
  it("includes the start and excludes the end", () => {
    expect(isWithinCampaign(WINDOW, WINDOW.startsAt)).toBe(true);
    expect(isWithinCampaign(WINDOW, new Date("2026-12-08T21:59:59Z"))).toBe(true);
    expect(isWithinCampaign(WINDOW, WINDOW.endsAt)).toBe(false);
    expect(isWithinCampaign(WINDOW, new Date("2026-11-07T21:59:59Z"))).toBe(false);
  });
});

describe("campaignRateFor", () => {
  it("is the base rate for any store", () => {
    expect(campaignRateFor(TERMS, { planKey: "SILVER", pharmacy: false })).toEqual({ rateBps: 2000, reason: "BASE" });
    expect(campaignRateFor(TERMS, { planKey: null, pharmacy: false })).toEqual({ rateBps: 2000, reason: "BASE" });
  });

  it("gives pharmacies their rate", () => {
    expect(campaignRateFor(TERMS, { planKey: "GOLD", pharmacy: true })).toEqual({ rateBps: 3000, reason: "PHARMACY" });
  });

  it("gives the POS plan its rate, and it beats pharmacy", () => {
    expect(campaignRateFor(TERMS, { planKey: "PLATINUM", pharmacy: false })).toEqual({ rateBps: 3200, reason: "POS" });
    expect(campaignRateFor(TERMS, { planKey: "PLATINUM", pharmacy: true })).toEqual({ rateBps: 3200, reason: "POS" });
  });

  it("takes whichever is higher if an admin sets pharmacy above POS", () => {
    expect(campaignRateFor({ ...TERMS, pharmacyRateBps: 3500 }, { planKey: "PLATINUM", pharmacy: true })).toEqual({ rateBps: 3500, reason: "PHARMACY" });
  });
});

describe("applyCampaignRate", () => {
  it("raises a lower normal rate", () => {
    expect(applyCampaignRate(1700, { rateBps: 2000, reason: "BASE" })).toEqual({ rateBps: 2000, reason: "BASE" });
    expect(applyCampaignRate(600, { rateBps: 3200, reason: "POS" })).toEqual({ rateBps: 3200, reason: "POS" });
  });

  it("never lowers a higher normal rate", () => {
    expect(applyCampaignRate(2200, { rateBps: 2000, reason: "BASE" })).toEqual({ rateBps: 2200, reason: null });
    expect(applyCampaignRate(2000, { rateBps: 2000, reason: "BASE" })).toEqual({ rateBps: 2000, reason: null });
  });
});

describe("bonusDue", () => {
  it("fires once the target is reached", () => {
    expect(bonusDue({ acquiredInWindow: 9, target: 10, alreadyAwarded: false })).toBe(false);
    expect(bonusDue({ acquiredInWindow: 10, target: 10, alreadyAwarded: false })).toBe(true);
    expect(bonusDue({ acquiredInWindow: 14, target: 10, alreadyAwarded: false })).toBe(true);
  });

  it("never twice, and never with no target", () => {
    expect(bonusDue({ acquiredInWindow: 10, target: 10, alreadyAwarded: true })).toBe(false);
    expect(bonusDue({ acquiredInWindow: 3, target: 0, alreadyAwarded: false })).toBe(false);
  });
});

describe("campaignDaysLeft", () => {
  it("counts today and stops at zero", () => {
    expect(campaignDaysLeft(WINDOW, new Date("2026-11-08T10:00:00Z"))).toBe(31);
    expect(campaignDaysLeft(WINDOW, new Date("2026-12-08T20:00:00Z"))).toBe(1);
    expect(campaignDaysLeft(WINDOW, WINDOW.endsAt)).toBe(0);
  });
});

describe("campaign days ↔ window", () => {
  it("turns inclusive Cairo days into a [start, end) window", () => {
    expect(campaignWindowFromDays("2026-11-08", "2026-12-08")).toEqual(WINDOW);
  });

  it("round-trips", () => {
    expect(campaignDaysFromWindow(WINDOW)).toEqual({ firstDay: "2026-11-08", lastDay: "2026-12-08" });
  });

  it("a one-day campaign is fine; an inverted or malformed one isn't", () => {
    expect(campaignWindowFromDays("2026-11-08", "2026-11-08")).not.toBeNull();
    expect(campaignWindowFromDays("2026-11-09", "2026-11-08")).toBeNull();
    expect(campaignWindowFromDays("8/11/2026", "2026-11-08")).toBeNull();
  });
});
