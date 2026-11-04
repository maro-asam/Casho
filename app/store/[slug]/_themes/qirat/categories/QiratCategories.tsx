import Image from "next/image";
import Link from "next/link";
import { Gem, LayoutGrid } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoriesIndexViewProps, CategoryViewProps } from "../../types";
import { CollectionTabs } from "../listing/QiratListing";
import { ProductGrid } from "../product/ProductCard";
import { CategoryArt, Empty, Kicker, Ornament, PageHead, TextLink, Wrap, btn, delay, num } from "../ui";

export function QiratCategoriesIndex({ store, categories }: CategoriesIndexViewProps) {
  return (
    <Wrap className="pb-20">
      <PageHead
        kicker={store.name}
        title="المجموعات"
        note={categories.length > 0 ? `${num(categories.length)} مجموعة` : undefined}
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(store.slug) }, { label: "المجموعات" }]}
      />
      {categories.length === 0 ? (
        <Empty
          icon={<LayoutGrid />}
          title="مفيش مجموعات لسه"
          description="تقدر تتصفح كل القطع مباشرةً."
          action={
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
              كل القطع
            </Link>
          }
        />
      ) : (
        <ul className="qr-catgrid">
          {categories.map((c, i) => (
            <li key={c.id} className="qr-reveal min-w-0" style={delay(Math.min(i, 5))}>
              <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="qr-cattile group">
                <span className="qr-frame qr-cattile-media">
                  <CategoryArt name={c.name} image={c.image} priority={i < 6} sizes="(max-width: 768px) 50vw, 25vw" className="qr-zoom" />
                </span>
                <span className="qr-h3 mt-4 block truncate">{c.name}</span>
                <span className="mt-1 block text-xs text-(--qr-ink-2)">{num(c.productCount)} قطعة</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function QiratCategory({ store, category, products, otherCategories }: CategoryViewProps) {
  const crumbs = [
    { label: "الرئيسية", href: buildStoreUrl(store.slug) },
    { label: "المجموعات", href: buildStoreUrl(store.slug, "/categories") },
    { label: category.name },
  ];
  return (
    <div className="pb-20">
      {category.image ? (
        <section className="qr-cathero" data-tone="velvet">
          <Image src={category.image} alt="" fill priority sizes="100vw" className="object-cover" />
          <span aria-hidden className="qr-shade" />
          <div className="qr-wrap qr-cathero-copy">
            <Kicker className="qr-rise">المجموعة</Kicker>
            <h1 className="qr-display qr-rise mt-2 text-balance">{category.name}</h1>
            <Ornament className="qr-rise mt-5" />
            <p className="qr-rise mt-4 text-sm text-(--qr-ink-2)">{num(products.length)} قطعة</p>
          </div>
        </section>
      ) : null}
      <Wrap>
        {category.image ? (
          <div className="pt-6" />
        ) : (
          <PageHead kicker="المجموعة" title={category.name} note={`${num(products.length)} قطعة`} crumbs={crumbs} />
        )}
        {otherCategories.length > 0 && <CollectionTabs slug={store.slug} current={category.slug} categories={[category, ...otherCategories]} />}
        {products.length > 1 && (
          <div className="mb-8 flex justify-center">
            <TextLink href={buildStoreUrl(store.slug, `/products?category=${encodeURIComponent(category.slug)}`)}>فلترة وترتيب</TextLink>
          </div>
        )}
        {products.length === 0 ? (
          <Empty
            icon={<Gem />}
            title="المجموعة دي فاضية دلوقتي"
            description="لسه مفيش قطع هنا. شوف باقي المجموعة."
            action={
              <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
                كل القطع
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
