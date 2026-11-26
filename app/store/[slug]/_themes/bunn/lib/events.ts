"use client";

// Theme-wide UI events: any card can open the quick view or the search without
// prop-drilling. Their hosts are mounted once by the header.

export const QUICK_VIEW_EVENT = "bunn:quick-view";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export const SEARCH_EVENT = "bunn:search";

export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

export const recentKey = (storeSlug: string) => `bunn:recent:${storeSlug}`;
export const searchesKey = (storeSlug: string) => `bunn:searches:${storeSlug}`;
