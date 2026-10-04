import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { RuledGrid } from "../product/ProductCard";
import { Arrow, Crumbs, Empty, PageTitle, Wrap, btn, idx, monogram, num } from "../ui";

/** The categories page reads like a table of contents: numbered rows with
 *  big names; the arch thumbnail floats in on hover (always shown on phones). */
export function RiwaqCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-6">
      <PageTitle
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "التصنيفات" }]}
        title="الفهرس"
        count={categories.length}
        intro={categories.length > 0 ? "كل أقسام المتجر في مكان واحد. اختار القسم وابدأ." : undefined}
      />

      {categories.length === 0 ? (
        <Empty
          icon={<LayoutGrid />}
          title="مفيش تصنيفات لسه"
          description="تقدر تتصفح كل المنتجات مباشرةً."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              تصفح المنتجات
            </Link>
          }
        />
      ) : (
        <ol className="border-t border-(--rq-ink)">
          {categories.map((c, i) => (
            <li key={c.id} className="border-b border-(--rq-rule)">
              <Link
                href={buildStoreUrl(store.slug, `/categories/${c.slug}`)}
                className="group relative grid min-h-24 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-4 py-4 sm:min-h-28 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-8"
              >
                <span className="rq-num w-7 text-sm text-(--rq-accent)">{idx(i + 1)}</span>
                <span className="rq-arch relative grid h-16 w-12 shrink-0 place-items-center pt-2 sm:hidden">
                  {c.image ? (
                    <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="rq-face text-xl font-semibold text-(--rq-accent)">{monogram(c.name)}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="rq-h2 block truncate transition-colors duration-(--rq-dur) group-hover:text-(--rq-accent)">
                    {c.name}
                  </span>
                </span>
                <span className="flex items-center gap-4 sm:gap-8">
                  <span className="rq-caption whitespace-nowrap">{num(c.productCount)} قطعة</span>
                  <Arrow className="text-xl" />
                </span>
                {c.image && (
                  <span
                    aria-hidden
                    className="rq-arch pointer-events-none absolute end-40 top-1/2 hidden h-36 w-28 -translate-y-1/2 scale-90 opacity-0 transition-[opacity,transform] duration-(--rq-dur) ease-(--rq-ease-out) group-hover:scale-100 group-hover:opacity-100 sm:block"
                  >
                    <Image src={c.image} alt="" fill sizes="112px" className="object-cover" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Wrap>
  );
}

export function RiwaqCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const siblings = [{ ...category, current: true }, ...otherCategories.map((c) => ({ ...c, current: false }))];

  return (
    <Wrap className="pb-6">
      <header className="pb-8 pt-5 sm:pb-12 sm:pt-8">
        <Crumbs
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: "التصنيفات", href: buildStoreUrl(store.slug, "/categories") },
            { label: category.name },
          ]}
        />
        <div className="mt-6 grid grid-cols-1 items-end gap-6 sm:mt-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-12">
          <div className="min-w-0">
            <p className="rq-label text-(--rq-accent)">تصنيف</p>
            <h1 className="rq-display mt-2 break-words">{category.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <p className="rq-caption">{num(products.length)} قطعة في القسم ده</p>
              {products.length > 1 && (
                <Link
                  href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)}
                  className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
                >
                  <span className="rq-link">فلترة وترتيب</span>
                  <Arrow />
                </Link>
              )}
            </div>
          </div>
          {category.image && (
            <span className="rq-arch rq-arch--line rq-wipe relative ms-auto block h-48 w-36 sm:h-64 sm:w-48">
              <Image src={category.image} alt="" fill priority sizes="192px" className="object-cover" />
            </span>
          )}
        </div>
      </header>

      {otherCategories.length > 0 && (
        <nav aria-label="تصنيفات أخرى" className="mb-8">
          <ul className="rq-rail rq-bleed gap-2 lg:mx-0 lg:flex-wrap lg:px-0">
            {siblings.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={buildStoreUrl(store.slug, `/categories/${c.slug}`)}
                  aria-current={c.current ? "page" : undefined}
                  className={cn("rq-opt text-sm")}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {products.length === 0 ? (
        <Empty
          icon={<PackageOpen />}
          title="القسم ده فاضي دلوقتي"
          description="لسه مفيش منتجات هنا. شوف باقي منتجات المتجر."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              تصفح كل المنتجات
            </Link>
          }
        />
      ) : (
        <RuledGrid products={products} storeSlug={store.slug} priorityCount={4} />
      )}
    </Wrap>
  );
}
