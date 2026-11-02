"use client";

// Theme-wide UI events: any card can open the quick view without
// prop-drilling. The host is mounted once by the header.

export const QUICK_VIEW_EVENT = "stage:quick-view";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export const SEARCH_EVENT = "stage:search";

/** Opens the store's search from anywhere (mounted once by the header). */
export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

export const recentKey = (storeSlug: string) => `stage:recent:${storeSlug}`;
export const listKey = (storeSlug: string) => `stage:list:${storeSlug}`;
export const searchesKey = (storeSlug: string) => `stage:searches:${storeSlug}`;
