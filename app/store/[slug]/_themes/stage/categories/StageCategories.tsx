import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills } from "../listing/StageListing";
import { ProductGrid } from "../product/ProductCard";
import { CategoryArt, Empty, MoreLink, PageHead, Wrap, btn, delay, num } from "../ui";
import { st } from "@/lib/i18n/storefront";

export function StageCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-16">
      <PageHead
        title={st("كل الأقسام.")}
        tagline={st("اختار من فين تبدأ.")}
        note={categories.length > 0 ? st("{0} قسم في {1}", num(categories.length), store.name) : undefined}
        crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("الأقسام") }]}
      />
      {categories.length === 0 ? (
        <Empty
          icon={<LayoutGrid />}
          title={st("مفيش أقسام لسه")}
          description={st("تقدر تتصفح كل المنتجات مباشرةً.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              {st("تصفح المنتجات")}
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
                  <span className="text-[0.8125rem] text-(--sg-label-2)">{st("{0} منتج", num(c.productCount))}</span>
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
        tagline={st("اختار اللي يناسبك.")}
        note={st("{0} منتج", num(products.length))}
        crumbs={[
          { label: st("الرئيسية"), href: buildStoreUrl(store.slug) },
          { label: st("الأقسام"), href: buildStoreUrl(store.slug, "/categories") },
          { label: category.name },
        ]}
      >
        {products.length > 1 && (
          <MoreLink href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="mt-4 text-[0.9375rem]">
            {st("فلترة وترتيب")}
          </MoreLink>
        )}
      </PageHead>
      {otherCategories.length > 0 ? <CategoryPills slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} /> : <div className="h-6" />}

      {products.length === 0 ? (
        <Empty
          icon={<PackageOpen />}
          title={st("القسم ده فاضي دلوقتي")}
          description={st("لسه مفيش منتجات هنا. شوف باقي منتجات المتجر.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              {st("تصفح كل المنتجات")}
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products} storeSlug={store.slug} priorityCount={4} />
      )}
    </Wrap>
  );
}
