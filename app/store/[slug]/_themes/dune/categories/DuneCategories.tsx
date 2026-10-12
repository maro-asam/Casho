import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills, CollectionHero } from "../listing/DuneListing";
import { ProductGrid } from "../product/ProductCard";
import { Empty, PageTitle, PlateImage, Wrap, btn, delay, num } from "../ui";

export function DuneCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-12">
      <PageTitle
        title="كل التصنيفات"
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "التصنيفات" }]}
        note={categories.length > 0 ? `${num(categories.length)} تصنيف` : undefined}
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
        <ul data-reveal className="grid grid-cols-2 gap-x-(--dn-gap) gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="group block text-center">
                <span className="dn-crop block" style={delay(Math.min(i, 7))}>
                  <span className="dn-media block aspect-square">
                    <PlateImage src={c.image} priority={i < 4} sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" className="dn-zoom-img" />
                  </span>
                </span>
                <span className="dn-h4 mt-4 block">
                  <span className="dn-link">{c.name}</span>
                </span>
                <span className="mt-0.5 block text-xs text-(--dn-quiet)">{num(c.productCount)} منتج</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function DuneCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const crumbs = [
    { label: "الرئيسية", href: buildStoreUrl(store.slug) },
    { label: "التصنيفات", href: buildStoreUrl(store.slug, "/categories") },
    { label: category.name },
  ];
  const note = `${num(products.length)} منتج`;
  return (
    <div className="pb-12">
      {category.image && <CollectionHero image={category.image} title={category.name} crumbs={crumbs} note={note} />}
      <Wrap>
        {!category.image && <PageTitle title={category.name} crumbs={crumbs} note={note} />}
        {otherCategories.length > 0 && <CategoryPills slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} />}

        {products.length > 1 && (
          <div className="mb-8 flex min-h-14 items-center justify-between border-y border-(--dn-line)">
            <p className="text-sm text-(--dn-quiet)">{note}</p>
            <Link href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="dn-link dn-label">
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
    </div>
  );
}
