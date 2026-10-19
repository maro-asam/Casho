import { intlLocale, tr } from "@/lib/i18n/dashboard";
// Pure rules for upsell / cross-sell / downsell offers (no DB, no UI).
// The cart summary and order creation both price offer lines through these,
// so what the shopper sees is exactly what the order charges.

export type OfferType = "UPSELL" | "CROSS_SELL" | "DOWNSELL";
export type OfferDiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export type OfferDiscount = { discountType: OfferDiscountType; discountValue: number };

export type OfferRule = OfferDiscount & {
  type: OfferType;
  isActive: boolean;
  offerProductId: string;
  /** Empty = any product triggers it. */
  triggerProductIds: string[];
};

export const OFFER_TYPES: { value: OfferType; label: string; hint: string }[] = [
  { value: "UPSELL", label: "Upsell", get hint() { return tr("ترقية لمنتج أغلى بدل اللي اختاره"); } },
  { value: "CROSS_SELL", label: "Cross-sell", get hint() { return tr("منتج مكمّل يتضاف جنبه"); } },
  { value: "DOWNSELL", label: "Downsell", get hint() { return tr("بديل أرخص لو رفض الترقية"); } },
];

export function isOfferType(v: unknown): v is OfferType {
  return v === "UPSELL" || v === "CROSS_SELL" || v === "DOWNSELL";
}

export function defaultHeadline(type: OfferType) {
  if (type === "UPSELL") return tr("طوّر اختيارك بفرق بسيط");
  if (type === "DOWNSELL") return tr("استنى! عندنا عرض أوفر ليك");
  return tr("ناس كتير بتشتريهم مع بعض");
}

/** EGP per piece after the offer discount — rounded to piasters, never below zero. */
export function offerUnitPrice(price: number, offer: OfferDiscount) {
  const value = Number.isFinite(offer.discountValue) ? Math.max(0, offer.discountValue) : 0;
  let unit = price;
  if (offer.discountType === "PERCENTAGE") unit = price * (1 - Math.min(100, value) / 100);
  else if (offer.discountType === "FIXED") unit = price - value;
  return Math.max(0, Math.round(unit * 100) / 100);
}

/** Human label for the discount: "خصم ١٥٪", "خصم ٥٠ ج.م", or null. */
export function offerDiscountLabel(offer: OfferDiscount) {
  if (offer.discountType === "NONE" || !(offer.discountValue > 0)) return null;
  const nf = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 2 });
  return offer.discountType === "PERCENTAGE" ? tr("خصم {0}٪", nf.format(offer.discountValue)) : tr("خصم {0} ج.م", nf.format(offer.discountValue));
}

/** Does `productId` trigger this offer? (never offers a product for itself) */
export function offerMatches(offer: Pick<OfferRule, "offerProductId" | "triggerProductIds">, productId: string) {
  if (offer.offerProductId === productId) return false;
  return offer.triggerProductIds.length === 0 || offer.triggerProductIds.includes(productId);
}

/** Highest priority first; on a tie, an offer aimed at specific products beats an "any product" one. */
export function rankOffers<T extends { priority: number; triggerProductIds: string[] }>(offers: T[]) {
  return [...offers].sort(
    (a, b) => b.priority - a.priority || Number(a.triggerProductIds.length === 0) - Number(b.triggerProductIds.length === 0),
  );
}

type Line = { id: string; productId: string; offer: OfferRule | null };

/**
 * Lines that still earn their offer price. An offer stays valid while it is
 * active, still sells this product, and — for cross-sells and downsells — a
 * product that triggers it is still in the cart (so "add the shirt, take the
 * discounted belt, remove the shirt" doesn't keep the discount). An upsell
 * replaced its trigger, so it only needs to be active.
 */
export function validOfferLineIds(lines: Line[]) {
  // Anchors: lines the shopper chose themselves (or upgraded into).
  const anchors = lines.filter((l) => !l.offer || l.offer.type === "UPSELL");
  const valid = new Set<string>();

  for (const line of lines) {
    const offer = line.offer;
    if (!offer || !offer.isActive || offer.offerProductId !== line.productId) continue;
    if (offer.type === "UPSELL") {
      valid.add(line.id);
      continue;
    }
    const triggered = anchors.some(
      (a) => a.id !== line.id && a.productId !== line.productId && (offer.triggerProductIds.length === 0 || offer.triggerProductIds.includes(a.productId)),
    );
    if (triggered) valid.add(line.id);
  }
  return valid;
}

/** Accept rate in percent (0 when never shown). */
export function acceptRate(views: number, accepts: number) {
  return views > 0 ? Math.min(100, Math.round((accepts / views) * 1000) / 10) : 0;
}
