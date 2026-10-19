import Link from "next/link";
import type { Metadata } from "next";
import { Package, Plus, SearchX, Store, Upload } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  readPage,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { baseProductWhere, parseProductFilters, productWhere, viewWhere } from "./_components/product-filters";
import { ProductsTable, type ProductRow } from "./_components/products-table";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("المنتجات"),
  description: tr("إدارة منتجات المتجر وعرضها وتعديلها وحذفها"),
};
}

const PAGE_SIZE = 20;
const BASE_PATH = "/products";

type ProductsRouteProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

export default async function ProductsRoute({ searchParams }: ProductsRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول عشان تضيف منتجاتك وتبدأ تبيع.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const filters = parseProductFilters(params);
  const base = baseProductWhere(store.id, filters);

  // Tab counts share search + category with the list, so each number matches its tab.
  const [allCount, activeCount, hiddenCount, lowCount, outCount, categories, storeProductCount] = await Promise.all([
    prisma.product.count({ where: base }),
    prisma.product.count({ where: { AND: [base, viewWhere("active")] } }),
    prisma.product.count({ where: { AND: [base, viewWhere("hidden")] } }),
    prisma.product.count({ where: { AND: [base, viewWhere("low")] } }),
    prisma.product.count({ where: { AND: [base, viewWhere("out")] } }),
    prisma.category.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where: { storeId: store.id } }),
  ]);

  const viewCounts = { active: activeCount, hidden: hiddenCount, low: lowCount, out: outCount };
  const listTotal = filters.view ? viewCounts[filters.view] : allCount;
  const totalPages = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);

  const products = await prisma.product.findMany({
    where: productWhere(store.id, filters),
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      lowStockThreshold: true,
      image: true,
      isActive: true,
      isFeatured: true,
      type: true,
      category: { select: { name: true } },
    },
  });

  // Units sold (excluding canceled orders) for just the products on this page.
  const sold = products.length
    ? await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: products.map((p) => p.id) }, order: { status: { not: "CANCELED" } } },
        _sum: { quantity: true },
      })
    : [];
  const soldById = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]));

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    image: product.image,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    type: product.type,
    categoryName: product.category.name,
    soldCount: soldById.get(product.id) ?? 0,
  }));

  const hasFilters = Boolean(filters.q || filters.category || filters.view);

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("المنتجات")}
        description={tr("كل منتجاتك في مكان واحد: الأسعار، المخزون، وإيه اللي ظاهر في المتجر.")}
        actions={
          <>
            <Button asChild variant="outline" className="h-9 gap-1.5">
              <Link href="/products/import">
                <Upload className="size-4" />
                {tr("استيراد")}
              </Link>
            </Button>
            <Button asChild className="h-9 gap-1.5">
              <Link href="/products/new">
                <Plus className="size-4" />
                {tr("إضافة منتج")}
              </Link>
            </Button>
          </>
        }
      />

      {storeProductCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Package}
            title={tr("لسه مضفتش منتجات")}
            description={tr("ضيف أول منتج بالصور والسعر والكمية، أو استورد منتجاتك مرة واحدة من ملف Excel أو CSV.")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/products/import">
                    <Upload className="size-4" />
                    {tr("استيراد من ملف")}
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/products/new">
                    <Plus className="size-4" />
                    {tr("إضافة أول منتج")}
                  </Link>
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("عرض المنتجات")}
            param="view"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              { label: tr("ظاهر في المتجر"), value: "active", count: activeCount },
              { label: tr("مخفي"), value: "hidden", count: hiddenCount },
              { label: tr("مخزون قليل"), value: "low", count: lowCount },
              { label: tr("نفد"), value: "out", count: outCount },
            ]}
          />

          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث بالاسم أو SKU أو الباركود")} />
                {categories.length > 0 && (
                  <SelectFilter
                    label={tr("التصنيف")}
                    param="category"
                    allLabel={tr("كل التصنيفات")}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                )}
              </>
            }
            footer={
              listTotal > 0 ? (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={listTotal}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun={tr("منتج")}
                />
              ) : undefined
            }
          >
            {rows.length > 0 ? (
              <ProductsTable products={rows} storeSlug={store.slug} />
            ) : (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش منتجات بالفلاتر دي")}
                description={
                  filters.q ? tr("مفيش نتايج لـ \"{0}\". جرّب اسم أو SKU تاني.", filters.q) : tr("جرّب تبويب أو تصنيف تاني.")
                }
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>{tr("مسح الفلاتر")}</Link>
                    </Button>
                  )
                }
              />
            )}
          </DataCard>
        </div>
      )}
    </div>
  );
}
