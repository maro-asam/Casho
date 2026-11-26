import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { BeanIcon } from "../icons";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CollectionTabs } from "../listing/BunnListing";
import { ProductGrid } from "../product/ProductCard";
import { CategoryArt, Crumbs, Empty, Kicker, PageHead, TextLink, Wrap, btn, delay, num } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

/** Every section as a cup seen from above on its saucer, with its count and
 *  starting price on a label under it. */
export function BunnCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-20">
      <PageHead
        kicker={store.name}
        title={st("الأقسام")}
        note={categories.length > 0 ? st("عدد الأقسام: {0}", num(categories.length)) : undefined}
        crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(store.slug) }, { label: st("الأقسام") }]}
      />
      {categories.length === 0 ? (
        <Empty
          icon={<LayoutGrid />}
          title={st("مفيش أقسام لسه")}
          description={st("تقدر تتصفح كل المنتجات مباشرةً.")}
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              {st("كل المنتجات")}
            </Link>
          }
        />
      ) : (
        <ul className="bn-catgrid">
          {categories.map((c, i) => (
            <li key={c.id} className="bn-reveal min-w-0" style={delay(Math.min(i, 5))}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="bn-cupitem group">
                <span className="bn-cup">
                  <span className="bn-cup-art">
                    <CategoryArt name={c.name} image={c.image} priority={i < 6} sizes="(max-width: 768px) 45vw, 22vw" className="bn-zoom" />
                  </span>
                </span>
                <span className="bn-display mt-5 block truncate text-center text-lg text-(--bn-ink)">{c.name}</span>
                <span className="mt-1 block text-center text-xs text-(--bn-ink-2)">
                  {st("{0} منتج", num(c.productCount))}
                  {c.fromPrice ? ` · ${st("من {0}", formatPrice(c.fromPrice))}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function BunnCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const crumbs = [
    { label: st("الرئيسية"), href: buildStoreUrl(store.slug) },
    { label: st("الأقسام"), href: buildStoreUrl(store.slug, "/categories") },
    { label: category.name },
  ];
  return (
    <div className="pb-20">
      {category.image ? (
        <section className="bn-cathero">
          <Wrap className="bn-cathero-grid">
            <div className="min-w-0">
              <Crumbs items={crumbs} className="mb-6" />
              <Kicker className="bn-rise">{st("القسم")}</Kicker>
              <h1 className="bn-display-xl bn-rise mt-2 text-balance">{category.name}</h1>
              <p className="bn-rise mt-3 text-sm text-(--bn-ink-2)">{st("{0} منتج", num(products.length))}</p>
            </div>
            <span className="bn-cup bn-cup--lg bn-rise" style={delay(1)}>
              <span className="bn-cup-art">
                <Image src={category.image} alt="" fill priority sizes="(max-width: 768px) 60vw, 22rem" className="object-cover" />
              </span>
            </span>
          </Wrap>
        </section>
      ) : null}
      <Wrap>
        {!category.image && <PageHead kicker={st("القسم")} title={category.name} note={st("{0} منتج", num(products.length))} crumbs={crumbs} />}
        {otherCategories.length > 0 && <CollectionTabs slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} />}
        {products.length > 1 && (
          <div className="mb-8 flex">
            <TextLink href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)}>{st("فلترة وترتيب")}</TextLink>
          </div>
        )}
        {products.length === 0 ? (
          <Empty
            icon={<BeanIcon />}
            title={st("القسم ده فاضي دلوقتي")}
            description={st("لسه مفيش منتجات هنا. شوف باقي الأقسام.")}
            action={
              <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
                {st("كل المنتجات")}
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
