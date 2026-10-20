import Link from "next/link";
import type { Metadata } from "next";
import { Package, Plus, SearchX, Store, Upload } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  Segmented,
  SearchInput,
  SelectFilter,
  Unavailable,
  appleButton,
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
      <div className="apple-card" dir={tdir()}>
        <Unavailable
          icon={Store}
          title={tr("لسه معندكش متجر")}
          description={tr("أنشئ متجرك الأول عشان تضيف منتجاتك وتبدأ تبيع.")}
        />
      </div>
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
      <LargeTitle
        title={tr("المنتجات")}
        subtitle={tr("كل منتجاتك في مكان واحد: الأسعار، المخزون، وإيه اللي ظاهر في المتجر.")}
        actions={
          <>
            <Link href="/products/import" className={appleButton.gray}>
              <Upload className="size-4 text-muted-foreground" />
              {tr("استيراد")}
            </Link>
            {/* The one prominent action on the page. */}
            <Link href="/products/new" className={appleButton.filled}>
              <Plus className="size-4" strokeWidth={2.4} />
              {tr("إضافة منتج")}
            </Link>
          </>
        }
      />

      {storeProductCount === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={Package}
            title={tr("لسه مضفتش منتجات")}
            description={tr("ضيف أول منتج بالصور والسعر والكمية، أو استورد منتجاتك مرة واحدة من ملف Excel أو CSV.")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/products/import" className={`${appleButton.tinted} text-primary`}>
                  <Upload className="size-4" />
                  {tr("استيراد من ملف")}
                </Link>
                <Link href="/products/new" className={`${appleButton.filled} h-9 px-4`}>
                  <Plus className="size-4" strokeWidth={2.4} />
                  {tr("إضافة أول منتج")}
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("عرض المنتجات")}
            param="view"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              { label: tr("ظاهر في المتجر"), value: "active", count: activeCount },
              { label: tr("مخفي"), value: "hidden", count: hiddenCount },
              { label: tr("مخزون قليل"), value: "low", count: lowCount },
              { label: tr("نفد"), value: "out", count: outCount },
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SearchInput
                placeholder={tr("ابحث بالاسم أو SKU أو الباركود")}
                className="sm:max-w-sm"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
              {categories.length > 0 && (
                <SelectFilter
                  label={tr("التصنيف")}
                  param="category"
                  allLabel={tr("كل التصنيفات")}
                  className="h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-44"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            </div>

            {rows.length > 0 ? (
              <ProductsTable products={rows} storeSlug={store.slug} />
            ) : (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش منتجات بالفلاتر دي")}
                description={
                  filters.q ? tr("مفيش نتايج لـ \"{0}\". جرّب اسم أو SKU تاني.", filters.q) : tr("جرّب تبويب أو تصنيف تاني.")
                }
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      {tr("مسح الفلاتر")}
                    </Link>
                  )
                }
              />
            )}

            {listTotal > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={listTotal}
                  basePath={BASE_PATH}
                  searchParams={params}
                  noun={tr("منتج")}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
