import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { normalizeProductsQueryParams } from "@/lib/products-query";
import { getStorefrontTheme } from "../_themes";
import { PRODUCT_CARD_SELECT, getStoreCategoryLinks, getStoreFacets, getStoreThemeId, toProductCards, getStorefrontClosure } from "../_lib/storefront";

type StoreProductsRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    search?: string;
    category?: string;
    featured?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    brand?: string;
    size?: string;
    color?: string;
    sort?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: StoreProductsRouteProps): Promise<Metadata> {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true },
  });

  return {
    title: "كل المنتجات",
    description: store ? `تصفح كل منتجات ${store.name} واطلب أونلاين بسهولة.` : "تصفح المنتجات المتاحة",
    // Filters/sorting/pages are variations of the same listing.
    alternates: { canonical: "/products" },
    openGraph: { url: "/products" },
  };
}

export default async function StoreProductsRoute({
  params,
  searchParams,
}: StoreProductsRouteProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  if (!slug) return notFound();

  const query = normalizeProductsQueryParams(resolvedSearchParams);

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: { select: { storeLanguage: true } },
    },
  });

  if (!store) return notFound();

  const theme = getStorefrontTheme(await getStoreThemeId(slug));

  const closure = await getStorefrontClosure(store.id);
  if (closure) {
    return <theme.StoreClosed storeSlug={store.slug} pause={closure.pause} />;
  }

  const where = {
    storeId: store.id,
    isActive: true,
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.featured ? { isFeatured: true } : {}),
    ...(query.inStock ? { OR: [{ stock: { gt: 0 } }, { isDigital: true }] } : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.size ? { sizes: { has: query.size } } : {}),
    ...(query.color ? { colors: { has: query.color } } : {}),
    ...((query.minPrice > 0 || query.maxPrice > 0) && {
      price: {
        ...(query.minPrice > 0 ? { gte: query.minPrice } : {}),
        ...(query.maxPrice > 0 ? { lte: query.maxPrice } : {}),
      },
    }),
  };

  const orderBy =
    query.sort === "price-asc"
      ? { price: "asc" as const }
      : query.sort === "price-desc"
        ? { price: "desc" as const }
        : query.sort === "oldest"
          ? { createdAt: "asc" as const }
          : query.sort === "name-asc"
            ? { name: "asc" as const }
            : query.sort === "name-desc"
              ? { name: "desc" as const }
              : { createdAt: "desc" as const };

  const [rows, total, categories, bounds, facets] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.product.count({ where }),
    getStoreCategoryLinks(store.id),
    prisma.product.aggregate({
      where: { storeId: store.id, isActive: true },
      _min: { price: true },
      _max: { price: true },
    }),
    getStoreFacets(store.id),
  ]);

  const products = await toProductCards(rows);

  return (
    <theme.ProductListing
      store={{ name: store.name, slug: store.slug }}
      products={products}
      categories={categories.filter((c) => c.productCount > 0 || c.slug === query.category)}
      query={query}
      total={total}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      pageSize={PAGE_SIZE}
      priceBounds={
        bounds._min.price !== null && bounds._max.price !== null
          ? { min: bounds._min.price, max: bounds._max.price }
          : null
      }
      dir={store.settings?.storeLanguage === "en" ? "ltr" : "rtl"}
      facets={facets}
    />
  );
}
