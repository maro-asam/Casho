import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch, SearchX, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import { RuledGrid } from "../product/ProductCard";
import { Empty, PageTitle, StarMark, Wrap, btn, num } from "../ui";
import MobileFilters from "./MobileFilters";
import PricePopover from "./PricePopover";
import SortSelect from "./SortSelect";

function href(slug: string, q: Partial<ProductsQuery>) {
  return buildStoreUrl(slug, `/products${productsQueryString(q)}`);
}

/** Category tabs: one swipeable row on every screen. */
function CategoryTabs({ slug, query, categories }: { slug: string; query: ProductsQuery; categories: CategoryLink[] }) {
  if (categories.length === 0) return null;
  const tabs = [{ id: "all", slug: "", name: "الكل", productCount: null as number | null }, ...categories];
  return (
    <nav aria-label="التصنيفات" className="border-b border-(--rq-rule)">
      <ul className="rq-rail rq-bleed gap-7 lg:mx-0 lg:px-0">
        {tabs.map((c) => {
          const current = query.category === c.slug;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={href(slug, { ...query, category: c.slug, page: 1 })}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-12 items-center text-[0.9375rem] transition-colors hover:text-(--rq-ink)",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-(--rq-origin-start) after:scale-x-0 after:bg-(--rq-accent) after:transition-transform after:duration-(--rq-dur)",
                  current ? "font-semibold after:scale-x-100" : "text-(--rq-quiet) hover:after:scale-x-100",
                )}
              >
                {c.name}
                {c.productCount !== null && <span className="rq-sup">{num(c.productCount)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveFilters({ slug, query }: { slug: string; query: ProductsQuery }) {
  const chips: { label: string; remove: Partial<ProductsQuery> }[] = [];
  if (query.search) chips.push({ label: `«${query.search}»`, remove: { search: "" } });
  if (query.featured) chips.push({ label: "اختيارات المتجر", remove: { featured: false } });
  if (query.minPrice > 0) chips.push({ label: `من ${formatPrice(query.minPrice)}`, remove: { minPrice: 0 } });
  if (query.maxPrice > 0) chips.push({ label: `لحد ${formatPrice(query.maxPrice)}`, remove: { maxPrice: 0 } });
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-5">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={href(slug, { ...query, ...chip.remove, page: 1 })}
          scroll={false}
          aria-label={`إزالة فلتر ${chip.label}`}
          className="rq-opt gap-2 text-sm"
        >
          <span className="max-w-56 truncate">{chip.label}</span>
          <X className="size-3.5 shrink-0" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link href={href(slug, { sort: query.sort })} scroll={false} className={btn({ variant: "text", size: "sm" })}>
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
  const edge = "group inline-flex min-h-12 items-center gap-2 text-sm font-semibold";

  return (
    <nav aria-label="الصفحات" className="mt-10 flex items-center justify-between gap-4 border-b border-(--rq-ink) pb-3 sm:mt-14">
      {page > 1 ? (
        <Link href={href(slug, { ...query, page: page - 1 })} className={edge}>
          <ArrowRight className="size-4 ltr:rotate-180" />
          <span className="rq-link">السابق</span>
        </Link>
      ) : (
        <span className={cn(edge, "opacity-30")} aria-hidden>
          <ArrowRight className="size-4 ltr:rotate-180" />
          السابق
        </span>
      )}

      <ul className="flex items-center gap-1 sm:gap-2">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} className="px-1 text-(--rq-quiet)" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(slug, { ...query, page: p })}
                aria-current={p === page ? "page" : undefined}
                aria-label={`الصفحة ${p}`}
                className={cn(
                  "rq-face grid size-11 place-items-center text-lg font-semibold transition-colors",
                  p === page ? "text-(--rq-accent) underline decoration-2 underline-offset-8" : "text-(--rq-quiet) hover:text-(--rq-ink)",
                )}
              >
                {num(p)}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < totalPages ? (
        <Link href={href(slug, { ...query, page: page + 1 })} className={edge}>
          <span className="rq-link">التالي</span>
          <ArrowLeft className="size-4 ltr:rotate-180" />
        </Link>
      ) : (
        <span className={cn(edge, "opacity-30")} aria-hidden>
          التالي
          <ArrowLeft className="size-4 ltr:rotate-180" />
        </span>
      )}
    </nav>
  );
}

export default function RiwaqListing({
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
    ? `«${query.search}»`
    : category
      ? category.name
      : query.featured
        ? "اختيارات المتجر"
        : "كل المنتجات";

  const from = total === 0 ? 0 : (query.page - 1) * pageSize + 1;
  const to = Math.min(query.page * pageSize, total);

  return (
    <Wrap className="pb-6">
      <PageTitle
        crumbs={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          ...(query.search || category
            ? [{ label: "المنتجات", href: buildStoreUrl(store.slug, "/products") }, { label: query.search ? "البحث" : category!.name }]
            : [{ label: "المنتجات" }]),
        ]}
        title={
          query.search ? (
            <>
              <span className="rq-label mb-2 block">نتائج البحث عن</span>
              {title}
            </>
          ) : (
            title
          )
        }
        count={total}
        aside={
          category?.image ? (
            <span className="rq-arch relative hidden h-28 w-20 shrink-0 sm:block">
              <Image src={category.image} alt="" fill sizes="80px" priority className="object-cover" />
            </span>
          ) : undefined
        }
      />

      <CategoryTabs slug={store.slug} query={query} categories={categories} />

      <MobileFilters
        storeSlug={store.slug}
        query={query}
        categories={categories}
        priceBounds={priceBounds}
        activeCount={activeCount}
        total={total}
        dir={dir}
      />

      {/* Desktop toolbar */}
      <div className="hidden min-h-16 items-center justify-between gap-6 border-b border-(--rq-rule) lg:flex">
        <p className="text-sm text-(--rq-quiet)">
          {total > 0 ? (
            <>
              عرض{" "}
              <span className="rq-num font-semibold text-(--rq-ink)">
                {num(from)}–{num(to)}
              </span>{" "}
              من <span className="rq-num">{num(total)}</span> منتج
            </>
          ) : (
            "مفيش نتائج"
          )}
        </p>
        <div className="flex items-center gap-4">
          <PricePopover storeSlug={store.slug} query={query} priceBounds={priceBounds} dir={dir} />
          <Link
            href={href(store.slug, { ...query, featured: !query.featured, page: 1 })}
            scroll={false}
            aria-pressed={query.featured}
            className="rq-opt gap-2 border-transparent text-sm aria-pressed:border-(--rq-ink)"
          >
            <StarMark className="size-2.5" />
            اختيارات المتجر
          </Link>
          <span className="h-6 w-px bg-(--rq-rule)" aria-hidden />
          <SortSelect storeSlug={store.slug} query={query} />
        </div>
      </div>

      <ActiveFilters slug={store.slug} query={query} />

      <section aria-label="المنتجات" className="mt-6 sm:mt-8">
        {products.length === 0 ? (
          filtered ? (
            <Empty
              icon={<SearchX />}
              title={query.search ? `مفيش نتائج لـ «${query.search}»` : "مفيش منتجات بالفلاتر دي"}
              description={
                query.search
                  ? "اتأكد من كتابة الاسم، أو جرب كلمة أبسط."
                  : "جرب تغيّر الفلاتر أو تمسح بعضها عشان تشوف منتجات أكتر."
              }
              action={
                <>
                  <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
                    عرض كل المنتجات
                  </Link>
                  {categories.length > 0 && (
                    <Link href={buildStoreUrl(store.slug, "/categories")} className={btn({ variant: "line" })}>
                      التصنيفات
                    </Link>
                  )}
                </>
              }
            />
          ) : (
            <Empty
              icon={<PackageSearch />}
              title="لسه مفيش منتجات"
              description="المتجر بيجهز منتجاته. ارجع تاني قريب."
              action={
                <Link href={buildStoreUrl(store.slug)} className={btn({ variant: "line" })}>
                  الرجوع للرئيسية
                </Link>
              }
            />
          )
        ) : (
          <>
            <RuledGrid products={products} storeSlug={store.slug} priorityCount={4} startIndex={from} />
            <Pagination slug={store.slug} query={query} totalPages={totalPages} />
          </>
        )}
      </section>
    </Wrap>
  );
}
