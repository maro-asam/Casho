import { hasRunningPaidPeriod, isInTrial, type PlanQuoteStore } from "@/lib/billing/plan-quote";

// The store setup checklist ("جهّز متجرك للبيع" on the dashboard overview).
// Essentials are what a store needs before it can take a real order; boosts
// make it sell better and never block "ready". Pure — the facts are loaded in
// ./server.ts and the copy lives in the dashboard card. The sales rep's view
// of a customer's setup uses the same payment / shipping rules.

export type SetupGroup = "essential" | "boost";

export type SetupStepId =
  // essentials, in the order a merchant should do them (quick wins first)
  | "logo"
  | "whatsapp"
  | "products"
  | "demo"
  | "payment"
  | "shipping"
  | "subscription"
  // boosts
  | "categories"
  | "banner"
  | "social"
  | "domain"
  | "firstOrder";

export type SetupStep = { id: SetupStepId; group: SetupGroup; done: boolean };

export type SubscriptionSetup =
  /** A paid period is running. */
  | { state: "paid" }
  /** Still in the free trial; `covered` = the balance + auto-renew pay the first period when it ends. */
  | { state: "trial"; endsAt: Date; covered: boolean }
  /** Closed, expired or never activated. */
  | { state: "inactive" };

export type SetupFacts = {
  logo: boolean;
  whatsapp: boolean;
  /** Active products the merchant added (the sample catalog doesn't count). */
  products: number;
  /** The onboarding sample catalog is still in the store (it shows on the storefront). */
  demo: boolean;
  payment: boolean;
  shipping: boolean;
  subscription: SubscriptionSetup;
  categories: number;
  banners: number;
  social: boolean;
  domain: boolean;
  /** Orders from real customers. */
  orders: number;
};

export function buildSetupSteps(f: SetupFacts): SetupStep[] {
  const essential = (id: SetupStepId, done: boolean): SetupStep => ({ id, group: "essential", done });
  const boost = (id: SetupStepId, done: boolean): SetupStep => ({ id, group: "boost", done });
  const sub = f.subscription;
  return [
    essential("logo", f.logo),
    essential("whatsapp", f.whatsapp),
    essential("products", f.products > 0),
    // Only while there's sample data to remove — it's live on the storefront until then.
    ...(f.demo ? [essential("demo", false)] : []),
    essential("payment", f.payment),
    essential("shipping", f.shipping),
    essential("subscription", sub.state === "paid" || (sub.state === "trial" && sub.covered)),
    boost("categories", f.categories > 0),
    boost("banner", f.banners > 0),
    boost("social", f.social),
    boost("domain", f.domain),
    boost("firstOrder", f.orders > 0),
  ];
}

export type SetupProgress = {
  essentialsDone: number;
  essentialsTotal: number;
  /** Every essential is done: the store can sell. */
  ready: boolean;
  /** The step to do now: the first open essential, then the first open boost; null when everything is done. */
  next: SetupStep | null;
};

export function setupProgress(steps: SetupStep[]): SetupProgress {
  const essentials = steps.filter((s) => s.group === "essential");
  const essentialsDone = essentials.filter((s) => s.done).length;
  return {
    essentialsDone,
    essentialsTotal: essentials.length,
    ready: essentialsDone === essentials.length,
    next: essentials.find((s) => !s.done) ?? steps.find((s) => s.group === "boost" && !s.done) ?? null,
  };
}

// ─── Shared rules ───────────────────────────────────────────────────────────

/** At least one way to pay is on (and has its details). Kashier is retired and doesn't count. */
export function hasPaymentSetup(store: {
  paymentMethods: string[];
  storePaymentSettings: {
    cashOnDeliveryEnabled: boolean;
    vodafoneCashEnabled: boolean;
    vodafoneCashNumber: string | null;
    instapayEnabled: boolean;
    instapayAddress: string | null;
    bankTransferEnabled: boolean;
    bankTransferDetails: string | null;
    paymobEnabled?: boolean;
  } | null;
}) {
  const p = store.storePaymentSettings;
  return (
    store.paymentMethods.length > 0 ||
    Boolean(p?.cashOnDeliveryEnabled) ||
    Boolean(p?.vodafoneCashEnabled && p.vodafoneCashNumber) ||
    Boolean(p?.instapayEnabled && p.instapayAddress) ||
    Boolean(p?.bankTransferEnabled && p.bankTransferDetails) ||
    Boolean(p?.paymobEnabled)
  );
}

/**
 * The merchant decided what shipping costs: a flat price, shipping methods,
 * or free shipping — which is a flat price of 0, so it only counts once they
 * chose it in onboarding (the wizard always asks).
 */
export function hasShippingSetup(input: { shippingPrice: number; shippingMethods: number; onboardingCompleted: boolean }) {
  return input.shippingPrice > 0 || input.shippingMethods > 0 || input.onboardingCompleted;
}

/** Where the store is in its subscription. `renewalPrice` = what the first/next period costs (piasters). */
export function subscriptionSetup(store: PlanQuoteStore & { autoRenew: boolean }, renewalPrice: number, now = new Date()): SubscriptionSetup {
  if (hasRunningPaidPeriod(store, now)) return { state: "paid" };
  if (isInTrial(store, now) && store.trialEndDate) {
    return { state: "trial", endsAt: store.trialEndDate, covered: store.autoRenew && renewalPrice > 0 && store.balance >= renewalPrice };
  }
  return { state: "inactive" };
}
