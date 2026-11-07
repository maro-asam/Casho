/**
 * Pure rules for time-boxed sales campaigns (the launch offer for the first
 * reps) — no DB access, unit-tested in campaign.test.ts.
 *
 * Inside [startsAt, endsAt) a member's acquisition commissions (a new
 * customer's first payment) use the higher of the normal tier rate and the
 * campaign rate, where the campaign rate is the best that applies to the paying
 * store: POS plan > pharmacy > base. Renewals keep the normal renewal rate. A
 * member gets one fixed bonus once `bonusTarget` customers make their first
 * payment inside the window.
 */

import { SALES_TIMEZONE, cairoDayStart } from "./rules";

/** The plan that includes the POS (cashier) feature. */
export const POS_PLAN_KEY = "PLATINUM";

/** The business type a pharmacy picks at signup. */
export const PHARMACY_BUSINESS_TYPE = "صيدلية";

export type CampaignReason = "BASE" | "PHARMACY" | "POS";

export type CampaignTerms = {
  baseRateBps: number;
  pharmacyRateBps: number;
  posRateBps: number;
};

export type CampaignWindow = { startsAt: Date; endsAt: Date };

export const CAMPAIGN_REASON_LABELS: Record<CampaignReason | "BONUS", string> = {
  BASE: "عرض الإطلاق",
  PHARMACY: "عرض الإطلاق · صيدلية",
  POS: "عرض الإطلاق · كاشير",
  BONUS: "بونص عرض الإطلاق",
};

/** True for the signup business type of a pharmacy (Arabic or English, any spelling of صيدلية/صيدليات). */
export function isPharmacyBusiness(...values: (string | null | undefined)[]): boolean {
  return values.some((v) => {
    const t = (v ?? "").trim().toLowerCase();
    return t.includes("صيدل") || t.includes("pharma");
  });
}

export function isWithinCampaign(window: CampaignWindow, at: Date): boolean {
  return at.getTime() >= window.startsAt.getTime() && at.getTime() < window.endsAt.getTime();
}

/** The campaign rate for one payment: the best one that applies (ties go to the more specific reason). */
export function campaignRateFor(
  terms: CampaignTerms,
  store: { planKey: string | null | undefined; pharmacy: boolean },
): { rateBps: number; reason: CampaignReason } {
  const candidates: { rateBps: number; reason: CampaignReason }[] = [{ rateBps: terms.baseRateBps, reason: "BASE" }];
  if (store.pharmacy) candidates.push({ rateBps: terms.pharmacyRateBps, reason: "PHARMACY" });
  if (store.planKey === POS_PLAN_KEY) candidates.push({ rateBps: terms.posRateBps, reason: "POS" });
  return candidates.reduce((best, c) => (c.rateBps >= best.rateBps ? c : best));
}

/**
 * The rate a member actually earns: the campaign's only when it beats the
 * normal one — a campaign never lowers a commission. `reason` is null when the
 * normal rate stands.
 */
export function applyCampaignRate(
  normalRateBps: number,
  campaign: { rateBps: number; reason: CampaignReason },
): { rateBps: number; reason: CampaignReason | null } {
  return campaign.rateBps > normalRateBps ? campaign : { rateBps: normalRateBps, reason: null };
}

/** The bonus is due once, when the count of new paying customers inside the window reaches the target. */
export function bonusDue(input: { acquiredInWindow: number; target: number; alreadyAwarded: boolean }): boolean {
  return !input.alreadyAwarded && input.target > 0 && input.acquiredInWindow >= input.target;
}

/** Whole days left until `endsAt`, counting today; 0 once it's over. */
export function campaignDaysLeft(window: CampaignWindow, now = new Date()): number {
  const ms = window.endsAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

// ─── Calendar days (admin form) ─────────────────────────────────────────────

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SALES_TIMEZONE });

/**
 * "2026-11-08" .. "2026-12-08" (both days included, Cairo) → [startsAt, endsAt).
 * Null when a day is malformed or the last day is before the first.
 */
export function campaignWindowFromDays(firstDay: string, lastDay: string): CampaignWindow | null {
  const a = DAY_RE.exec(firstDay);
  const b = DAY_RE.exec(lastDay);
  if (!a || !b) return null;
  const startsAt = cairoDayStart(Number(a[1]), Number(a[2]), Number(a[3]));
  const endsAt = cairoDayStart(Number(b[1]), Number(b[2]), Number(b[3]) + 1);
  return endsAt.getTime() > startsAt.getTime() ? { startsAt, endsAt } : null;
}

/** The inverse, for form defaults: the window's first and last Cairo days as "YYYY-MM-DD". */
export function campaignDaysFromWindow(window: CampaignWindow): { firstDay: string; lastDay: string } {
  return { firstDay: dayKey.format(window.startsAt), lastDay: dayKey.format(new Date(window.endsAt.getTime() - 1)) };
}
