// Pure helpers for Casho Arena (no UI, no hooks) — tested in arena.test.ts.

import type { CategoryLink, ProductCardData } from "../../types";

/** A package as the picker shows it. */
export type Pkg = Pick<
  ProductCardData,
  "id" | "name" | "slug" | "price" | "compareAtPrice" | "stock" | "isFeatured" | "image" | "sizes" | "colors" | "hasOptions"
>;

/** Packages smallest → largest. Package names lead with their size ("110 جوهرة"),
 *  so price is the honest order; ties keep the merchant's order. */
export function sortPackages<T extends Pick<Pkg, "price">>(list: T[]): T[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.price - b.p.price || a.i - b.i)
    .map(({ p }) => p);
}

/** The package to start on: the requested one, else the first featured one in
 *  stock, else the first in stock. */
export function initialPackage<T extends Pick<Pkg, "id" | "slug" | "stock" | "isFeatured">>(list: T[], wanted?: string | null): T | null {
  const inStock = list.filter((p) => p.stock > 0);
  return (
    (wanted ? inStock.find((p) => p.id === wanted || p.slug === wanted) : undefined) ??
    inStock.find((p) => p.isFeatured) ??
    inStock[0] ??
    null
  );
}

/** A hero headline in two lines: the merchant's line break, else the first
 *  "،" / "," / " - " / "." splits it. The second line gets the glow. */
export function splitHeadline(text: string): [string, string | null] {
  const clean = text.trim();
  const nl = clean.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (nl.length > 1) return [nl[0], nl.slice(1).join(" ")];
  const m = clean.match(/^(.{4,}?)\s*(?:،|,| - | – |\.)\s+(.{4,})$/);
  if (m) return [m[1].trim(), m[2].trim().replace(/[.،,]$/, "")];
  return [clean, null];
}

/** Categories as the home shows them: ones with packages first (in the store's
 *  order), then the ones still empty ("قريبًا"). */
export function orderGames(categories: CategoryLink[]): CategoryLink[] {
  return [...categories.filter((c) => c.productCount > 0), ...categories.filter((c) => c.productCount === 0)];
}

/** Categories that hold a featured package — the store's own "most wanted"
 *  signal. When every game with packages has one, it sets none apart: no badge. */
export function featuredGameIds(categories: CategoryLink[], products: Pick<ProductCardData, "isFeatured" | "categoryName">[]): Set<string> {
  const names = new Set(products.filter((p) => p.isFeatured && p.categoryName).map((p) => p.categoryName as string));
  const hot = categories.filter((c) => names.has(c.name));
  const live = categories.filter((c) => c.productCount > 0);
  return hot.length > 0 && hot.length >= live.length ? new Set() : new Set(hot.map((c) => c.id));
}

/** Packages of the same game as a product, for its page (the product first is not assumed). */
export function sameGame<T extends Pick<ProductCardData, "id" | "categoryName">>(related: T[], categoryName: string, exceptId: string): T[] {
  return related.filter((p) => p.id !== exceptId && p.categoryName === categoryName);
}
