import type { OrderRiskLevel, OrderSource, OrderStatus } from "@prisma/client";
import { Camera, Globe, Store, type LucideIcon } from "lucide-react";
import type { PillTone } from "@/components/saas-page";
import { PAYMENT_METHODS } from "@/constants/welcome/payment-methods";
import { tr } from "@/lib/i18n/dashboard";

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: PillTone }[] = [
  { value: "PENDING", get label() { return tr("قيد المراجعة"); }, tone: "warning" },
  { value: "PAID", get label() { return tr("مدفوع"); }, tone: "info" },
  { value: "SHIPPED", get label() { return tr("تم الشحن"); }, tone: "accent" },
  { value: "DELIVERED", get label() { return tr("تم التسليم"); }, tone: "success" },
  { value: "CANCELED", get label() { return tr("ملغي"); }, tone: "neutral" },
];

// i18n-ignore: keeps the same objects, so their translated getters survive.
export const ORDER_STATUS_META = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s])) as Record<
  OrderStatus,
  (typeof ORDER_STATUSES)[number]
>;

/** Number reputation at checkout (lib/fraud). */
export const ORDER_RISK_META: Record<OrderRiskLevel, { label: string; tone: PillTone }> = {
  LOW: { get label() { return tr("رقم آمن"); }, tone: "success" },
  MEDIUM: { get label() { return tr("محتاج انتباه"); }, tone: "warning" },
  HIGH: { get label() { return tr("خطر عالي"); }, tone: "danger" },
};

export const ORDER_CHANNELS: Record<OrderSource, { label: string; icon: LucideIcon }> = {
  ONLINE: { get label() { return tr("أونلاين"); }, icon: Globe },
  POS: { get label() { return tr("الكاشير"); }, icon: Store },
  INSTAGRAM: { get label() { return tr("إنستجرام"); }, icon: Camera },
};

// Arabic names for the common methods; anything else falls back to the catalog label.
const PAYMENT_LABELS: Record<string, string> = {
  get cash_on_delivery() { return tr("الدفع عند الاستلام"); },
  get vodafone_cash() { return tr("فودافون كاش"); },
  get instapay() { return tr("إنستاباي"); },
  get bank_transfer() { return tr("تحويل بنكي"); },
  get kashier() { return tr("كاشير (أونلاين)"); },
  get cash() { return tr("كاش"); },
  get card() { return tr("بطاقة"); },
  get instagram() { return tr("إنستجرام"); },
};

export function paymentMethodLabel(method: string) {
  return PAYMENT_LABELS[method] ?? PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method;
}
