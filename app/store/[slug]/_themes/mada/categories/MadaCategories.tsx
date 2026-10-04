import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, PackageOpen, SlidersHorizontal } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryChips } from "../listing/MadaListing";
import { ProductGrid } from "../product/ProductCard";
import { Arrow, Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";

export function MadaCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-8">
      <header className="pb-8 pt-5 sm:pt-7">
        <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "التصنيفات" }]} />
        <h1 className="md-h1 mt-4">كل التصنيفات</h1>
        {categories.length > 0 && <p className="mt-2 text-sm text-(--md-quiet)">{num(categories.length)} تصنيف — اختار واحد وابدأ</p>}
      </header>
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="md-media group block aspect-[4/5]">
                <PlateImage src={c.image} priority={i < 4} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="transition-transform duration-700 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.72),transparent_55%)]" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                  <span className="min-w-0">
                    <span className="md-face block truncate text-base font-bold sm:text-lg">{c.name}</span>
                    <span className="text-xs opacity-80">{num(c.productCount)} منتج</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#121714] transition-transform group-hover:scale-110">
                    <Arrow />
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={buildStoreUrl(store.slug, "/products")} className="group flex aspect-[4/5] flex-col justify-end rounded-(--md-radius) bg-(--md-brand) p-5 text-(--md-brand-ink)">
              <span className="md-face text-lg font-bold">كل المنتجات</span>
              <span className="mt-3 grid size-9 place-items-center rounded-full bg-(--md-signal) text-(--md-signal-ink) transition-transform group-hover:scale-110">
                <Arrow />
              </span>
            </Link>
          </li>
        </ul>
      )}
    </Wrap>
  );
}

export function MadaCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  return (
    <Wrap className="pb-8">
      <div className="pt-5 sm:pt-7">
        <Crumbs
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: "التصنيفات", href: buildStoreUrl(store.slug, "/categories") },
            { label: category.name },
          ]}
        />
      </div>
      {category.image ? (
        <header className="relative mb-8 mt-4 overflow-hidden rounded-[1.75rem]">
          <div className="relative aspect-[16/10] sm:aspect-[21/8]">
            <Image src={category.image} alt="" fill priority sizes="100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.75),transparent_65%)]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-10">
            <span className="md-eyebrow">تصنيف</span>
            <h1 className="md-h1 mt-3">{category.name}</h1>
            <p className="mt-1 text-sm opacity-80">{num(products.length)} منتج</p>
          </div>
        </header>
      ) : (
        <header className="mb-8 mt-4">
          <h1 className="md-h1">{category.name}</h1>
          <p className="mt-2 text-sm text-(--md-quiet)">{num(products.length)} منتج</p>
        </header>
      )}

      {otherCategories.length > 0 && <CategoryChips slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} />}

      {products.length > 1 && (
        <div className="mb-6 flex items-center justify-end gap-4 border-b border-(--md-line) pb-4">
          <Link href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className={btn({ variant: "outline", size: "sm", className: "bg-(--md-surface)" })}>
            <SlidersHorizontal />
            فلترة وترتيب
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <Empty
          icon={<PackageOpen />}
          title="التصنيف ده فاضي دلوقتي"
          description="لسه مفيش منتجات هنا. شوف باقي منتجات المتجر."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              تصفح كل المنتجات
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products} storeSlug={store.slug} priorityCount={4} />
      )}
    </Wrap>
  );
}
