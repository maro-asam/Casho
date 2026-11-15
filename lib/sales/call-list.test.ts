import { describe, expect, it } from "vitest";
import { activationOf, buildCallList, classifyCall, hasPaymentSetup, type CallCandidate, type CallStore } from "./call-list";

const NOW = new Date("2026-11-15T12:00:00Z");
const H = 3_600_000;
const D = 24 * H;
const at = (ms: number) => new Date(NOW.getTime() + ms);

const SET_UP = activationOf({ products: 3, orders: 1, hasPayment: true, hasShipping: true });
const EMPTY = activationOf({ products: 0, orders: 0, hasPayment: false, hasShipping: false });

function store(over: Partial<CallStore> = {}): CallStore {
  return {
    name: "متجر",
    subscriptionStatus: "ACTIVE",
    subscriptionEndsAt: at(2 * D),
    trialEndDate: at(2 * D),
    balance: 0,
    autoRenew: true,
    renewalPrice: 29_900,
    activation: SET_UP,
    ...over,
  };
}

/** Never paid, signed up `ago` ms before now, 3-day trial from signup. */
function unpaid(ago: number, over: Partial<CallStore> = {}): CallCandidate {
  const trialEnd = at(3 * D - ago);
  return { signedUpAt: at(-ago), acquiredAt: null, eligibleUntil: null, store: store({ trialEndDate: trialEnd, subscriptionEndsAt: trialEnd, ...over }) };
}

/** Paid, still eligible, period ending at `endsIn` from now. */
function paid(endsIn: number, over: Partial<CallStore> = {}): CallCandidate {
  return {
    signedUpAt: at(-40 * D),
    acquiredAt: at(-37 * D),
    eligibleUntil: at(100 * D),
    store: store({ trialEndDate: at(-37 * D), subscriptionEndsAt: at(endsIn), ...over }),
  };
}

describe("activationOf", () => {
  it("lists the first missing step in setup order", () => {
    expect(EMPTY).toMatchObject({ done: 0, next: "products" });
    expect(activationOf({ products: 2, orders: 0, hasPayment: true, hasShipping: false })).toMatchObject({ done: 2, next: "shipping" });
    expect(SET_UP).toMatchObject({ done: 4, next: null });
  });

  it("payment setup follows the dashboard rule (a method needs its details)", () => {
    const off = { cashOnDeliveryEnabled: false, vodafoneCashEnabled: false, vodafoneCashNumber: null, instapayEnabled: false, instapayAddress: null, bankTransferEnabled: false, bankTransferDetails: null };
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: null })).toBe(false);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...off, instapayEnabled: true } })).toBe(false);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...off, instapayEnabled: true, instapayAddress: "x@instapay" } })).toBe(true);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...off, cashOnDeliveryEnabled: true } })).toBe(true);
  });
});

describe("classifyCall — never paid", () => {
  it("a signup from the last day gets a welcome call", () => {
    expect(classifyCall(unpaid(3 * H), NOW)).toMatchObject({ reason: "NEW_SIGNUP" });
  });

  it("a trial ending within two days needs the plan-and-top-up call", () => {
    const c = unpaid(30 * H);
    expect(classifyCall(c, NOW)).toEqual({ reason: "TRIAL_ENDING", at: c.store!.trialEndDate });
  });

  it("a trial whose balance already covers the first period pays itself — no call", () => {
    expect(classifyCall(unpaid(30 * H, { balance: 29_900 }), NOW)).toBeNull();
    // …unless auto-renew is off.
    expect(classifyCall(unpaid(30 * H, { balance: 29_900, autoRenew: false }), NOW)).toMatchObject({ reason: "TRIAL_ENDING" });
  });

  it("a long (admin-extended) trial with setup left is stalled; fully set up, nothing to do yet", () => {
    const long = (activation = EMPTY): CallCandidate => ({
      signedUpAt: at(-2 * D),
      acquiredAt: null,
      eligibleUntil: null,
      store: store({ trialEndDate: at(10 * D), subscriptionEndsAt: at(10 * D), activation }),
    });
    expect(classifyCall(long(), NOW)).toMatchObject({ reason: "STALLED" });
    expect(classifyCall(long(SET_UP), NOW)).toBeNull();
  });

  it("a trial that ended unpaid is a win-back for 30 days", () => {
    expect(classifyCall(unpaid(5 * D, { subscriptionStatus: "PAST_DUE" }), NOW)).toMatchObject({ reason: "TRIAL_ENDED" });
    expect(classifyCall(unpaid(40 * D, { subscriptionStatus: "PAST_DUE" }), NOW)).toBeNull();
  });

  it("a signup without a store is followed up for 30 days", () => {
    expect(classifyCall({ signedUpAt: at(-2 * D), acquiredAt: null, eligibleUntil: null, store: null }, NOW)).toMatchObject({ reason: "NO_STORE" });
    expect(classifyCall({ signedUpAt: at(-31 * D), acquiredAt: null, eligibleUntil: null, store: null }, NOW)).toBeNull();
  });
});

describe("classifyCall — paid", () => {
  it("a store closed for an uncovered renewal is the top paid call", () => {
    expect(classifyCall(paid(-2 * D, { subscriptionStatus: "PAST_DUE" }), NOW)).toMatchObject({ reason: "STORE_CLOSED" });
    expect(classifyCall(paid(-61 * D, { subscriptionStatus: "PAST_DUE" }), NOW)).toBeNull();
  });

  it("a renewal within 7 days the balance won't cover reports the shortfall", () => {
    expect(classifyCall(paid(3 * D, { balance: 10_000 }), NOW)).toEqual({ reason: "RENEWAL_AT_RISK", at: at(3 * D), shortfall: 19_900, autoRenewOff: false });
  });

  it("auto-renew off closes the store at period end whatever the balance", () => {
    expect(classifyCall(paid(3 * D, { balance: 50_000, autoRenew: false }), NOW)).toMatchObject({ reason: "RENEWAL_AT_RISK", shortfall: 0, autoRenewOff: true });
  });

  it("a covered renewal, or one further than 7 days, needs no call", () => {
    expect(classifyCall(paid(3 * D, { balance: 29_900 }), NOW)).toBeNull();
    expect(classifyCall(paid(8 * D), NOW)).toBeNull();
  });

  it("past the eligibility window the rep no longer earns on them — off the list", () => {
    const c = paid(-2 * D, { subscriptionStatus: "PAST_DUE" });
    expect(classifyCall({ ...c, eligibleUntil: at(-1) }, NOW)).toBeNull();
  });
});

describe("buildCallList", () => {
  it("orders by reason, then by the moment closest to now", () => {
    const list = buildCallList(
      [
        { id: "renewal", ...paid(3 * D) },
        { id: "closed-old", ...paid(-20 * D, { subscriptionStatus: "PAST_DUE" }) },
        { id: "trial-late", ...unpaid(26 * H) },
        { id: "closed-new", ...paid(-1 * D, { subscriptionStatus: "PAST_DUE" }) },
        { id: "fine", ...paid(20 * D) },
        { id: "trial-soon", ...unpaid(60 * H) },
        { id: "new", ...unpaid(2 * H) },
      ],
      NOW,
    );
    expect(list.map((r) => r.id)).toEqual(["trial-soon", "trial-late", "closed-new", "closed-old", "new", "renewal"]);
  });
});
