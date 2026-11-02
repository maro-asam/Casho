import Link from "next/link";
import { LayoutGrid, PackageOpen } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CategoryPills } from "../listing/GymListing";
import { ProductGrid } from "../product/ProductCard";
import { CategoryArt, Empty, PageHead, Wrap, btn, delay, num } from "../ui";

export function GymCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
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
        <ul className="grid grid-cols-2 gap-(--gy-gap) sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id} className="gy-reveal" style={delay(Math.min(i, 5))}>
              <Link
                href={buildStoreUrl(store.slug, `/categories/${c.slug}`)}
                className="group flex h-full flex-col items-center rounded-(--gy-r) border border-(--gy-line) bg-(--gy-card) p-4 text-center transition-[border-color,box-shadow] hover:border-(--gy-btn) hover:shadow-(--gy-shadow-sm)"
              >
                <span className="gy-wplate-hub !w-24 sm:!w-28">
                  <CategoryArt name={c.name} image={c.image} priority={i < 6} sizes="112px" className="gy-zoom-img" />
                </span>
                <span className="mt-3 line-clamp-2 font-extrabold text-(--gy-ink) group-hover:text-(--gy-link)">{c.name}</span>
                <span className="mt-0.5 text-xs text-(--gy-quiet)">{num(c.productCount)} منتج</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function GymCategory({ store, category, products, otherCategories }: CategoryViewProps) {
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
        <div className="gy-panel mb-5 flex min-h-14 items-center justify-between gap-3 px-4">
          <p className="text-sm">{note}</p>
          <Link href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)} className="gy-link text-sm">
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
