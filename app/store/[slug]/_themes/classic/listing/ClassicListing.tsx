import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, SearchX, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { ListingViewProps } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import { Container, EmptyState, PageHeader, btn } from "../ui";
import FilterForm from "./FilterForm";
import MobileFilterBar from "./MobileFilterBar";
import SortSelect from "./SortSelect";

const nf = new Intl.NumberFormat("ar-EG");

function href(slug: string, q: Partial<ProductsQuery>) {
  return buildStoreUrl(slug, `/products${productsQueryString(q)}`);
}

function ActiveFilters({ slug, query, categoryName }: { slug: string; query: ProductsQuery; categoryName?: string }) {
  const chips: { label: string; remove: Partial<ProductsQuery> }[] = [];
  if (query.search) chips.push({ label: `«${query.search}»`, remove: { search: "" } });
  if (categoryName) chips.push({ label: categoryName, remove: { category: "" } });
  if (query.featured) chips.push({ label: "المميزة فقط", remove: { featured: false } });
  if (query.minPrice > 0) chips.push({ label: `من ${formatPrice(query.minPrice)}`, remove: { minPrice: 0 } });
  if (query.maxPrice > 0) chips.push({ label: `إلى ${formatPrice(query.maxPrice)}`, remove: { maxPrice: 0 } });
  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={href(slug, { ...query, ...chip.remove, page: 1 })}
          scroll={false}
          aria-label={`إزالة فلتر ${chip.label}`}
          className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-(--c-subtle) pe-2.5 ps-3.5 text-[0.8125rem] font-medium transition-colors hover:bg-muted"
        >
          <span className="truncate">{chip.label}</span>
          <X className="size-3.5 shrink-0 text-muted-foreground" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link
          href={href(slug, { sort: query.sort })}
          scroll={false}
          className="inline-flex h-9 items-center px-2 text-[0.8125rem] font-semibold underline-offset-4 hover:underline"
        >
          مسح الكل
        </Link>
      )}
    </div>
  );
}

function Pagination({ slug, query, totalPages }: { slug: string; query: ProductsQuery; totalPages: number }) {
  if (totalPages <= 1) return null;
  const page = query.page;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const cell =
    "grid h-11 min-w-11 place-items-center rounded-(--c-radius-sm) px-2 text-sm font-semibold tabular-nums transition-colors";

  return (
    <nav aria-label="الصفحات" className="mt-10 flex items-center justify-center gap-1 sm:mt-14">
      {page > 1 ? (
        <Link href={href(slug, { ...query, page: page - 1 })} aria-label="الصفحة السابقة" className={cn(cell, "hover:bg-(--c-subtle)")}>
          <ChevronRight className="size-5 ltr:rotate-180" />
        </Link>
      ) : (
        <span className={cn(cell, "opacity-30")} aria-hidden>
          <ChevronRight className="size-5 ltr:rotate-180" />
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(slug, { ...query, page: p })}
            aria-current={p === page ? "page" : undefined}
            aria-label={`الصفحة ${p}`}
            className={cn(cell, p === page ? "bg-foreground text-background" : "hover:bg-(--c-subtle)")}
          >
            {nf.format(p)}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(slug, { ...query, page: page + 1 })} aria-label="الصفحة التالية" className={cn(cell, "hover:bg-(--c-subtle)")}>
          <ChevronLeft className="size-5 ltr:rotate-180" />
        </Link>
      ) : (
        <span className={cn(cell, "opacity-30")} aria-hidden>
          <ChevronLeft className="size-5 ltr:rotate-180" />
        </span>
      )}
    </nav>
  );
}

export default function ClassicListing({
  store,
  products,
  categories,
  query,
  total,
  totalPages,
  pageSize,
  priceBounds,
  dir,
}: ListingViewProps) {
  const category = categories.find((c) => c.slug === query.category);
  const activeCount =
    (query.category ? 1 : 0) + (query.featured ? 1 : 0) + (query.minPrice > 0 ? 1 : 0) + (query.maxPrice > 0 ? 1 : 0);
  const filtered = activeCount > 0 || !!query.search;

  const title = query.search
    ? `نتائج البحث عن «${query.search}»`
    : category
      ? category.name
      : query.featured
        ? "المنتجات المميزة"
        : "كل المنتجات";

  const from = total === 0 ? 0 : (query.page - 1) * pageSize + 1;
  const to = Math.min(query.page * pageSize, total);

  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          ...(query.search || category
            ? [{ label: "المنتجات", href: buildStoreUrl(store.slug, "/products") }, { label: query.search ? "البحث" : category!.name }]
            : [{ label: "المنتجات" }]),
        ]}
        title={<span className="break-words">{title}</span>}
        meta={total > 0 ? `${nf.format(total)} منتج` : undefined}
      />

      <MobileFilterBar
        storeSlug={store.slug}
        query={query}
        categories={categories}
        priceBounds={priceBounds}
        activeCount={activeCount}
        total={total}
        dir={dir}
      />

      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside aria-label="الفلاتر" className="hidden lg:block">
          <div className="pb-6">
            <FilterForm
              storeSlug={store.slug}
              query={query}
              categories={categories}
              priceBounds={priceBounds}
              mode="sidebar"
            />
          </div>
        </aside>

        <section aria-label="المنتجات" className="min-w-0">
          <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
            <p className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>
                  عرض <span className="font-semibold text-foreground tabular-nums">{nf.format(from)}–{nf.format(to)}</span> من{" "}
                  <span className="tabular-nums">{nf.format(total)}</span> منتج
                </>
              ) : (
                "مفيش نتائج"
              )}
            </p>
            <SortSelect storeSlug={store.slug} query={query} className="w-52" />
          </div>

          <ActiveFilters slug={store.slug} query={query} categoryName={category?.name} />

          {products.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={<SearchX />}
                title={query.search ? `مفيش نتائج لـ «${query.search}»` : "مفيش منتجات مطابقة"}
                description={
                  query.search
                    ? "اتأكد من كتابة الاسم صح، أو جرب كلمة أبسط."
                    : "جرب تغيّر الفلاتر أو تمسح بعضها عشان تشوف منتجات أكتر."
                }
                action={
                  <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ variant: "outline" })}>
                    عرض كل المنتجات
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={<PackageSearch />}
                title="لسه مفيش منتجات"
                description="المتجر بيجهز منتجاته. ارجع تاني قريب."
                action={
                  <Link href={buildStoreUrl(store.slug)} className={btn({ variant: "outline" })}>
                    الرجوع للرئيسية
                  </Link>
                }
              />
            )
          ) : (
            <>
              <ProductGrid products={products} storeSlug={store.slug} cols={3} priorityCount={4} />
              <Pagination slug={store.slug} query={query} totalPages={totalPages} />
            </>
          )}
        </section>
      </div>
    </Container>
  );
}
