// Lets any add-to-cart button refresh the header cart badge without a reload.

export const CART_UPDATED_EVENT = "casho:cart-updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
