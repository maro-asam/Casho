"use client";

// Theme-wide UI events: any card can open the quick view without
// prop-drilling. The host is mounted once by the header.

export const QUICK_VIEW_EVENT = "medical:quick-view";

export function openQuickView(productSlug: string) {
  window.dispatchEvent(new CustomEvent(QUICK_VIEW_EVENT, { detail: productSlug }));
}

export const recentKey = (storeSlug: string) => `medical:recent:${storeSlug}`;
export const searchesKey = (storeSlug: string) => `medical:searches:${storeSlug}`;
