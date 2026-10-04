import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch, SearchX, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import ProductCard from "../product/ProductCard";
import { Arrow, Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";
import { DesktopLayout } from "./ListingControls";

function href(slug: string, q: Partial<ProductsQuery>) {
  return buildStoreUrl(slug, `/products${productsQueryString(q)}`);
}

/** Category chips with thumbnails — one swipeable row. */
export function CategoryChips({ slug, current, categories, query }: { slug: string; current: string; categories: CategoryLink[]; query?: ProductsQuery }) {
  if (categories.length === 0) return null;
  const to = (c: string) => (query ? href(slug, { ...query, category: c, page: 1 }) : c ? buildStoreUrl(slug, `/categories/${c}`) : buildStoreUrl(slug, "/products"));
  return (
    <nav aria-label="التصنيفات" className="mb-6">
      <ul className="md-rail md-bleed gap-2">
        {[{ id: "all", slug: "", name: "الكل", image: null as string | null }, ...categories].map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={to(c.slug)}
              scroll={false}
              aria-current={current === c.slug ? "page" : undefined}
              className="md-chip h-12 gap-2.5 ps-1.5 aria-[current=page]:ps-1.5"
            >
              {c.image ? (
                <span className="md-media size-9 shrink-0 rounded-full">
                  <PlateImage src={c.image} sizes="36px" />
                </span>
              ) : (
                <span aria-hidden className="ms-2.5" />
              )}
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ActiveChips({ slug, query, categoryName }: { slug: string; query: ProductsQuery; categoryName?: string }) {
  const chips: { label: string; remove: Partial<ProductsQuery> }[] = [];
  if (query.search) chips.push({ label: `«${query.search}»`, remove: { search: "" } });
  if (categoryName) chips.push({ label: categoryName, remove: { category: "" } });
  if (query.inStock) chips.push({ label: "المتوفر حالًا", remove: { inStock: false } });
  if (query.featured) chips.push({ label: "اختيارات المتجر", remove: { featured: false } });
  if (query.brand) chips.push({ label: query.brand, remove: { brand: "" } });
  if (query.size) chips.push({ label: `مقاس ${query.size}`, remove: { size: "" } });
  if (query.color) chips.push({ label: query.color, remove: { color: "" } });
  if (query.minPrice > 0) chips.push({ label: `من ${formatPrice(query.minPrice)}`, remove: { minPrice: 0 } });
  if (query.maxPrice > 0) chips.push({ label: `لحد ${formatPrice(query.maxPrice)}`, remove: { maxPrice: 0 } });
  if (chips.length === 0) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.label} href={href(slug, { ...query, ...c.remove, page: 1 })} scroll={false} aria-label={`إزالة فلتر ${c.label}`} className="md-chip min-h-9 gap-1.5 bg-(--md-surface) pe-2 text-xs font-semibold">
          <span className="max-w-48 truncate">{c.label}</span>
          <X className="size-3.5" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link href={href(slug, { sort: query.sort })} scroll={false} className="min-h-9 px-2 text-xs font-semibold text-(--md-quiet) underline-offset-4 hover:text-(--md-ink) hover:underline">
          مسح الكل
        </Link>
      )}
    </div>
  );
}

