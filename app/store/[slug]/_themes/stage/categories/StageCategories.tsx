import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills } from "../listing/StageListing";
import { ProductGrid } from "../product/ProductCard";
import { CategoryArt, Empty, MoreLink, PageHead, Wrap, btn, delay, num } from "../ui";

export function StageCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-16">
      <PageHead
        title="كل الأقسام."
        tagline="اختار من فين تبدأ."
        note={categories.length > 0 ? `${num(categories.length)} قسم في ${store.name}` : undefined}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "الأقسام" }]}
      />
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
        <ul className="sg-catgrid">
          {categories.map((c, i) => (
            <li key={c.id} className="sg-reveal min-w-0" style={delay(Math.min(i, 5))}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="sg-cattile group">
                <span className="sg-cattile-media">
                  <CategoryArt name={c.name} image={c.image} priority={i < 6} sizes="(max-width: 768px) 50vw, 25vw" className="sg-zoom-img" />
                </span>
                <span className="sg-cattile-copy">
                  <span className="block truncate text-[1.0625rem] font-semibold text-(--sg-ink)">{c.name}</span>
                  <span className="text-[0.8125rem] text-(--sg-label-2)">{num(c.productCount)} منتج</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function StageCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  return (
    <Wrap className="pb-16">
      <PageHead
        title={`${category.name}.`}
        tagline="اختار اللي يناسبك."
        note={`${num(products.length)} منتج`}
        crumbs={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          { label: "الأقسام", href: buildStoreUrl(store.slug, "/categories") },
          { label: category.name },
        ]}
      >
        {products.length > 1 && (
          <MoreLink href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="mt-4 text-[0.9375rem]">
            فلترة وترتيب
          </MoreLink>
        )}
      </PageHead>
      {otherCategories.length > 0 ? <CategoryPills slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} /> : <div className="h-6" />}

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
