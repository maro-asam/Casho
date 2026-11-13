import { SalesCommissionStatus, SubscriptionStatus } from "@prisma/client";
import type { PillTone } from "@/components/saas-page";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { intlLocale } from "@/lib/i18n/dashboard/runtime";
import { SALES_TIMEZONE, cairoMonthStart } from "./rules";

export { formatMoneyFromPiasters as fmtMoney } from "@/lib/subscriptions";

/** Piasters with an explicit sign ("+٥٠ ج.م." / "-٥٠ ج.م."), bidi-safe. */
export function fmtSignedMoney(piasters: number) {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(piasters / 100);
}

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

const monthNameFmt = new Intl.DateTimeFormat("ar-EG", { month: "long", timeZone: SALES_TIMEZONE });
const dayMonthFmt = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", timeZone: SALES_TIMEZONE });

/** "٨ ديسمبر" (Cairo). */
export const fmtDayMonth = (d: Date) => dayMonthFmt.format(d);

/** Whole pounds from piasters, no decimals: 100000 → "١٬٠٠٠ ج.م". */
export const fmtPounds = (piasters: number) => `${numFmt.format(Math.round(piasters / 100))} ج.م`;
const relativeFmt = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

/** "2026-10" → "أكتوبر" (chart axis labels). */
export function fmtMonthName(month: string) {
  const [y, m] = month.split("-").map(Number);
  return monthNameFmt.format(new Date(cairoMonthStart(y, m).getTime() + 12 * 3_600_000));
}

/** Whole days from now: "اليوم", "غدًا", "بعد ٣ أيام", "منذ يومين". */
export function fmtRelativeDays(date: Date, now = new Date()) {
  return relativeFmt.format(Math.round((date.getTime() - now.getTime()) / 86_400_000), "day");
}

/** wa.me chat with a prefilled message; Egyptian 01… numbers get the country code. */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(text)}`;
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

export const KIND_LABELS = { ACQUISITION: "اكتساب عميل", RENEWAL: "تجديد", BONUS: "بونص" } as const;

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
