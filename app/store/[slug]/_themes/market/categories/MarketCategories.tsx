import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills } from "../listing/MarketListing";
import { ProductGrid } from "../product/ProductCard";
import { AisleArt, Empty, PageHead, Wrap, btn, delay, num } from "../ui";

export function MarketCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-12">
      <PageHead
        title="كل الأقسام"
        note={categories.length > 0 ? `${num(categories.length)} قسم — اختار القسم اللي محتاجه` : undefined}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "الأقسام" }]}
      />
      <div className="h-6" />
      {categories.length === 0 ? (
        <Empty
          icon={<LayoutGrid />}
          title="مفيش أقسام لسه"
          description="تقدر تتصفح كل المنتجات مباشرةً."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              تصفح المنتجات
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-(--mk-gap) sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id} className="mk-reveal min-w-0" style={delay(Math.min(i, 5))}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="mk-aisle-tile group">
                {c.image ? (
                  <span className="mk-aisle-art relative block overflow-hidden">
                    <Image src={c.image} alt="" fill priority={i < 6} sizes="76px" className="object-cover" />
                  </span>
                ) : (
                  <AisleArt name={c.name} />
                )}
                <span className="mt-1 line-clamp-2 font-semibold text-(--mk-ink)">{c.name}</span>
                <span className="text-[0.8125rem] text-(--mk-label-2)">{num(c.productCount)} منتج</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function MarketCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const note = `${num(products.length)} منتج`;
  return (
    <Wrap className="pb-12">
      <PageHead
        title={category.name}
        note={note}
        image={category.image}
        iconFor={category.name}
        crumbs={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          { label: "الأقسام", href: buildStoreUrl(store.slug, "/categories") },
          { label: category.name },
        ]}
      />
      {otherCategories.length > 0 ? <CategoryPills slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} /> : <div className="h-6" />}

      {products.length > 1 && (
        <div className="mk-panel mb-5 flex min-h-14 items-center justify-between gap-3 px-4">
          <p className="text-sm">{note}</p>
          <Link href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="mk-link text-sm">
            فلترة وترتيب
          </Link>
        </div>
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
        <ProductGrid products={products} storeSlug={store.slug} priorityCount={4} />
      )}
    </Wrap>
  );
}
