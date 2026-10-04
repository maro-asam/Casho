import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, PackageOpen, SlidersHorizontal } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoriesIndexViewProps, CategoryLink, CategoryViewProps } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import { Container, EmptyState, PageHeader, btn } from "../ui";

const nf = new Intl.NumberFormat("ar-EG");

function CategoryTile({ category, storeSlug, priority }: { category: CategoryLink; storeSlug: string; priority?: boolean }) {
  return (
    <Link href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)} className="group block">
      <div className="c-img-bg relative grid aspect-[4/3] place-items-center overflow-hidden rounded-(--c-radius)">
        {category.image ? (
          <Image
            src={category.image}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-4xl font-bold text-muted-foreground/60">{category.name.charAt(0)}</span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h2 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug">{category.name}</h2>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{nf.format(category.productCount)} منتج</span>
      </div>
    </Link>
  );
}

export function ClassicCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "التصنيفات" }]}
        title="التصنيفات"
        meta={categories.length > 0 ? `${nf.format(categories.length)} تصنيف` : undefined}
      />

      {categories.length === 0 ? (
        <EmptyState
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
        <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-10 xl:grid-cols-5">
          {categories.map((c, i) => (
            <li key={c.id}>
              <CategoryTile category={c} storeSlug={store.slug} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

export function ClassicCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[
          { label: "الرئيسية", href: buildStoreUrl(store.slug) },
          { label: "التصنيفات", href: buildStoreUrl(store.slug, "/categories") },
          { label: category.name },
        ]}
        title={
          <span className="flex items-center gap-3 sm:gap-4">
            {category.image && (
              <span className="c-img-bg relative size-12 shrink-0 overflow-hidden rounded-(--c-radius-sm) sm:size-16">
                <Image src={category.image} alt="" fill sizes="64px" priority className="object-cover" />
              </span>
            )}
            <span className="min-w-0 break-words">{category.name}</span>
          </span>
        }
        meta={`${nf.format(products.length)} منتج`}
      >
        {products.length > 1 && (
          <Link
            href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)}
            className={btn({ variant: "outline", className: "self-start sm:self-auto" })}
          >
            <SlidersHorizontal />
            فلترة وترتيب
          </Link>
        )}
      </PageHeader>

      {otherCategories.length > 0 && (
        <nav aria-label="تصنيفات أخرى" className="mb-6 sm:mb-8">
          <ul className="c-rail c-bleed gap-2 lg:mx-0 lg:flex-wrap lg:px-0">
            {[{ ...category, current: true }, ...otherCategories.map((c) => ({ ...c, current: false }))].map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={buildStoreUrl(store.slug, `/categories/${c.slug}`)}
                  aria-current={c.current ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors",
                    c.current
                      ? "border-foreground bg-foreground font-semibold text-background"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {products.length === 0 ? (
        <EmptyState
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
    </Container>
  );
}
