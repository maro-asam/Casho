// Prices cart lines that came from an upsell / cross-sell / downsell.
// Used by the cart summary (GetCartItemsAction) and by order creation, so both
// agree on which lines still earn their offer price.

import { offerUnitPrice, validOfferLineIds, type OfferRule } from "./offer-pricing";

/** Prisma `select` for a cart line's offer — everything the pricing rules need. */
export const CART_OFFER_SELECT = {
  id: true,
  type: true,
  isActive: true,
  offerProductId: true,
  triggerProductIds: true,
  discountType: true,
  discountValue: true,
} as const;

type OfferLine = {
  id: string;
  productId: string;
  product: { price: number };
  offer: (OfferRule & { id: string }) | null;
};

export function priceOfferLines<T extends OfferLine>(lines: T[]) {
  const validIds = validOfferLineIds(lines);
  return {
    validIds,
    /** EGP per piece for a valid offer line (callers fall back to their normal price otherwise). */
    unitPrice: (line: T) => (line.offer && validIds.has(line.id) ? offerUnitPrice(line.product.price, line.offer) : line.product.price),
  };
}
