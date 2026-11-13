import { describe, expect, it } from "vitest";
import {
  availableCommissionActions,
  canApplyCommissionAction,
  canCancelRepAdjustment,
  signedRepAdjustment,
  validateAdjustment,
} from "./workflow";

describe("commission review transitions", () => {
  it("approved (auto) commissions can be held or reversed, not re-approved", () => {
    expect(availableCommissionActions("APPROVED")).toEqual(["hold", "reverse"]);
  });

  it("held commissions can be released, rejected or reversed", () => {
    expect(availableCommissionActions("ON_HOLD")).toEqual(["approve", "reject", "reverse"]);
  });

  it("PAID, REJECTED and REVERSED are terminal for status changes", () => {
    expect(availableCommissionActions("PAID")).toEqual([]);
    expect(availableCommissionActions("REJECTED")).toEqual([]);
    expect(availableCommissionActions("REVERSED")).toEqual([]);
    expect(canApplyCommissionAction("PAID", "reverse")).toBe(false);
  });
});

describe("validateAdjustment", () => {
  it("allows a clawback on a paid commission (deducted from the next payout)", () => {
    expect(validateAdjustment({ status: "PAID", amount: -500, currentNet: 1_000 })).toBeNull();
  });
  it("never lets the net go negative", () => {
    expect(validateAdjustment({ status: "APPROVED", amount: -1_001, currentNet: 1_000 })).not.toBeNull();
  });
  it("rejects zero and non-integer piasters", () => {
    expect(validateAdjustment({ status: "APPROVED", amount: 0, currentNet: 1_000 })).not.toBeNull();
    expect(validateAdjustment({ status: "APPROVED", amount: 1.5, currentNet: 1_000 })).not.toBeNull();
  });
  it("refuses voided commissions", () => {
    expect(validateAdjustment({ status: "REVERSED", amount: 100, currentNet: 0 })).not.toBeNull();
    expect(validateAdjustment({ status: "REJECTED", amount: 100, currentNet: 0 })).not.toBeNull();
  });
});

describe("rep bonuses and deductions", () => {
  it("a bonus is positive and a deduction negative, whatever sign came in", () => {
    expect(signedRepAdjustment("BONUS", 500)).toBe(500);
    expect(signedRepAdjustment("BONUS", -500)).toBe(500);
    expect(signedRepAdjustment("DEDUCTION", 500)).toBe(-500);
    expect(signedRepAdjustment("DEDUCTION", -500)).toBe(-500);
  });

  it("only an open entry (not canceled, not settled) can be canceled", () => {
    expect(canCancelRepAdjustment({ canceledAt: null, payoutId: null })).toBe(true);
    expect(canCancelRepAdjustment({ canceledAt: new Date(), payoutId: null })).toBe(false);
    expect(canCancelRepAdjustment({ canceledAt: null, payoutId: "p1" })).toBe(false);
  });
});
