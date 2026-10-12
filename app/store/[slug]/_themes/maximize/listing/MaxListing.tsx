import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, SearchX, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import ProductCard from "../product/ProductCard";
import { CollectionBanner, Crumbs, Empty, Wrap, btn, num } from "../ui";
import ListingLayout from "./ListingControls";

function href(slug: string, q: Partial<ProductsQuery>) {
  return buildStoreUrl(slug, `/products${productsQueryString(q)}`);
}

/** Related collections as a row of pills. */
export function CategoryPills({ slug, current, categories, query }: { slug: string; current: string; categories: CategoryLink[]; query?: ProductsQuery }) {
  if (categories.length === 0) return null;
  const to = (c: string) => (query ? href(slug, { ...query, category: c, page: 1 }) : c ? buildStoreUrl(slug, `/categories/${c}`) : buildStoreUrl(slug, "/products"));
  return (
    <nav aria-label="التصنيفات" className="mb-5">
      <ul className="mx-rail mx-bleed gap-2">
        {[{ id: "all", slug: "", name: "الكل" }, ...categories].map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={to(c.slug)} scroll={false} aria-current={current === c.slug ? "page" : undefined} className="mx-opt min-h-10 rounded-full">
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
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={href(slug, { ...query, ...c.remove, page: 1 })}
          scroll={false}
          aria-label={`إزالة فلتر ${c.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-(--mx-band) pe-2.5 ps-3.5 text-[0.8125rem] font-medium text-(--mx-ink) transition-colors hover:bg-(--mx-tint)"
        >
          <span className="max-w-48 truncate">{c.label}</span>
          <X className="size-3.5" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link href={href(slug, { sort: query.sort })} scroll={false} className="ms-1 text-sm font-semibold text-(--mx-link) hover:underline">
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
  const cell = "grid size-10 place-items-center rounded-(--mx-r-sm) text-sm font-semibold transition-colors";
  return (
    <nav aria-label="الصفحات" className="mt-12 flex flex-col items-center gap-4">
      <p className="text-sm">
        شفت {num(shown)} من {num(total)} منتج
      </p>
      <span className="h-1 w-56 overflow-hidden rounded-full bg-(--mx-line)" aria-hidden>
        <span className="block h-full rounded-full bg-(--mx-btn)" style={{ width: `${Math.round((shown / total) * 100)}%` }} />
      </span>
      <div className="flex items-center gap-1">
        {page > 1 && (
          <Link href={href(slug, { ...query, page: page - 1 })} aria-label="الصفحة السابقة" className={cn(cell, "border border-(--mx-line) hover:border-(--mx-ink)")}>
            <ChevronRight className="size-4 ltr:rotate-180" />
          </Link>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`g${i}`} className="px-1 text-(--mx-quiet)" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(slug, { ...query, page: p })}
              aria-current={p === page ? "page" : undefined}
              aria-label={`الصفحة ${p}`}
              className={cn(cell, p === page ? "bg-(--mx-btn) text-(--mx-btn-ink)" : "text-(--mx-ink) hover:bg-(--mx-band)")}
            >
              {num(p)}
            </Link>
          ),
        )}
        {page < totalPages && (
          <Link href={href(slug, { ...query, page: page + 1 })} aria-label="الصفحة التالية" className={cn(cell, "border border-(--mx-line) hover:border-(--mx-ink)")}>
            <ChevronLeft className="size-4 ltr:rotate-180" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function MaxListing({ store, products, categories, query, total, totalPages, pageSize, priceBounds, dir, facets }: ListingViewProps) {
  const category = categories.find((c) => c.slug === query.category);
  const activeCount =
    (query.category ? 1 : 0) + (query.featured ? 1 : 0) + (query.inStock ? 1 : 0) + (query.brand ? 1 : 0) + (query.size ? 1 : 0) + (query.color ? 1 : 0) + (query.minPrice > 0 ? 1 : 0) + (query.maxPrice > 0 ? 1 : 0);
  const filtered = activeCount > 0 || !!query.search;
  const shown = Math.min(query.page * pageSize, total);
  const title = query.search ? `نتائج البحث عن «${query.search}»` : category ? category.name : query.featured ? "اختيارات المتجر" : "كل المنتجات";
  const crumbs = [
    { label: "الرئيسية", href: buildStoreUrl(store.slug) },
    ...(query.search || category ? [{ label: "المنتجات", href: buildStoreUrl(store.slug, "/products") }, { label: query.search ? "البحث" : category!.name }] : [{ label: "المنتجات" }]),
  ];

  return (
    <div className="pb-8">
      <Wrap>
        <CollectionBanner title={title} note={total > 0 ? `${num(total)} منتج` : "مفيش نتائج"} image={!query.search ? category?.image : null} />
        <Crumbs items={crumbs} className="py-4" />
        <CategoryPills slug={store.slug} current={query.category} categories={categories} query={query} />

        <ListingLayout storeSlug={store.slug} query={query} categories={categories} priceBounds={priceBounds} facets={facets} dir={dir} activeCount={activeCount} total={total}>
          <ActiveChips slug={store.slug} query={query} categoryName={category?.name} />
          {products.length === 0 ? (
            filtered ? (
              <Empty
                icon={<SearchX />}
                title={query.search ? `مفيش نتائج لـ «${query.search}»` : "مفيش منتجات بالفلاتر دي"}
                description={query.search ? "اتأكد من الكتابة أو جرّب كلمة أبسط." : "جرّب تشيل فلتر أو اتنين عشان تشوف منتجات أكتر."}
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
              <ul className="mx-pgrid">
                {products.map((p, i) => (
                  <li key={p.id} className="min-w-0">
                    <ProductCard product={p} storeSlug={store.slug} priority={i < 4} index={i} />
                  </li>
                ))}
              </ul>
              <Pagination slug={store.slug} query={query} totalPages={totalPages} shown={shown} total={total} />
            </>
          )}
        </ListingLayout>
      </Wrap>
    </div>
  );
}
