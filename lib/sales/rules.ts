/**
 * Pure sales-commission rules — no DB access, so every rule here is unit-tested
 * (rules.test.ts). The DB engine (lib/sales/engine.ts) feeds it ledger rows.
 *
 * Approved policy (see docs/sales/commissions.md):
 * - Basis: the full SUBSCRIPTION_CHARGE amount, integer piasters (EGP only).
 * - Acquisition = the customer's first-ever subscription charge. Marginal tiers
 *   by position in the rep's *currently eligible* sequence: 1–10 → 17%,
 *   11–20 → 20%, 21+ → 22%. Position = eligible count at payment time + 1.
 * - Renewal = every later subscription charge (incl. upgrade proration) paid
 *   before the customer's eligibleUntil → 6%.
 * - Eligibility: calendar-month cohort in Africa/Cairo. Acquired any day of
 *   month M → eligible until the first instant of month M+6 (exclusive).
 * - Downgrade REFUND credits claw back refund × the funding commission's rate.
 */

export const SALES_TIMEZONE = "Africa/Cairo";
export const SALES_CURRENCY = "EGP";

export type SalesTier = "STARTER" | "GROWTH" | "PRO";

export type CommissionRuleSet = {
  id: string;
  starterRateBps: number;
  growthRateBps: number;
  proRateBps: number;
  starterMaxPosition: number;
  growthMaxPosition: number;
  renewalRateBps: number;
  eligibilityMonths: number;
};

export const TIER_LABELS: Record<SalesTier, string> = {
  STARTER: "المستوى 1 — Starter",
  GROWTH: "المستوى 2 — Growth",
  PRO: "المستوى 3 — Pro",
};

export function tierForPosition(position: number, rule: CommissionRuleSet): { tier: SalesTier; rateBps: number } {
  if (!Number.isInteger(position) || position < 1) throw new Error("Invalid customer position");
  if (position <= rule.starterMaxPosition) return { tier: "STARTER", rateBps: rule.starterRateBps };
  if (position <= rule.growthMaxPosition) return { tier: "GROWTH", rateBps: rule.growthRateBps };
  return { tier: "PRO", rateBps: rule.proRateBps };
}

/** The level a rep is in with `eligibleCount` currently eligible customers (0 counts as Starter). */
export function levelForEligibleCount(eligibleCount: number, rule: CommissionRuleSet): SalesTier {
  return tierForPosition(Math.max(1, eligibleCount), rule).tier;
}

/** How many of the eligible customers sit in each tier (marginal allocation). */
export function allocateTiers(eligibleCount: number, rule: CommissionRuleSet): Record<SalesTier, number> {
  const n = Math.max(0, Math.floor(eligibleCount));
  const starter = Math.min(n, rule.starterMaxPosition);
  const growth = Math.min(Math.max(n - rule.starterMaxPosition, 0), rule.growthMaxPosition - rule.starterMaxPosition);
  const pro = Math.max(n - rule.growthMaxPosition, 0);
  return { STARTER: starter, GROWTH: growth, PRO: pro };
}

/** basis × rate, in integer piasters, rounded half-up. Basis must be a non-negative integer. */
export function commissionAmount(basisPiasters: number, rateBps: number): number {
  if (!Number.isSafeInteger(basisPiasters) || basisPiasters < 0) throw new Error("Invalid commission basis");
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) throw new Error("Invalid commission rate");
  return Math.floor((basisPiasters * rateBps + 5_000) / 10_000);
}

