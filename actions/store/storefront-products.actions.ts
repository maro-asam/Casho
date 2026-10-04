"use server";

// Read-only product lookups the storefront calls from the browser:
// recently viewed / wishlist cards, cart & search suggestions, quick view.
// Only active products of the given store are ever returned.

import { prisma } from "@/lib/prisma";
import { PRODUCT_CARD_SELECT, toProductCards } from "@/app/store/[slug]/_lib/storefront";

const MAX_IDS = 24;

/** Product cards for a store — by ids (kept in the given order) or its
 *  featured/newest products when no ids are passed. */
export async function GetStorefrontCardsAction(
  storeSlug: string,
  opts: { ids?: string[]; excludeIds?: string[]; take?: number } = {},
) {
  if (!storeSlug) return [];
  const take = Math.min(Math.max(opts.take ?? 8, 1), MAX_IDS);
  const ids = (opts.ids ?? []).filter((id) => typeof id === "string").slice(0, MAX_IDS);
  const exclude = (opts.excludeIds ?? []).filter((id) => typeof id === "string").slice(0, 50);

  const base = { store: { slug: storeSlug }, isActive: true };

  if (opts.ids) {
    if (ids.length === 0) return [];
    const rows = await prisma.product.findMany({ where: { ...base, id: { in: ids } }, select: PRODUCT_CARD_SELECT });
    const cards = await toProductCards(rows);
    return ids.map((id) => cards.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
  }

  const rows = await prisma.product.findMany({
    where: { ...base, ...(exclude.length && { id: { notIn: exclude } }), stock: { gt: 0 } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
    select: PRODUCT_CARD_SELECT,
  });
  return toProductCards(rows);
}

/** Everything the quick-view sheet needs to show and add a product. */
export async function GetQuickViewProductAction(storeSlug: string, productSlug: string) {
  if (!storeSlug || !productSlug) return null;
  const p = await prisma.product.findFirst({
    where: { slug: productSlug, isActive: true, store: { slug: storeSlug } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      image: true,
      images: true,
      description: true,
      stock: true,
      sizes: true,
      colors: true,
      brand: true,
      category: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } },
    },
  });
  if (!p) return null;

  const gallery = [p.image, ...p.images].filter((src, i, all) => !!src && all.indexOf(src) === i);
  const count = p.reviews.length;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    gallery,
    description: p.description?.trim().slice(0, 320) || null,
    stock: p.stock,
    sizes: p.sizes,
    colors: p.colors,
    brand: p.brand,
    category: p.category,
    rating: count ? { average: p.reviews.reduce((s, r) => s + r.rating, 0) / count, count } : null,
  };
}

export type QuickViewProduct = NonNullable<Awaited<ReturnType<typeof GetQuickViewProductAction>>>;
