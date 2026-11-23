import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Search } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ListingViewProps } from "../../types";
import type { ProductsQuery } from "@/lib/products-query";
import { Empty, PackageGrid, PageHead, Wrap, btn, num } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** /products with some params changed (page resets unless given). */
function hrefWith(storeSlug: string, query: ProductsQuery, change: Partial<Record<"search" | "category" | "sort" | "page", string | number | null>>) {
  const params = new URLSearchParams();
  const next = { search: query.search, category: query.category, sort: query.sort === "newest" ? "" : query.sort, page: "", ...change };
  for (const [k, v] of Object.entries(next)) if (v !== null && v !== undefined && String(v) !== "" && !(k === "page" && Number(v) <= 1)) params.set(k, String(v));
  const qs = params.toString();
  return buildStoreUrl(storeSlug, `/products${qs ? `?${qs}` : ""}`);
}

const SORTS: { value: ProductsQuery["sort"]; label: () => string }[] = [
  { value: "newest", label: () => st("الأحدث") },
  { value: "price-asc", label: () => st("الأرخص") },
  { value: "price-desc", label: () => st("الأغلى") },
];

/** Every package: search, the games as chips, sort, pages. */
export default function ArenaListing({ store, products, categories, query, total, totalPages }: ListingViewProps) {
  const current = categories.find((c) => c.slug === query.category);
  return (
    <Wrap className="an-page">
      <PageHead
        title={current ? current.name : query.search ? st("نتايج «{0}»", query.search) : st("كل الباقات")}
        note={st("{0} نتيجة", num(total))}
        back={current || query.search ? { href: buildStoreUrl(store.slug, "/products"), label: st("كل الباقات") } : undefined}
      />

      <form action={buildStoreUrl(store.slug, "/products")} method="get" role="search" className="an-searchrow">
        <Search aria-hidden className="size-4 shrink-0 text-(--an-ink-3)" />
        <input name="search" type="search" defaultValue={query.search} placeholder={st("ابحث عن لعبة أو باقة…")} aria-label={st("ابحث عن لعبة أو باقة")} className="an-searchrow-input" />
        {query.category && <input type="hidden" name="category" value={query.category} />}
        <button type="submit" className="an-btn an-btn--grad an-btn--sm">
          {st("بحث")}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={hrefWith(store.slug, query, { category: null })} className="an-chip" data-on={!query.category || undefined}>
          {st("الكل")}
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={hrefWith(store.slug, query, { category: c.slug })} className="an-chip" data-on={query.category === c.slug || undefined}>
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.75rem] text-(--an-muted)">
        <span>{st("ترتيب:")}</span>
        {SORTS.map((s) => (
          <Link key={s.value} href={hrefWith(store.slug, query, { sort: s.value === "newest" ? null : s.value })} className="an-chip an-chip--sm" data-on={query.sort === s.value || undefined}>
            {s.label()}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {products.length === 0 ? (
          <Empty
            icon={<PackageSearch />}
            title={st("مفيش باقات بالشكل ده")}
            description={st("جرّب كلمة تانية أو اختار لعبة من فوق.")}
            action={
              <Link href={buildStoreUrl(store.slug, "/categories")} className={btn({ variant: "glass" })}>
                {st("شوف الألعاب")}
              </Link>
            }
          />
        ) : (
          <PackageGrid products={products} storeSlug={store.slug} />
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label={st("الصفحات")} className="mt-8 flex items-center justify-center gap-2">
          {query.page > 1 && (
            <Link href={hrefWith(store.slug, query, { page: query.page - 1 })} className="an-iconbtn" aria-label={st("الصفحة اللي قبل")}>
              <ChevronRight className="ltr:rotate-180" />
            </Link>
          )}
          <span className="an-chip an-chip--sm" data-on>
            {st("{0} من {1}", num(query.page), num(totalPages))}
          </span>
          {query.page < totalPages && (
            <Link href={hrefWith(store.slug, query, { page: query.page + 1 })} className="an-iconbtn" aria-label={st("الصفحة اللي بعد")}>
              <ChevronLeft className="ltr:rotate-180" />
            </Link>
          )}
        </nav>
      )}
    </Wrap>
  );
}
