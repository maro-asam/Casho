"use client";

// Theme-wide UI events: any card can open the quick view or the wishlist
// without prop-drilling. Hosts are mounted once by the header.

export const QUICK_VIEW_EVENT = "mada:quick-view";
export const WISHLIST_OPEN_EVENT = "mada:wishlist-open";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export function openWishlist() {
  window.dispatchEvent(new Event(WISHLIST_OPEN_EVENT));
}
