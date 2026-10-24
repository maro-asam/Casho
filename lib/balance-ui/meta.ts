import type { BalanceTransactionType, TopupMethod, TopupRequestStatus } from "@prisma/client";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export const TX_TYPES: { value: BalanceTransactionType; label: string; tone: "success" | "danger" | "accent" | "warning" | "neutral" | "info" }[] = [
  { value: "TOPUP", get label() { return tr("شحن"); }, tone: "success" },
  { value: "SUBSCRIPTION_CHARGE", get label() { return tr("خصم اشتراك"); }, tone: "danger" },
  { value: "BONUS", get label() { return tr("رصيد هدية"); }, tone: "accent" },
  { value: "REFERRAL_REWARD", get label() { return tr("مكافأة دعوة"); }, tone: "accent" },
  { value: "REFUND", get label() { return tr("استرجاع"); }, tone: "warning" },
  { value: "MANUAL_ADJUSTMENT", get label() { return tr("تعديل"); }, tone: "neutral" },
];

export const txMeta = (t: BalanceTransactionType) => TX_TYPES.find((x) => x.value === t) ?? { value: t, label: t, tone: "neutral" as const };

export const METHOD_LABELS: Record<TopupMethod, string> = {
  get VODAFONE_CASH() { return tr("فودافون كاش"); },
  get INSTAPAY() { return tr("إنستاباي"); },
  get BANK_TRANSFER() { return tr("تحويل بنكي"); },
  get KASHIER() { return tr("دفع أونلاين"); },
  get PAYMOB() { return tr("كارت أو محفظة (Paymob)"); },
};

export const TOPUP_STATUS: Record<TopupRequestStatus, { label: string; tone: "warning" | "success" | "danger" }> = {
  PENDING: { get label() { return tr("قيد المراجعة"); }, tone: "warning" },
  APPROVED: { get label() { return tr("اتضاف"); }, tone: "success" },
  REJECTED: { get label() { return tr("مرفوض"); }, tone: "danger" },
};

const egp = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
/** Piasters → "١٢٣٫٤٥ ج.م.‏" */
export const formatMoney = (piasters: number) => egp.format(piasters / 100);
export const formatSigned = (piasters: number) => `${piasters > 0 ? "+" : piasters < 0 ? "−" : ""}${egp.format(Math.abs(piasters) / 100)}`;

export const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  ACTIVE: { get label() { return tr("نشط"); }, tone: "success" },
  GRACE_PERIOD: { get label() { return tr("فترة سماح"); }, tone: "warning" },
  PAST_DUE: { get label() { return tr("متوقف"); }, tone: "danger" },
  CANCELED: { get label() { return tr("ملغي"); }, tone: "neutral" },
  INACTIVE: { get label() { return tr("غير مفعّل"); }, tone: "neutral" },
};
