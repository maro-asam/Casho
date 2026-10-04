// Lets any add-to-cart button refresh the header cart badge without a reload.

export const CART_UPDATED_EVENT = "casho:cart-updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

// Lets any add-to-cart button ask the theme to reveal its cart (e.g. a drawer).
export const CART_OPEN_EVENT = "casho:cart-open";

export function openCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_OPEN_EVENT));
}
