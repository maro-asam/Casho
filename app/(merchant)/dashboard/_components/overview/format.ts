import type { OrderSource } from "@prisma/client";
import { Camera, Globe, Store, type LucideIcon } from "lucide-react";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const moneyFormat = lazyIntl.number({
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const numberFormat = lazyIntl.number();
const percentFormat = lazyIntl.number({ maximumFractionDigits: 1 });

/** Whole-pound display for dashboard figures (amounts are piasters). */
export const formatMoney = (piasters: number) => moneyFormat.format(piasters / 100);
export const formatNumber = (value: number) => numberFormat.format(value);
export const formatPercent = (value: number) => tr("{0}٪", percentFormat.format(value));

/** Percentage change, or null when there is no baseline to compare against. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export const CHANNELS: Record<OrderSource, { label: string; icon: LucideIcon }> = {
  ONLINE: { get label() { return tr("المتجر الأونلاين"); }, icon: Globe },
  POS: { get label() { return tr("الكاشير (POS)"); }, icon: Store },
  INSTAGRAM: { get label() { return tr("إنستجرام"); }, icon: Camera },
};
