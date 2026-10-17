import { cache } from "react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { BANNER_DEFAULT_CTA, BANNER_LINK_SELECT, liveBannerWhere, resolveBannerLink } from "@/lib/banners/banner-link";
import type { ThemeCustomization } from "@/types/store-theme.types";
import type { BannerData, ProductCardData } from "../_themes/types";

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
  images: true,
  brand: true,
  createdAt: true,
  isFeatured: true,
  stock: true,
  sizes: true,
  colors: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

const BANNER_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  ctaLabel: true,
  image: true,
  mobileImage: true,
  ...BANNER_LINK_SELECT,
} satisfies Prisma.BannerSelect;

/** Nested `banners` query for a store: live now (visible + inside its
 *  schedule), in the merchant's order. */
export function liveBannersQuery(take?: number) {
  return {
    where: liveBannerWhere(),
    orderBy: [{ position: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    ...(take && { take }),
    select: BANNER_SELECT,
  } satisfies Prisma.Store$bannersArgs;
}

type BannerRow = Prisma.BannerGetPayload<{ select: typeof BANNER_SELECT }>;

/** Banner rows → theme view-models with their click destination resolved. */
export function toBannerData(rows: BannerRow[], whatsapp: string | null | undefined): BannerData[] {
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    mobileImage: b.mobileImage,
    cta: b.ctaLabel || BANNER_DEFAULT_CTA,
    link: resolveBannerLink(b, { whatsapp }),
  }));
}

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

const NEW_FOR_MS = 30 * 24 * 60 * 60 * 1000;

/** Map product rows to card view-models (with ratings attached). */
export async function toProductCards(rows: CardRow[]): Promise<ProductCardData[]> {
  const ratings = await getRatings(rows.map((r) => r.id));
  const now = Date.now();
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
    hoverImage: p.images.find((src) => src && src !== p.image) ?? null,
    sizes: p.sizes,
    colors: p.colors,
    brand: p.brand,
    isNew: now - p.createdAt.getTime() < NEW_FOR_MS,
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

/** Brands, sizes and colors used by a store's active products (filter facets). */
export async function getStoreFacets(storeId: string) {
  const rows = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: { brand: true, sizes: true, colors: true },
    take: 2000,
  });
  const brands = new Set<string>();
  const sizes = new Set<string>();
  const colors = new Set<string>();
  for (const r of rows) {
    if (r.brand?.trim()) brands.add(r.brand.trim());
    r.sizes.forEach((v) => v.trim() && sizes.add(v.trim()));
    r.colors.forEach((v) => v.trim() && colors.add(v.trim()));
  }
  const sort = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b, "ar"));
  return { brands: sort(brands), sizes: [...sizes], colors: sort(colors) };
}