function Pagination({ slug, query, totalPages, shown, total }: { slug: string; query: ProductsQuery; totalPages: number; shown: number; total: number }) {
  if (totalPages <= 1) return null;
  const page = query.page;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav aria-label="الصفحات" className="mt-12 flex flex-col items-center gap-4 sm:mt-16">
      <p className="text-sm text-(--md-quiet)">
        شفت <span className="font-semibold text-(--md-ink) tabular-nums">{num(shown)}</span> من {num(total)} منتج
      </p>
      <span className="h-1 w-48 overflow-hidden rounded-full bg-(--md-line)" aria-hidden>
        <span className="block h-full rounded-full bg-(--md-brand)" style={{ width: `${Math.round((shown / total) * 100)}%` }} />
      </span>
      <div className="mt-2 flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={href(slug, { ...query, page: page - 1 })} aria-label="الصفحة السابقة" className={btn({ variant: "outline", size: "sm", icon: true })}>
            <ArrowRight className="ltr:rotate-180" />
          </Link>
        ) : null}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`g${i}`} className="px-1 text-(--md-quiet)" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(slug, { ...query, page: p })}
              aria-current={p === page ? "page" : undefined}
              aria-label={`الصفحة ${p}`}
              className={cn("md-price grid size-11 place-items-center rounded-full text-sm transition-colors", p === page ? "bg-(--md-ink) text-(--md-bg)" : "hover:bg-(--md-surface)")}
            >
              {num(p)}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link href={href(slug, { ...query, page: page + 1 })} className={btn({ size: "sm", className: "ms-1" })}>
            الصفحة التالية
            <ArrowLeft className="ltr:rotate-180" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export default function MadaListing({ store, products, categories, query, total, totalPages, pageSize, priceBounds, dir, facets }: ListingViewProps) {
  const category = categories.find((c) => c.slug === query.category);
  const activeCount =
    (query.category ? 1 : 0) + (query.featured ? 1 : 0) + (query.inStock ? 1 : 0) + (query.brand ? 1 : 0) + (query.size ? 1 : 0) + (query.color ? 1 : 0) + (query.minPrice > 0 ? 1 : 0) + (query.maxPrice > 0 ? 1 : 0);
  const filtered = activeCount > 0 || !!query.search;
  const shown = Math.min(query.page * pageSize, total);
  const title = query.search ? `نتائج «${query.search}»` : category ? category.name : query.featured ? "اختيارات المتجر" : "كل المنتجات";
  const promoAt = query.page === 1 && products.length >= 8 && !query.featured ? 5 : -1;

  return (
    <Wrap className="pb-8">
      <header className="pb-6 pt-5 sm:pt-7">
        <Crumbs
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            ...(query.search || category ? [{ label: "المنتجات", href: buildStoreUrl(store.slug, "/products") }, { label: query.search ? "البحث" : category!.name }] : [{ label: "المنتجات" }]),
          ]}
        />
        <div className={cn("mt-4", category?.image && "grid grid-cols-1 items-center gap-6 rounded-[1.75rem] bg-(--md-surface) p-3 sm:grid-cols-[minmax(0,1fr)_16rem] sm:p-4 sm:ps-8")}>
          <div className="min-w-0">
            <h1 className="md-h1 break-words">{title}</h1>
            <p className="mt-2 text-sm text-(--md-quiet) lg:hidden">{total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}</p>
          </div>
          {category?.image && (
            <span className="md-media relative hidden aspect-[4/3] sm:block">
              <Image src={category.image} alt="" fill sizes="16rem" priority className="object-cover" />
            </span>
          )}
        </div>
      </header>

      <CategoryChips slug={store.slug} current={query.category} categories={categories} query={query} />

      <DesktopLayout
        storeSlug={store.slug}
        query={query}
        categories={categories}
        priceBounds={priceBounds}
        facets={facets}
        dir={dir}
        activeCount={activeCount}
        total={total}
        toolbarStart={<p className="text-sm text-(--md-quiet)">{total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}</p>}
      >
        <ActiveChips slug={store.slug} query={query} categoryName={category?.name} />
        {products.length === 0 ? (
          filtered ? (
            <Empty
              icon={<SearchX />}
              title={query.search ? `مفيش نتائج لـ «${query.search}»` : "مفيش منتجات بالفلاتر دي"}
              description={query.search ? "اتأكد من الكتابة أو جرب كلمة أبسط." : "جرب تشيل فلتر أو اتنين عشان تشوف منتجات أكتر."}
              action={
                <>
                  <Link href={href(store.slug, { search: query.search, sort: query.sort })} className={btn()}>
                    مسح الفلاتر
                  </Link>
                  <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ variant: "outline" })}>
                    كل المنتجات
                  </Link>
                </>
              }
            />
          ) : (
            <Empty icon={<PackageSearch />} title="لسه مفيش منتجات" description="المتجر بيجهز منتجاته. ارجع تاني قريب." />
          )
        ) : (
          <>
            <ul className="md-pgrid">
              {products.map((p, i) => (
                <li key={p.id} className="contents">
                  {i === promoAt && (
                    <div>
                      <Link
                        href={href(store.slug, { featured: true })}
                        className="group flex h-full min-h-64 flex-col justify-between rounded-(--md-radius) bg-(--md-brand) p-5 text-(--md-brand-ink) transition-transform duration-300 hover:-translate-y-1 sm:p-6"
                      >
                        <span className="md-eyebrow self-start">مختارات</span>
                        <span>
                          <span className="md-face block text-xl font-bold leading-snug sm:text-2xl">اختيارات المتجر</span>
                          <span className="mt-2 block text-sm opacity-75">المنتجات اللي المتجر بيرشحها</span>
                          <span className={btn({ variant: "signal", size: "sm", className: "mt-4" })}>
                            شوفها
                            <Arrow />
                          </span>
                        </span>
                      </Link>
                    </div>
                  )}
                  <div className="min-w-0">
                    <ProductCard product={p} storeSlug={store.slug} priority={i < 4} />
                  </div>
                </li>
              ))}
            </ul>
            <Pagination slug={store.slug} query={query} totalPages={totalPages} shown={shown} total={total} />
          </>
        )}
      </DesktopLayout>
    </Wrap>
  );
}
