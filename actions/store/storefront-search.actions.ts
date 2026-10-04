"use server";

import { prisma } from "@/lib/prisma";

export type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
};

/** Live search suggestions for the storefront search box (read-only, public). */
export async function SearchStoreProductsAction(
  storeSlug: string,
  query: string,
): Promise<SearchSuggestion[]> {
  const term = query.trim().slice(0, 80);
  if (!storeSlug || term.length < 2) return [];

  return prisma.product.findMany({
    where: {
      store: { slug: storeSlug },
      isActive: true,
      name: { contains: term, mode: "insensitive" },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: { id: true, name: true, slug: true, image: true, price: true, compareAtPrice: true },
  });
}
