import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageSearch, SearchX, X } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import ProductCard from "../product/ProductCard";
import { Crumbs, Empty, PageTitle, Wrap, btn, delay, num } from "../ui";
import ListingLayout from "./ListingControls";

function href(slug: string, q: Partial<ProductsQuery>) {
  return buildStoreUrl(slug, `/products${productsQueryString(q)}`);
}

/** Collection header over the category photo (parallax), title centered. */
export function CollectionHero({ image, title, crumbs, note }: { image: string; title: string; crumbs: { label: string; href?: string }[]; note: string }) {
  return (
    <header data-reveal className="relative mb-8 overflow-hidden bg-(--dn-accent) text-white">
      <div className="absolute inset-0">
        <div data-parallax className="absolute inset-x-0 -inset-y-[14%]">
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>
      <span aria-hidden className="absolute inset-0 bg-[rgb(20_20_18/0.38)]" />
      <div className="dn-wrap relative flex min-h-[18rem] flex-col items-center justify-center py-14 text-center sm:min-h-[24rem]">
        <Crumbs items={crumbs} className="dn-appear [&_li]:flex-none [&_ol]:justify-center [&_ol]:text-white/80 [&_[aria-current]]:text-white" />
        <h1 className="dn-h1 dn-appear mt-4 text-balance" style={delay(1)}>
          {title}
        </h1>
        <p className="dn-appear mt-2 text-sm opacity-85" style={delay(2)}>
          {note}
        </p>
      </div>
    </header>
  );
}

/** Sub-collection pills — one swipeable row. */
export function CategoryPills({ slug, current, categories, query }: { slug: string; current: string; categories: CategoryLink[]; query?: ProductsQuery }) {
  if (categories.length === 0) return null;
  const to = (c: string) => (query ? href(slug, { ...query, category: c, page: 1 }) : c ? buildStoreUrl(slug, `/categories/${c}`) : buildStoreUrl(slug, "/products"));
  return (
    <nav aria-label="التصنيفات" className="mb-8">
      <ul className="dn-rail dn-bleed gap-2 md:flex-wrap md:justify-center">
        {[{ id: "all", slug: "", name: "الكل" }, ...categories].map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={to(c.slug)} scroll={false} aria-current={current === c.slug ? "page" : undefined} className="dn-opt min-h-10">
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
    <div className="mb-7 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.label} href={href(slug, { ...query, ...c.remove, page: 1 })} scroll={false} aria-label={`إزالة فلتر ${c.label}`} className="dn-opt min-h-9 gap-1.5 pe-2.5 text-xs">
          <span className="max-w-48 truncate">{c.label}</span>
          <X className="size-3" />
        </Link>
      ))}
      {chips.length > 1 && (
        <Link href={href(slug, { sort: query.sort })} scroll={false} className="dn-link dn-label ms-2 text-(--dn-quiet)">
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
    <nav aria-label="الصفحات" className="mt-16 flex flex-col items-center gap-5">
      <p className="text-sm text-(--dn-quiet)">
        شفت {num(shown)} من {num(total)} منتج
      </p>
      <span className="h-px w-56 bg-(--dn-line)" aria-hidden>
        <span className="block h-full bg-(--dn-ink)" style={{ width: `${Math.round((shown / total) * 100)}%` }} />
      </span>
      <div className="flex items-center gap-1">
        {page > 1 && (
          <Link href={href(slug, { ...query, page: page - 1 })} aria-label="الصفحة السابقة" className="dn-icon [&_svg]:size-4">
            <ArrowRight className="ltr:rotate-180" />
          </Link>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`g${i}`} className="px-1 text-(--dn-quiet)" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(slug, { ...query, page: p })}
              aria-current={p === page ? "page" : undefined}
              aria-label={`الصفحة ${p}`}
              className={cn("dn-num grid size-11 place-items-center rounded-full text-lg transition-colors", p === page ? "bg-(--dn-ink) text-(--dn-bg)" : "hover:bg-(--dn-plate)")}
            >
              {num(p)}
            </Link>
          ),
        )}
        {page < totalPages && (
          <Link href={href(slug, { ...query, page: page + 1 })} aria-label="الصفحة التالية" className="dn-icon [&_svg]:size-4">
            <ArrowLeft className="ltr:rotate-180" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function DuneListing({ store, products, categories, query, total, totalPages, pageSize, priceBounds, dir, facets }: ListingViewProps) {
  const category = categories.find((c) => c.slug === query.category);
  const activeCount =
    (query.category ? 1 : 0) + (query.featured ? 1 : 0) + (query.inStock ? 1 : 0) + (query.brand ? 1 : 0) + (query.size ? 1 : 0) + (query.color ? 1 : 0) + (query.minPrice > 0 ? 1 : 0) + (query.maxPrice > 0 ? 1 : 0);
  const filtered = activeCount > 0 || !!query.search;
  const shown = Math.min(query.page * pageSize, total);
  const title = query.search ? `نتائج «${query.search}»` : category ? category.name : query.featured ? "اختيارات المتجر" : "كل المنتجات";
  const crumbs = [
    { label: "الرئيسية", href: buildStoreUrl(store.slug) },
    ...(query.search || category ? [{ label: "المنتجات", href: buildStoreUrl(store.slug, "/products") }, { label: query.search ? "البحث" : category!.name }] : [{ label: "المنتجات" }]),
  ];
  const note = total > 0 ? `${num(total)} منتج` : "مفيش نتائج";
  const promoAt = query.page === 1 && products.length >= 8 && !query.featured ? 5 : -1;

  return (
    <div className="pb-8">
      {category?.image && !query.search ? <CollectionHero image={category.image} title={title} crumbs={crumbs} note={note} /> : null}
      <Wrap>
        {!(category?.image && !query.search) && <PageTitle title={title} crumbs={crumbs} note={note} />}
        <CategoryPills slug={store.slug} current={query.category} categories={categories} query={query} />

        <ListingLayout storeSlug={store.slug} query={query} categories={categories} priceBounds={priceBounds} facets={facets} dir={dir} activeCount={activeCount} total={total}>
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
              <ul data-reveal className="dn-pgrid">
                {products.map((p, i) => (
                  <li key={p.id} className="contents">
                    {i === promoAt && (
                      <div className="dn-fade" style={delay(i)}>
                        <Link href={href(store.slug, { featured: true })} className="group flex h-full min-h-72 flex-col items-center justify-center bg-(--dn-plate) p-6 text-center">
                          <span className="dn-label text-(--dn-quiet)">مختارات</span>
                          <span className="dn-h3 mt-3">اختيارات المتجر</span>
                          <span className="mt-2 text-sm text-(--dn-quiet)">المنتجات اللي المتجر بيرشحها</span>
                          <span className="dn-link dn-label dn-link--on mt-5">شوفها</span>
                        </Link>
                      </div>
                    )}
                    <div className="min-w-0">
                      <ProductCard product={p} storeSlug={store.slug} priority={i < 4} index={i} />
                    </div>
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
