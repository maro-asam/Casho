import type { BalanceTransactionType, TopupMethod, TopupRequestStatus } from "@prisma/client";

export const TX_TYPES: { value: BalanceTransactionType; label: string; tone: "success" | "danger" | "accent" | "warning" | "neutral" | "info" }[] = [
  { value: "TOPUP", label: "شحن", tone: "success" },
  { value: "SUBSCRIPTION_CHARGE", label: "خصم اشتراك", tone: "danger" },
  { value: "BONUS", label: "رصيد هدية", tone: "accent" },
  { value: "REFERRAL_REWARD", label: "مكافأة دعوة", tone: "accent" },
  { value: "REFUND", label: "استرجاع", tone: "warning" },
  { value: "MANUAL_ADJUSTMENT", label: "تعديل", tone: "neutral" },
];

export const txMeta = (t: BalanceTransactionType) => TX_TYPES.find((x) => x.value === t) ?? { value: t, label: t, tone: "neutral" as const };

export const METHOD_LABELS: Record<TopupMethod, string> = {
  VODAFONE_CASH: "فودافون كاش",
  INSTAPAY: "إنستاباي",
  BANK_TRANSFER: "تحويل بنكي",
  KASHIER: "دفع أونلاين",
};

export const TOPUP_STATUS: Record<TopupRequestStatus, { label: string; tone: "warning" | "success" | "danger" }> = {
  PENDING: { label: "قيد المراجعة", tone: "warning" },
  APPROVED: { label: "اتضاف", tone: "success" },
  REJECTED: { label: "مرفوض", tone: "danger" },
};

const egp = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
/** Piasters → "١٢٣٫٤٥ ج.م.‏" */
export const formatMoney = (piasters: number) => egp.format(piasters / 100);
export const formatSigned = (piasters: number) => `${piasters > 0 ? "+" : piasters < 0 ? "−" : ""}${egp.format(Math.abs(piasters) / 100)}`;

export const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  ACTIVE: { label: "نشط", tone: "success" },
  GRACE_PERIOD: { label: "فترة سماح", tone: "warning" },
  PAST_DUE: { label: "متوقف", tone: "danger" },
  CANCELED: { label: "ملغي", tone: "neutral" },
  INACTIVE: { label: "غير مفعّل", tone: "neutral" },
};
