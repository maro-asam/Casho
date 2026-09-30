import type { OrderSource } from "@prisma/client";
import { Camera, Globe, Store, type LucideIcon } from "lucide-react";

const moneyFormat = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const numberFormat = new Intl.NumberFormat("ar-EG");
const percentFormat = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 });

/** Whole-pound display for dashboard figures (amounts are piasters). */
export const formatMoney = (piasters: number) => moneyFormat.format(piasters / 100);
export const formatNumber = (value: number) => numberFormat.format(value);
export const formatPercent = (value: number) => `${percentFormat.format(value)}٪`;

/** Percentage change, or null when there is no baseline to compare against. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export const CHANNELS: Record<OrderSource, { label: string; icon: LucideIcon }> = {
  ONLINE: { label: "المتجر الأونلاين", icon: Globe },
  POS: { label: "الكاشير (POS)", icon: Store },
  INSTAGRAM: { label: "إنستجرام", icon: Camera },
};
