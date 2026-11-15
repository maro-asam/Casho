// Pure commerce helpers shared by every theme (no UI).

import type { ProductsQuery } from "@/lib/products-query";
import type { WholesaleTier } from "../types";
import { st } from "@/lib/i18n/storefront";

export function discountPercent(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Wholesale tier that applies to a quantity, if any. */
export function tierFor(tiers: WholesaleTier[] | null, qty: number) {
  if (!tiers?.length) return null;
  return [...tiers].reverse().find((t) => qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty)) ?? null;
}

/** Unit price after wholesale tiers (cart rows carry tiers as raw JSON). */
export function unitPriceFor(price: number, tiers: unknown, qty: number) {
  return tierFor(tiers as WholesaleTier[] | null, qty)?.price ?? price;
}

/** Labels for the selected product options stored on cart items. */
export const FEATURE_LABEL: Record<string, string> = { get size() { return st("المقاس"); }, get color() { return st("اللون"); } };

export const SORT_OPTIONS: { value: ProductsQuery["sort"]; label: string }[] = [
  { value: "newest", get label() { return st("الأحدث"); } },
  { value: "price-asc", get label() { return st("السعر: من الأقل"); } },
  { value: "price-desc", get label() { return st("السعر: من الأعلى"); } },
  { value: "name-asc", get label() { return st("الاسم: أ – ي"); } },
  { value: "name-desc", get label() { return st("الاسم: ي – أ"); } },
  { value: "oldest", get label() { return st("الأقدم"); } },
];
