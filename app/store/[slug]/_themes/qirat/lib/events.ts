"use client";

// Theme-wide UI events: any card can open the quick view, the search or the
// wishlist without prop-drilling. Their hosts are mounted once by the header.

export const QUICK_VIEW_EVENT = "qirat:quick-view";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export const SEARCH_EVENT = "qirat:search";

export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

export const WISHLIST_EVENT = "qirat:wishlist";

export function openWishlist() {
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export const recentKey = (storeSlug: string) => `qirat:recent:${storeSlug}`;
export const wishKey = (storeSlug: string) => `qirat:wish:${storeSlug}`;
export const searchesKey = (storeSlug: string) => `qirat:searches:${storeSlug}`;
