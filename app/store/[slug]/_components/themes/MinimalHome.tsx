import Link from "next/link";
import Image from "next/image";
import { ArrowUpLeft, ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import { type SectionContentMap } from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Minimal Section Label ────────────────────────────────────────
function MinimalLabel({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-8 flex items-center justify-between" dir="rtl">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
        {title}
      </span>
      <Link
        href={href}
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-neutral-900"
      >
        الكل
        <ArrowUpLeft className="size-3" />
      </Link>
    </div>
  );
}

// ─── Minimal Hero — pure typography, no background image ─────────
function MinimalHero({ store }: Pick<StoreHomeProps, "store">) {
  const banner = store.banners[0];

  // If there's a banner — show it as a clean full-width image, no overlay
  if (banner?.image) {
    return (
      <section className="relative aspect-[16/6] w-full overflow-hidden">
        <Image
          src={banner.image}
          alt={store.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </section>
    );
  }

  // Otherwise — pure typographic hero
  return (
    <section className="border-b py-20 text-center sm:py-28" dir="rtl">
      {store.settings?.description && (
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
          {store.settings.description}
        </p>
      )}
      <h1 className="text-5xl font-light tracking-tight text-neutral-900 sm:text-7xl md:text-8xl">
        {store.name}
      </h1>
      <div className="mt-8 flex items-center justify-center gap-6">
        <Link
          href={buildStoreUrl(store.slug, "/products")}
          className="text-xs font-medium uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-50"
        >
          تسوق الآن
        </Link>
        {store.categories.length > 0 && (
          <>
            <span className="text-neutral-300">|</span>
            <Link
              href={buildStoreUrl(store.slug, "/categories")}
              className="text-xs font-medium uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-50"
            >
              التصنيفات
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Minimal Category Pill — text only ───────────────────────────
function MinimalCategoryPill({
  category,
  storeSlug,
}: {
  category: StoreHomeProps["store"]["categories"][number];
  storeSlug: string;
}) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      className="shrink-0 border border-neutral-200 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-600 transition-all hover:border-neutral-900 hover:text-neutral-900"
    >
      {category.name}
    </Link>
  );
}

// ─── Minimal Product Card — clean, no shadows, image dominant ────
function MinimalProductCard({
  product,
  storeSlug,
}: {
  product: StoreHomeProps["store"]["products"][number];
  storeSlug: string;
}) {
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
      className="group flex flex-col"
    >
      {/* Image — aspect ratio from merchant layout setting */}
      <div className="relative overflow-hidden bg-neutral-50" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            style={{ transitionDuration: "var(--store-motion, 250ms)" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
        {hasDiscount && (
          <span className="absolute left-0 top-3 bg-neutral-900 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white">
            Sale
          </span>
        )}
      </div>

      {/* Info — ultra minimal */}
      <div className="mt-3 space-y-1" dir="rtl">
        <p className="truncate text-xs font-medium leading-snug text-neutral-900">
          {product.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-700">
            {(product.price / 100).toLocaleString("ar-EG")} ج.م
          </span>
          {hasDiscount && product.compareAtPrice && (
            <span className="text-[10px] text-neutral-400 line-through">
              {(product.compareAtPrice / 100).toLocaleString("ar-EG")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function MinimalDivider() {
  return <div className="h-px bg-neutral-100" />;
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyProducts({ storeSlug }: { storeSlug: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-4 border border-dashed border-neutral-200 py-16 text-center">
      <ShoppingBag className="size-7 text-neutral-300" />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
          لا توجد منتجات بعد
        </p>
      </div>
      <Link
        href={buildStoreUrl(storeSlug, "/products")}
        className="text-[11px] font-medium uppercase tracking-widest underline underline-offset-4 text-neutral-400 hover:text-neutral-900"
      >
        تصفح المتجر
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
type MinimalHomeProps = StoreHomeProps & { sectionContent?: SectionContentMap };

export default function MinimalHome({ store, sections, sectionContent = {} }: MinimalHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 15);
  const categories = store.categories.slice(0, 12);

  const funnelSections = [
    sections.showOfferStrip && (
      <SectionRenderer key="showOfferStrip" sectionKey="showOfferStrip" store={store} sectionContent={sectionContent} categories={store.categories} bestSellers={store.bestSellers} />
    ),
    sections.showSocialProof && <SectionRenderer key="showSocialProof" sectionKey="showSocialProof" store={store} sectionContent={sectionContent} />,
    sections.showBestSellers && <SectionRenderer key="showBestSellers" sectionKey="showBestSellers" store={store} sectionContent={sectionContent} bestSellers={store.bestSellers} />,
    sections.showCollections && <SectionRenderer key="showCollections" sectionKey="showCollections" store={store} sectionContent={sectionContent} categories={store.categories} />,
    sections.showWhyChooseUs && <SectionRenderer key="showWhyChooseUs" sectionKey="showWhyChooseUs" store={store} sectionContent={sectionContent} />,
    sections.showTestimonials && <SectionRenderer key="showTestimonials" sectionKey="showTestimonials" store={store} sectionContent={sectionContent} />,
    sections.showUrgency && <SectionRenderer key="showUrgency" sectionKey="showUrgency" store={store} sectionContent={sectionContent} />,
    sections.showAboutBrand && <SectionRenderer key="showAboutBrand" sectionKey="showAboutBrand" store={store} sectionContent={sectionContent} />,
    sections.showNewsletter && <SectionRenderer key="showNewsletter" sectionKey="showNewsletter" store={store} sectionContent={sectionContent} />,
  ].filter(Boolean);

  return (
    <div dir="rtl">
      {/* Offer strip — full width before hero */}
      {sections.showOfferStrip && (
        <SectionRenderer sectionKey="showOfferStrip" store={store} sectionContent={sectionContent} />
      )}

      {/* Hero */}
      {sections.showHero && <MinimalHero store={store} />}

      <div className="mx-auto w-full max-w-screen-xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        {/* Categories — text pills */}
        {sections.showCategories && categories.length > 0 && (
          <section>
            <MinimalLabel title="التصنيفات" href={buildStoreUrl(store.slug, "/categories")} />
            <div className="flex flex-wrap gap-2" dir="rtl">
              {categories.map((cat) => (
                <MinimalCategoryPill key={cat.id} category={cat} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        )}

        {sections.showCategories && categories.length > 0 && <MinimalDivider />}

        {/* Featured Products */}
        {sections.showFeaturedProducts && featuredProducts.length > 0 && (
          <section>
            <MinimalLabel title="المميزة" href={buildStoreUrl(store.slug, "/products")} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 store-product-grid">
              {featuredProducts.map((product) => (
                <MinimalProductCard key={product.id} product={product} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        )}

        {sections.showFeaturedProducts && featuredProducts.length > 0 && <MinimalDivider />}

        {/* Latest Products */}
        {sections.showLatestProducts && (
          latestProducts.length === 0 ? (
            <EmptyProducts storeSlug={store.slug} />
          ) : (
            <section>
              <MinimalLabel title="الجديد" href={buildStoreUrl(store.slug, "/products")} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 store-product-grid">
                {latestProducts.map((product) => (
                  <MinimalProductCard key={product.id} product={product} storeSlug={store.slug} />
                ))}
              </div>
            </section>
          )
        )}

        {/* Funnel sections */}
        {funnelSections.filter((s) => s && (s as React.ReactElement).key !== "showOfferStrip")}
      </div>
    </div>
  );
}
