/**
 * "Who to call today" — pure rules behind the rep's call list, no DB access
 * (unit-tested in call-list.test.ts). The queries in queries.ts feed it one
 * candidate per attributed customer; it decides whether that customer needs a
 * call now, why, and how urgent it is.
 *
 * Unpaid customers (never paid a subscription) are where the acquisition
 * commission is won: welcome a new signup, catch a trial before it ends, win
 * back a trial that just ended. Paid customers matter while they're still
 * eligible (renewals pay the rep too): a store that closed because the balance
 * didn't cover renewal, or a renewal coming up that the balance won't cover.
 * There is no grace period, so the rep's call is the only one.
 */

// ─── Store activation ───────────────────────────────────────────────────────

export const ACTIVATION_STEPS = ["products", "payment", "shipping", "firstOrder"] as const;
export type ActivationStep = (typeof ACTIVATION_STEPS)[number];

/** `done` / `missing` / `todo` describe the merchant to the rep; `offer` is the rep talking to the merchant. */
export const ACTIVATION_LABELS: Record<ActivationStep, { done: string; missing: string; todo: string; offer: string }> = {
  products: { done: "ضاف منتجات", missing: "مضافش منتجات", todo: "يضيف منتجات", offer: "تضيف منتجاتك" },
  payment: { done: "جهّز طرق الدفع", missing: "مجهّزش الدفع", todo: "يجهّز طرق الدفع", offer: "تجهّز طرق الدفع" },
  shipping: { done: "حدّد الشحن", missing: "محدّدش الشحن", todo: "يحدّد الشحن", offer: "تحدّد أسعار الشحن" },
  firstOrder: { done: "جاله أول طلب", missing: "مجالوش طلبات", todo: "يستقبل أول طلب", offer: "تجيب أول طلب" },
};

export type ActivationInput = {
  /** Products the merchant added (the onboarding demo catalog doesn't count). */
  products: number;
  /** Real orders (demo orders don't count). */
  orders: number;
  hasPayment: boolean;
  hasShipping: boolean;
};

export type Activation = {
  steps: Record<ActivationStep, boolean>;
  done: number;
  /** First step still missing, in setup order; null when the store is fully set up. */
  next: ActivationStep | null;
};

export function activationOf(input: ActivationInput): Activation {
  const steps: Record<ActivationStep, boolean> = {
    products: input.products > 0,
    payment: input.hasPayment,
    shipping: input.hasShipping,
    firstOrder: input.orders > 0,
  };
  return {
    steps,
    done: ACTIVATION_STEPS.filter((s) => steps[s]).length,
    next: ACTIVATION_STEPS.find((s) => !steps[s]) ?? null,
  };
}

/** Same rule as the merchant dashboard's "جهّز طرق الدفع" step. */
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

// ─── Call reasons ───────────────────────────────────────────────────────────

export type CallReason =
  | "TRIAL_ENDING"
  | "STORE_CLOSED"
  | "NEW_SIGNUP"
  | "RENEWAL_AT_RISK"
  | "TRIAL_ENDED"
  | "STALLED"
  | "NO_STORE";

