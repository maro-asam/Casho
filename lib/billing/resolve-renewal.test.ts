import { describe, expect, it } from "vitest";

import { resolveRenewal, type RenewalPlan } from "./plan-quote";

const plan = (key: string, monthlyPrice: number, yearlyPrice: number): RenewalPlan => ({ id: key, key, name: key, monthlyPrice, yearlyPrice });
const SILVER = plan("SILVER", 30000, 489900);
const PLATINUM = plan("PLATINUM", 70000, 909900);

describe("resolveRenewal", () => {
  it("charges the chosen plan's live price, ignoring the stale cached copy", () => {
    const store = { planSelected: true, billingCycle: "MONTHLY" as const, monthlyPrice: 29900, plan: PLATINUM };
    expect(resolveRenewal(store, SILVER)).toEqual({ plan: PLATINUM, price: 70000 });
  });

  it("uses the yearly price on a yearly cycle", () => {
    const store = { planSelected: true, billingCycle: "YEARLY" as const, monthlyPrice: 0, plan: SILVER };
    expect(resolveRenewal(store, SILVER).price).toBe(489900);
  });

  it("rolls a trial that never picked a plan into the entry plan, not the trial plan", () => {
    const store = { planSelected: false, billingCycle: "MONTHLY" as const, monthlyPrice: 29900, plan: PLATINUM };
    expect(resolveRenewal(store, SILVER)).toEqual({ plan: SILVER, price: 30000 });
  });

  it("falls back to the stored price only when there is no plan at all", () => {
    const store = { planSelected: true, billingCycle: "MONTHLY" as const, monthlyPrice: 12300, plan: null };
    expect(resolveRenewal(store, null)).toEqual({ plan: null, price: 12300 });
  });
});
