import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ThemeCustomization } from "@/types/store-theme.types";
import type { ProductCardData } from "../_themes/types";

// ─────────────────────────────────────────────────────────────────────────────
//  Storefront data helpers
//  Pages load data with these and hand plain view-models to the active theme.
// ─────────────────────────────────────────────────────────────────────────────

/** Everything a product card needs — use it in every listing query. */
export const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  image: true,
  isFeatured: true,
  stock: true,
  sizes: true,
  colors: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

/** Average rating + count for a set of products, in one query. */
async function getRatings(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { average: number; count: number }>();
  const rows = await prisma.productReview.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((r) => [r.productId, { average: r._avg.rating ?? 0, count: r._count._all }]),
  );
}

/** Map product rows to card view-models (with ratings attached). */
export async function toProductCards(rows: CardRow[]): Promise<ProductCardData[]> {
  const ratings = await getRatings(rows.map((r) => r.id));
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: p.image,
    isFeatured: p.isFeatured,
    stock: p.stock,
    hasOptions: p.sizes.length > 0 || p.colors.length > 0,
    categoryName: p.category?.name ?? null,
    rating: ratings.get(p.id) ?? null,
  }));
}

/** Theme id the store renders with (themeConfig wins over the legacy column). */
export const getStoreThemeId = cache(async (slug: string) => {
  const settings = await prisma.storeSettings.findFirst({
    where: { store: { slug } },
    select: { themeId: true, themeConfig: true },
  });
  const config = settings?.themeConfig as ThemeCustomization | null;
  return config?.presetId ?? settings?.themeId ?? "default";
});

/** Categories with active-product counts — shared by header, footer and pages. */
export const getStoreCategoryLinks = cache(async (storeId: string) => {
  const categories = await prisma.category.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    productCount: c._count.products,
  }));
});
