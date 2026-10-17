// Lets any add-to-cart button refresh the header cart badge without a reload.

export const CART_UPDATED_EVENT = "casho:cart-updated";

/** What was just added (from AddToCartAction's `added`) — feeds the ad pixels' AddToCart. */
export type CartAddedDetail = {
  eventId: string;
  productId: string;
  name: string;
  /** EGP per piece. */
  price: number;
  quantity: number;
};

/** Pass the action's `added` after a successful add; omit it for quantity changes/removals. */
export function notifyCartUpdated(added?: CartAddedDetail) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: added }));
}

// Lets any add-to-cart button ask the theme to reveal its cart (e.g. a drawer).
export const CART_OPEN_EVENT = "casho:cart-open";

export function openCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_OPEN_EVENT));
}
