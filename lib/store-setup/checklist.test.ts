import { describe, expect, it } from "vitest";
import { buildSetupSteps, hasPaymentSetup, hasShippingSetup, setupProgress, subscriptionSetup, type SetupFacts } from "./checklist";

const NOW = new Date("2026-11-17T12:00:00Z");
const DAY = 86_400_000;

const EMPTY: SetupFacts = {
  logo: false,
  whatsapp: false,
  products: 0,
  demo: false,
  payment: false,
  shipping: false,
  subscription: { state: "inactive" },
  categories: 0,
  banners: 0,
  social: false,
  domain: false,
  orders: 0,
};

const READY: SetupFacts = {
  ...EMPTY,
  logo: true,
  whatsapp: true,
  products: 3,
  payment: true,
  shipping: true,
  subscription: { state: "paid" },
};

const ids = (facts: SetupFacts, group: "essential" | "boost") =>
  buildSetupSteps(facts)
    .filter((s) => s.group === group)
    .map((s) => s.id);

describe("buildSetupSteps", () => {
  it("lists the essentials in setup order, logo first", () => {
    expect(ids(EMPTY, "essential")).toEqual(["logo", "whatsapp", "products", "payment", "shipping", "subscription"]);
    expect(ids(EMPTY, "boost")).toEqual(["categories", "banner", "social", "domain", "firstOrder"]);
  });

  it("asks to remove the sample catalog only while it's there, right after adding products", () => {
    expect(ids({ ...READY, demo: true }, "essential")).toEqual(["logo", "whatsapp", "products", "demo", "payment", "shipping", "subscription"]);
    expect(setupProgress(buildSetupSteps({ ...READY, demo: true }))).toMatchObject({ ready: false, next: { id: "demo" } });
  });

  it("a trial counts only when the balance will pay the first period", () => {
    const sub = (subscription: SetupFacts["subscription"]) => buildSetupSteps({ ...READY, subscription }).find((s) => s.id === "subscription")!.done;
    expect(sub({ state: "paid" })).toBe(true);
    expect(sub({ state: "trial", endsAt: NOW, covered: true })).toBe(true);
    expect(sub({ state: "trial", endsAt: NOW, covered: false })).toBe(false);
    expect(sub({ state: "inactive" })).toBe(false);
  });
});

describe("setupProgress", () => {
  it("points at the first open essential", () => {
    expect(setupProgress(buildSetupSteps(EMPTY))).toMatchObject({ essentialsDone: 0, essentialsTotal: 6, ready: false, next: { id: "logo" } });
    expect(setupProgress(buildSetupSteps({ ...EMPTY, logo: true, whatsapp: true }))).toMatchObject({ essentialsDone: 2, next: { id: "products" } });
  });

  it("is ready once every essential is done — boosts never block it", () => {
    expect(setupProgress(buildSetupSteps(READY))).toMatchObject({ ready: true, essentialsDone: 6, next: { id: "categories" } });
  });

  it("has no next step when everything is done", () => {
    const all = { ...READY, categories: 2, banners: 1, social: true, domain: true, orders: 1 };
    expect(setupProgress(buildSetupSteps(all)).next).toBeNull();
  });
});

describe("hasPaymentSetup", () => {
  const settings = {
    cashOnDeliveryEnabled: false,
    vodafoneCashEnabled: false,
    vodafoneCashNumber: null,
    instapayEnabled: false,
    instapayAddress: null,
    bankTransferEnabled: false,
    bankTransferDetails: null,
    paymobEnabled: false,
  };
  it("needs a method that's on and has its details", () => {
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: null })).toBe(false);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...settings, vodafoneCashEnabled: true } })).toBe(false);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...settings, vodafoneCashEnabled: true, vodafoneCashNumber: "01012345678" } })).toBe(true);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...settings, cashOnDeliveryEnabled: true } })).toBe(true);
    expect(hasPaymentSetup({ paymentMethods: [], storePaymentSettings: { ...settings, paymobEnabled: true } })).toBe(true);
  });
});

describe("hasShippingSetup", () => {
  it("counts a price, shipping methods, or free shipping chosen in onboarding", () => {
    expect(hasShippingSetup({ shippingPrice: 0, shippingMethods: 0, onboardingCompleted: false })).toBe(false);
    expect(hasShippingSetup({ shippingPrice: 50, shippingMethods: 0, onboardingCompleted: false })).toBe(true);
    expect(hasShippingSetup({ shippingPrice: 0, shippingMethods: 2, onboardingCompleted: false })).toBe(true);
    expect(hasShippingSetup({ shippingPrice: 0, shippingMethods: 0, onboardingCompleted: true })).toBe(true);
  });
});

describe("subscriptionSetup", () => {
  const base = {
    balance: 0,
    monthlyPrice: 29_900,
    billingCycle: "MONTHLY" as const,
    planId: null,
    autoRenew: true,
    subscriptionStatus: "ACTIVE" as const,
  };
  const trialEnd = new Date(NOW.getTime() + 2 * DAY);
  const trial = { ...base, trialEndDate: trialEnd, subscriptionEndsAt: trialEnd };

  it("a trial is covered when auto-renew is on and the balance pays the first period", () => {
    expect(subscriptionSetup(trial, 29_900, NOW)).toEqual({ state: "trial", endsAt: trialEnd, covered: false });
    expect(subscriptionSetup({ ...trial, balance: 30_000 }, 29_900, NOW)).toEqual({ state: "trial", endsAt: trialEnd, covered: true });
    expect(subscriptionSetup({ ...trial, balance: 30_000, autoRenew: false }, 29_900, NOW)).toMatchObject({ covered: false });
  });

  it("a paid period past the trial is paid; an expired or closed store is inactive", () => {
    const paidEnd = new Date(NOW.getTime() + 20 * DAY);
    expect(subscriptionSetup({ ...base, trialEndDate: new Date(NOW.getTime() - 10 * DAY), subscriptionEndsAt: paidEnd }, 29_900, NOW)).toEqual({ state: "paid" });
    expect(subscriptionSetup({ ...base, subscriptionStatus: "PAST_DUE", trialEndDate: null, subscriptionEndsAt: new Date(NOW.getTime() - DAY) }, 29_900, NOW)).toEqual({
      state: "inactive",
    });
  });
});
