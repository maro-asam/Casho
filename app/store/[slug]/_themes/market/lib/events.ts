"use client";

// Theme-wide UI events: any card can open the quick view without
// prop-drilling. The host is mounted once by the header.

export const QUICK_VIEW_EVENT = "market:quick-view";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export const SEARCH_EVENT = "market:search";

/** Opens the store's search from anywhere (mounted once by the header). */
export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

export const recentKey = (storeSlug: string) => `market:recent:${storeSlug}`;
export const listKey = (storeSlug: string) => `market:list:${storeSlug}`;
export const searchesKey = (storeSlug: string) => `market:searches:${storeSlug}`;
