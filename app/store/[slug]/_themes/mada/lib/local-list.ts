"use client";

export { useLocalList } from "../../shared/local-list";

export const wishlistKey = (storeSlug: string) => `mada:wishlist:${storeSlug}`;
export const recentKey = (storeSlug: string) => `mada:recent:${storeSlug}`;
