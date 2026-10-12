import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills } from "../listing/CelloListing";
import { ProductGrid } from "../product/ProductCard";
import { CollectionBanner, Crumbs, Empty, PlateImage, Wrap, btn, delay, num } from "../ui";

export function CelloCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-12">
      <CollectionBanner title="كل التصنيفات" note={categories.length > 0 ? `${num(categories.length)} تصنيف` : undefined} />
      <Crumbs className="py-4" items={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "التصنيفات" }]} />
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
        <ul className="grid grid-cols-2 gap-(--ce-gap) md:grid-cols-4 xl:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id} className="ce-reveal" style={delay(Math.min(i, 5))}>
              <Link
                href={buildStoreUrl(store.slug, `/categories/${c.slug}`)}
                className="group flex h-full flex-col rounded-(--ce-r) border border-(--ce-line) p-2.5 transition-[box-shadow,border-color] hover:border-transparent hover:shadow-(--ce-shadow-sm)"
              >
                <span className="ce-media block aspect-square rounded-(--ce-r-sm)">
                  <PlateImage src={c.image} priority={i < 6} sizes="(max-width: 768px) 45vw, (max-width: 1280px) 24vw, 16vw" fit="cover" className="ce-zoom-img" />
                </span>
                <span className="mt-2.5 truncate px-1 font-semibold text-(--ce-ink) group-hover:text-(--ce-link)">{c.name}</span>
                <span className="px-1 text-xs text-(--ce-quiet)">{num(c.productCount)} منتج</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function CelloCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const note = `${num(products.length)} منتج`;
  return (
    <Wrap className="pb-12">
      <CollectionBanner title={category.name} note={note} image={category.image} />
      <Crumbs
        className="py-4"
        items={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          { label: "التصنيفات", href: buildStoreUrl(store.slug, "/categories") },
          { label: category.name },
        ]}
      />
      {otherCategories.length > 0 && <CategoryPills slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} />}

      {products.length > 1 && (
        <div className="mb-6 flex min-h-14 items-center justify-between gap-3 rounded-(--ce-r) border border-(--ce-line) px-4">
          <p className="text-sm">{note}</p>
          <Link href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="text-sm font-semibold text-(--ce-link) hover:underline">
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
