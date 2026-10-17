import type { OrderRiskLevel, OrderSource, OrderStatus } from "@prisma/client";
import { Camera, Globe, Store, type LucideIcon } from "lucide-react";
import type { PillTone } from "@/components/saas-page";
import { PAYMENT_METHODS } from "@/constants/welcome/payment-methods";

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: PillTone }[] = [
  { value: "PENDING", label: "قيد المراجعة", tone: "warning" },
  { value: "PAID", label: "مدفوع", tone: "info" },
  { value: "SHIPPED", label: "تم الشحن", tone: "accent" },
  { value: "DELIVERED", label: "تم التسليم", tone: "success" },
  { value: "CANCELED", label: "ملغي", tone: "neutral" },
];

export const ORDER_STATUS_META = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s])) as Record<
  OrderStatus,
  (typeof ORDER_STATUSES)[number]
>;

/** Number reputation at checkout (lib/fraud). */
export const ORDER_RISK_META: Record<OrderRiskLevel, { label: string; tone: PillTone }> = {
  LOW: { label: "رقم آمن", tone: "success" },
  MEDIUM: { label: "محتاج انتباه", tone: "warning" },
  HIGH: { label: "خطر عالي", tone: "danger" },
};

export const ORDER_CHANNELS: Record<OrderSource, { label: string; icon: LucideIcon }> = {
  ONLINE: { label: "أونلاين", icon: Globe },
  POS: { label: "الكاشير", icon: Store },
  INSTAGRAM: { label: "إنستجرام", icon: Camera },
};

// Arabic names for the common methods; anything else falls back to the catalog label.
const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "الدفع عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  bank_transfer: "تحويل بنكي",
  kashier: "كاشير (أونلاين)",
  cash: "كاش",
  card: "بطاقة",
  instagram: "إنستجرام",
};

export function paymentMethodLabel(method: string) {
  return PAYMENT_LABELS[method] ?? PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method;
}