/** Lower = call first. Trials first: that's the acquisition (the biggest commission) about to be won or lost. */
export const CALL_PRIORITY: Record<CallReason, number> = {
  TRIAL_ENDING: 0,
  STORE_CLOSED: 1,
  NEW_SIGNUP: 2,
  RENEWAL_AT_RISK: 3,
  TRIAL_ENDED: 4,
  STALLED: 5,
  NO_STORE: 6,
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A signup this fresh gets a welcome call — the first day is when a merchant decides whether to keep going. */
export const NEW_SIGNUP_WINDOW = DAY;
/** A trial ending this soon needs the "pick a plan and top up" call. */
export const TRIAL_ENDING_WINDOW = 2 * DAY;
/** How long after a trial ended it's still worth a win-back call (older ones stay under "سجّل ولم يدفع"). */
export const TRIAL_ENDED_WINDOW = 30 * DAY;
/** A paid period ending this soon with a balance that won't cover it. */
export const RENEWAL_WINDOW = 7 * DAY;
/** A store closed this long ago drops off the list. */
export const CLOSED_WINDOW = 60 * DAY;

export type CallStore = {
  name: string;
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "GRACE_PERIOD" | "PAST_DUE" | "CANCELED";
  subscriptionEndsAt: Date | null;
  trialEndDate: Date | null;
  balance: number;
  autoRenew: boolean;
  /** Price of the next period (`resolveRenewal`), piasters. */
  renewalPrice: number;
  activation: Activation;
};

export type CallCandidate = {
  signedUpAt: Date;
  /** First subscription payment; null = never paid. */
  acquiredAt: Date | null;
  eligibleUntil: Date | null;
  /** The customer's first store (the one the rep sold); null if they never made one. */
  store: CallStore | null;
};

export type CallVerdict = {
  reason: CallReason;
  /** The moment the reason is about (trial end, renewal date, closing, signup). */
  at: Date;
  /** Renewal only: piasters the balance is short of the next period. */
  shortfall?: number;
  /** Renewal only: auto-renew is off, so the store closes at period end whatever the balance. */
  autoRenewOff?: boolean;
};

function isTrialPeriod(store: CallStore) {
  // While in trial, subscriptionEndsAt is the trial end (see plan-quote's isInTrial).
  return !!store.trialEndDate && !!store.subscriptionEndsAt && store.subscriptionEndsAt.getTime() <= store.trialEndDate.getTime() + 60_000;
}

/** Will the store charge its next period on its own? */
function renewsByItself(store: CallStore) {
  return store.autoRenew && store.renewalPrice > 0 && store.balance >= store.renewalPrice;
}

export function classifyCall(c: CallCandidate, now: Date): CallVerdict | null {
  const t = now.getTime();
  const store = c.store;

  if (c.acquiredAt) {
    // Paid customers: only while the rep still earns on their renewals.
    if (!c.eligibleUntil || c.eligibleUntil.getTime() <= t || !store) return null;
    const endsAt = store.subscriptionEndsAt;

    if (store.subscriptionStatus === "PAST_DUE") {
      const at = endsAt ?? c.acquiredAt;
      return t - at.getTime() <= CLOSED_WINDOW ? { reason: "STORE_CLOSED", at } : null;
    }
    const open = store.subscriptionStatus === "ACTIVE" || store.subscriptionStatus === "GRACE_PERIOD";
    if (open && endsAt && endsAt.getTime() - t <= RENEWAL_WINDOW && !renewsByItself(store)) {
      return {
        reason: "RENEWAL_AT_RISK",
        at: endsAt,
        shortfall: Math.max(0, store.renewalPrice - store.balance),
        autoRenewOff: !store.autoRenew,
      };
    }
    return null;
  }

  // Never paid.
  const sinceSignup = t - c.signedUpAt.getTime();
  if (!store) return sinceSignup <= TRIAL_ENDED_WINDOW ? { reason: "NO_STORE", at: c.signedUpAt } : null;

  const trialEnd = store.trialEndDate;
  const inTrial = store.subscriptionStatus === "ACTIVE" && !!trialEnd && trialEnd.getTime() > t && isTrialPeriod(store);

  if (inTrial && trialEnd) {
    if (sinceSignup <= NEW_SIGNUP_WINDOW) return { reason: "NEW_SIGNUP", at: c.signedUpAt };
    // A balance that covers the first period pays it automatically — nothing to chase.
    if (trialEnd.getTime() - t <= TRIAL_ENDING_WINDOW && !renewsByItself(store)) return { reason: "TRIAL_ENDING", at: trialEnd };
    if (store.activation.next) return { reason: "STALLED", at: trialEnd };
    return null;
  }

  // Trial over (or never started) and nothing paid: the store is closed.
  const endedAt = trialEnd ?? store.subscriptionEndsAt ?? c.signedUpAt;
  if (endedAt.getTime() <= t && t - endedAt.getTime() <= TRIAL_ENDED_WINDOW) return { reason: "TRIAL_ENDED", at: endedAt };
  return null;
}

/**
 * Keeps the candidates that need a call, most urgent first: by reason, then
 * the moment closest to now (a trial ending in 3 hours before one ending
 * tomorrow; a store that closed yesterday before one closed last month).
 */
export function buildCallList<T extends CallCandidate>(candidates: T[], now: Date): (T & { call: CallVerdict })[] {
  const t = now.getTime();
  return candidates
    .flatMap((c) => {
      const call = classifyCall(c, now);
      return call ? [{ ...c, call }] : [];
    })
    .sort(
      (a, b) =>
        CALL_PRIORITY[a.call.reason] - CALL_PRIORITY[b.call.reason] ||
        Math.abs(a.call.at.getTime() - t) - Math.abs(b.call.at.getTime() - t),
    );
}