export function formatRateBps(rateBps: number): string {
  return `${(rateBps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

// ─── Calendar months in Africa/Cairo ────────────────────────────────────────

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SALES_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

function cairoParts(date: Date) {
  const get = (type: string) => Number(partsFormatter.formatToParts(date).find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Cairo wall-clock offset (ms) at an instant — handles Egypt's DST. */
function cairoOffsetMs(date: Date): number {
  const p = cairoParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant of 00:00 on the 1st of (year, month1) in Cairo. month1 may overflow (13 → next January). */
export function cairoMonthStart(year: number, month1: number): Date {
  const wall = Date.UTC(year, month1 - 1, 1, 0, 0, 0);
  let guess = wall - 2 * 3_600_000;
  for (let i = 0; i < 3; i++) guess = wall - cairoOffsetMs(new Date(guess));
  return new Date(guess);
}

/** "YYYY-MM" of the instant in Cairo. */
export function cohortMonthOf(date: Date): string {
  const p = cairoParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

/** First instant of the month `months` after the cohort month — eligibility ends here (exclusive). */
export function eligibleUntilFor(acquiredAt: Date, months: number): Date {
  const p = cairoParts(acquiredAt);
  return cairoMonthStart(p.year, p.month + months);
}

export function isWithinEligibility(at: Date, eligibleUntil: Date | null): boolean {
  return !!eligibleUntil && at.getTime() < eligibleUntil.getTime();
}

// ─── Charge classification ─────────────────────────────────────────────────

export type ChargeDecision =
  | { kind: "ACQUISITION"; basisAmount: number; rateBps: number; amount: number; tier: SalesTier; customerPosition: number }
  | { kind: "RENEWAL"; basisAmount: number; rateBps: number; amount: number }
  | { kind: "NONE"; reason: "not_a_charge" | "outside_window" | "zero_amount" };

/**
 * Decides the commission for one SUBSCRIPTION_CHARGE ledger row.
 * `chargeLedgerAmount` is the signed ledger amount (charges are negative).
 * `eligibleCountBefore` = the rep's eligible customers at the payment instant,
 * excluding this customer.
 */
export function decideChargeCommission(input: {
  isFirstCharge: boolean;
  chargeLedgerAmount: number;
  chargeAt: Date;
  eligibleUntil: Date;
  eligibleCountBefore: number;
  rule: CommissionRuleSet;
}): ChargeDecision {
  if (input.chargeLedgerAmount === 0) return { kind: "NONE", reason: "zero_amount" };
  if (input.chargeLedgerAmount > 0) return { kind: "NONE", reason: "not_a_charge" };
  const basisAmount = -input.chargeLedgerAmount;

  if (input.isFirstCharge) {
    const customerPosition = input.eligibleCountBefore + 1;
    const { tier, rateBps } = tierForPosition(customerPosition, input.rule);
    return { kind: "ACQUISITION", basisAmount, rateBps, amount: commissionAmount(basisAmount, rateBps), tier, customerPosition };
  }

  if (!isWithinEligibility(input.chargeAt, input.eligibleUntil)) return { kind: "NONE", reason: "outside_window" };

  const rateBps = input.rule.renewalRateBps;
  return { kind: "RENEWAL", basisAmount, rateBps, amount: commissionAmount(basisAmount, rateBps) };
}

/**
 * Clawback for a downgrade REFUND credit: refund × the funding commission's
 * rate, capped so the commission's net never goes below zero.
 */
export function refundClawback(input: { refundAmount: number; commissionRateBps: number; commissionNet: number }): number {
  if (input.refundAmount <= 0 || input.commissionNet <= 0) return 0;
  return Math.min(commissionAmount(input.refundAmount, input.commissionRateBps), input.commissionNet);
}

/** Which rep owned the customer at `at`, replaying the attribution history. null = not attributed yet. */
export function salesRepAt(
  at: Date,
  attribution: { originalSalesRepId: string; createdAt: Date; changes: { toSalesRepId: string; createdAt: Date }[] },
): string | null {
  if (at.getTime() < attribution.createdAt.getTime()) return null;
  let rep = attribution.originalSalesRepId;
  for (const change of [...attribution.changes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (change.createdAt.getTime() <= at.getTime()) rep = change.toSalesRepId;
  }
  return rep;
}

const REFERRAL_CODE_RE = /^[A-Z0-9]{4,32}$/;

/** Normalises a ?ref= value; returns null for anything that can't be a code (never hits the DB). */
export function normalizeReferralCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return REFERRAL_CODE_RE.test(code) ? code : null;
}
