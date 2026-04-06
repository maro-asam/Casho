import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

import {
  buildProductsUrl,
  getSortOptionLabel,
  normalizeProductsQueryParams,
} from "@/lib/products-query";
import ProductCard from "@/app/store/[slug]/_components/shared/ProductCard";

import ProductsToolbar from "../_components/products/ProductsToolbar";
import ActiveFiltersBar from "../_components/products/ActiveFiltersBar";
import EmptyProductsState from "../_components/products/EmptyProductsState";
import ProductsPagination from "../_components/products/ProductsPagination";
import ProductsSidebarFilters from "../_components/products/ProductSidebarFilters";
import ProductsMobileFilters from "../_components/products/ProductsMobileFilters";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

type StoreProductsRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    search?: string;
    category?: string;
    featured?: string;
    minPrice?: string;
    maxPrice?: string;
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
    title: store ? `منتجات ${store.name}` : "المنتجات",
    description: store
      ? `تصفح منتجات متجر ${store.name}`
      : "تصفح المنتجات المتاحة",
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
      subscriptionStatus: true,
      categories: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center px-4"
      >
        <div className="w-full max-w-xl rounded-3xl border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-bold">هذا المتجر غير مفعل</h1>
          <p className="text-muted-foreground">
            لا يمكن عرض المنتجات حاليًا لأن اشتراك المتجر غير نشط.
          </p>
        </div>
      </div>
    );
  }

  const baseWhere = {
    storeId: store.id,
    isActive: true,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(query.category
      ? {
          category: {
            slug: query.category,
          },
        }
      : {}),
    ...(query.featured
      ? {
          isFeatured: true,
        }
      : {}),
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

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: baseWhere,
      orderBy,
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
        isFeatured: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({
      where: baseWhere,
    }),
    prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        isFeatured: true,
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        image: true,
        isFeatured: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const showingFrom =
    totalProducts === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(query.page * PAGE_SIZE, totalProducts);

  const hasFilters =
    !!query.search ||
    !!query.category ||
    query.featured ||
    query.minPrice > 0 ||
    query.maxPrice > 0 ||
    query.sort !== "newest";

  return (
    <div dir="rtl" className="w-full py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/store/${store.slug}`} className="hover:text-foreground">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-foreground">المنتجات</span>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-5">
          <h1 className="text-3xl font-bold md:text-4xl">
            كل منتجات <span className="text-primary">{store.name}</span>
          </h1>
          <p className="text-muted-foreground">
            عرض {showingFrom}-{showingTo} من أصل {totalProducts} منتج
            {query.sort !== "newest"
              ? ` • ترتيب: ${getSortOptionLabel(query.sort)}`
              : ""}
          </p>
        </div>

        <ProductsMobileFilters
          storeSlug={store.slug}
          categories={store.categories}
          currentQuery={query}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <ProductsSidebarFilters
            storeSlug={store.slug}
            categories={store.categories}
            currentQuery={query}
          />
        </aside>

        <section className="space-y-5">
          <ProductsToolbar storeSlug={store.slug} currentQuery={query} />

          {hasFilters && (
            <ActiveFiltersBar
              storeSlug={store.slug}
              currentQuery={query}
              categories={store.categories}
            />
          )}

          {products.length === 0 ? (
            <EmptyProductsState storeSlug={store.slug} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                  />
                ))}
              </div>

              <ProductsPagination
                currentPage={query.page}
                totalPages={totalPages}
                buildHref={(page) =>
                  buildProductsUrl(store.slug, {
                    ...query,
                    page,
                  })
                }
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
