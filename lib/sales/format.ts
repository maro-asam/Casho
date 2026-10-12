import { SalesCommissionStatus, SubscriptionStatus } from "@prisma/client";
import type { PillTone } from "@/components/saas-page";
import { SALES_TIMEZONE, cairoMonthStart } from "./rules";

export { formatMoneyFromPiasters as fmtMoney } from "@/lib/subscriptions";

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: SALES_TIMEZONE });
const dateTimeFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: SALES_TIMEZONE });
const monthFmt = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: SALES_TIMEZONE });
const numFmt = new Intl.NumberFormat("ar-EG");
const pctFmt = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 1 });

export const fmtDate = (d: Date | null | undefined) => (d ? dateFmt.format(d) : "—");
export const fmtDateTime = (d: Date | null | undefined) => (d ? dateTimeFmt.format(d) : "—");
export const fmtNum = (n: number) => numFmt.format(n);
export const fmtPct = (ratio: number) => pctFmt.format(ratio);

/** "2026-10" → "أكتوبر ٢٠٢٦" */
export function fmtCohort(cohortMonth: string | null | undefined) {
  if (!cohortMonth) return "—";
  const [y, m] = cohortMonth.split("-").map(Number);
  return monthFmt.format(new Date(cairoMonthStart(y, m).getTime() + 12 * 3_600_000));
}

/** Last day the customer is still eligible (eligibleUntil is exclusive). */
export function fmtEligibleThrough(eligibleUntil: Date | null | undefined) {
  return eligibleUntil ? fmtDate(new Date(eligibleUntil.getTime() - 1)) : "—";
}

export const COMMISSION_STATUS_META: Record<SalesCommissionStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "قيد المراجعة", tone: "warning" },
  APPROVED: { label: "معتمدة — مستحقة", tone: "info" },
  ON_HOLD: { label: "معلّقة", tone: "accent" },
  REJECTED: { label: "مرفوضة", tone: "danger" },
  REVERSED: { label: "ملغاة", tone: "neutral" },
  PAID: { label: "مدفوعة", tone: "success" },
};

export const KIND_LABELS = { ACQUISITION: "اكتساب عميل", RENEWAL: "تجديد" } as const;

export const SUBSCRIPTION_META: Record<SubscriptionStatus, { label: string; tone: PillTone }> = {
  ACTIVE: { label: "نشط", tone: "success" },
  GRACE_PERIOD: { label: "فترة سماح", tone: "warning" },
  PAST_DUE: { label: "متأخر", tone: "danger" },
  CANCELED: { label: "ملغي", tone: "neutral" },
  INACTIVE: { label: "غير مفعل", tone: "neutral" },
};

export type EligibilityState = "signup" | "eligible" | "expired";

export function eligibilityState(a: { acquiredAt: Date | null; eligibleUntil: Date | null }, now = new Date()): EligibilityState {
  if (!a.acquiredAt || !a.eligibleUntil) return "signup";
  return a.eligibleUntil.getTime() > now.getTime() ? "eligible" : "expired";
}

export const ELIGIBILITY_META: Record<EligibilityState, { label: string; tone: PillTone }> = {
  signup: { label: "تسجيل — لم يدفع بعد", tone: "neutral" },
  eligible: { label: "مؤهل حاليًا", tone: "success" },
  expired: { label: "انتهت الأهلية", tone: "warning" },
};
