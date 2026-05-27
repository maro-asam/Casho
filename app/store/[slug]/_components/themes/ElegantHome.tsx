import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import StoreBanner from "../StoreBanner";
import {
  DEFAULT_SECTION_ORDER,
  type SectionKey,
  type SectionContentMap,
} from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Elegant Section Header — centered with decorative lines ─────
function ElegantSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-10 flex flex-col items-center gap-3 text-center">
      <div className="flex w-full items-center gap-4">
        <span className="h-px flex-1" style={{ background: "var(--store-border)" }} />
        <h2
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "var(--store-primary)" }}
        >
          {title}
        </h2>
        <span className="h-px flex-1" style={{ background: "var(--store-border)" }} />
      </div>
      <Link
        href={href}
        className="text-[11px] font-medium uppercase tracking-widest underline-offset-4 hover:underline"
        style={{ color: "var(--store-muted-foreground, #64748b)" }}
      >
        عرض الكل
      </Link>
    </div>
  );
}

// ─── Elegant Hero — full viewport, centered text ─────────────────
function ElegantHero({ store }: Pick<StoreHomeProps, "store">) {
  const banner = store.banners[0];
  const coverSrc = banner?.image || store.settings?.coverImage;

  return (
    <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden">
      {/* Background */}
      {coverSrc ? (
        <Image
          src={coverSrc}
          alt={store.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--store-muted) 0%, color-mix(in srgb, var(--store-primary) 15%, var(--store-background)) 100%)",
          }}
        />
      )}

      {/* Overlay */}
      {coverSrc && (
        <div
          className="absolute inset-0"
          style={{ background: "var(--store-hero-overlay)" }}
        />
      )}

      {/* Content — centered */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6 py-20 text-center"
        dir="rtl"
      >
        {store.settings?.description && (
          <p
            className="text-xs font-medium uppercase tracking-[0.3em]"
            style={{ color: coverSrc ? "rgba(255,255,255,0.75)" : "var(--store-primary)" }}
          >
            {store.settings.description}
          </p>
        )}

        <h1
          className="max-w-3xl text-5xl font-light leading-tight tracking-wide md:text-7xl"
          style={{ color: coverSrc ? "#ffffff" : "var(--foreground, #0a0d1a)" }}
        >
          {store.name}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            asChild
            size="lg"
            className="rounded-none border border-current bg-transparent px-10 font-light uppercase tracking-widest transition-all duration-300 hover:bg-white hover:text-black"
            style={{
              color: coverSrc ? "#ffffff" : "var(--store-primary)",
              borderColor: coverSrc ? "rgba(255,255,255,0.7)" : "var(--store-primary)",
            }}
          >
            <Link href={buildStoreUrl(store.slug, "/products")}>
              <ShoppingBag className="me-2 size-4" />
              تسوق المجموعة
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Elegant Category Card — square with image and label overlay ──
function ElegantCategoryCard({
  category,
  storeSlug,
}: {
  category: StoreHomeProps["store"]["categories"][number];
  storeSlug: string;
}) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      className="group relative aspect-square overflow-hidden"
    >
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: "var(--store-muted)" }}
        />
      )}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/35" />
      {/* Label */}
      <div className="absolute inset-0 flex items-end p-4">
        <span className="text-sm font-light uppercase tracking-[0.15em] text-white">
          {category.name}
        </span>
      </div>
    </Link>
  );
}

// ─── Elegant Product Card — portrait (3:4), minimal info below ────
function ElegantProductCard({
  product,
  storeSlug,
}: {
  product: StoreHomeProps["store"]["products"][number];
  storeSlug: string;
}) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <Link
      href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
      className="group flex flex-col"
    >
      {/* Image — aspect ratio from merchant layout setting */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            style={{ transitionDuration: "var(--store-motion, 250ms)" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "var(--store-muted)" }}
          />
        )}
        {discount && (
          <span
            className="absolute left-3 top-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ background: "var(--store-primary)" }}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1 text-center">
        <p
          className="text-[11px] uppercase tracking-widest"
          style={{ color: "var(--store-primary)" }}
        >
          {product.category?.name}
        </p>
        <h3 className="text-sm font-light leading-snug">{product.name}</h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-medium">
            {(product.price / 100).toLocaleString("ar-EG")} ج.م
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {(product.compareAtPrice / 100).toLocaleString("ar-EG")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyProducts({ storeSlug }: { storeSlug: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-5 border border-dashed py-16 text-center">
      <ShoppingBag className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-light uppercase tracking-widest">لا توجد منتجات بعد</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          سيتم عرض منتجات المتجر هنا بمجرد إضافتها.
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        className="rounded-none border font-light uppercase tracking-widest"
      >
        <Link href={buildStoreUrl(storeSlug, "/products")}>تصفح المتجر</Link>
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
type ElegantHomeProps = StoreHomeProps & { sectionContent?: SectionContentMap };

export default function ElegantHome({ store, sections, sectionContent = {} }: ElegantHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 12);
  const categories = store.categories.slice(0, 6);
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const allPossibleKeys = DEFAULT_SECTION_ORDER;
  const missingEnabled = allPossibleKeys.filter(
    (k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true,
  );
  const order: SectionKey[] = [...baseOrder, ...missingEnabled];

  const heroNode = sections.showHero ? (
    store.banners.length > 0 ? (
      <StoreBanner key="showHero" banners={store.banners} storeSlug={store.slug} />
    ) : (
      <ElegantHero key="showHero" store={store} />
    )
  ) : null;

  const coreSections: Partial<Record<SectionKey, React.ReactNode>> = {
    showHero: heroNode,

    showCategories: sections.showCategories && categories.length > 0 ? (
      <section key="showCategories">
        <ElegantSectionHeader title="تسوق حسب التصنيف" href={buildStoreUrl(store.slug, "/categories")} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => <ElegantCategoryCard key={cat.id} category={cat} storeSlug={store.slug} />)}
        </div>
      </section>
    ) : null,

    showFeaturedProducts: sections.showFeaturedProducts && featuredProducts.length > 0 ? (
      <section key="showFeaturedProducts">
        <ElegantSectionHeader title="المجموعة المميزة" href={buildStoreUrl(store.slug, "/products")} />
        <div className="grid grid-cols-2 gap-6 store-product-grid">
          {featuredProducts.map((p) => <ElegantProductCard key={p.id} product={p} storeSlug={store.slug} />)}
        </div>
      </section>
    ) : null,

    showLatestProducts: sections.showLatestProducts ? (
      latestProducts.length === 0 ? (
        <EmptyProducts key="showLatestProducts" storeSlug={store.slug} />
      ) : (
        <section key="showLatestProducts">
          <ElegantSectionHeader title="أحدث الوصول" href={buildStoreUrl(store.slug, "/products")} />
          <div className="grid grid-cols-2 gap-6 store-product-grid">
            {latestProducts.map((p) => <ElegantProductCard key={p.id} product={p} storeSlug={store.slug} />)}
          </div>
        </section>
      )
    ) : null,
  };

  const funnelEnabled: Partial<Record<SectionKey, boolean>> = {
    showOfferStrip: sections.showOfferStrip, showSocialProof: sections.showSocialProof,
    showBestSellers: sections.showBestSellers, showWhyChooseUs: sections.showWhyChooseUs,
    showTestimonials: sections.showTestimonials, showAboutBrand: sections.showAboutBrand,
    showNewsletter: sections.showNewsletter, showUrgency: sections.showUrgency,
    showCollections: sections.showCollections,
  };

  const heroFirst = order[0] === "showHero";

  return (
    <div dir="rtl">
      {heroFirst && heroNode}
      <div className="mx-auto w-full max-w-screen-xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        {order.filter((k) => heroFirst ? k !== "showHero" : true).map((key) => {
          if (key in coreSections) return coreSections[key] ?? null;
          if (funnelEnabled[key]) return <SectionRenderer key={key} sectionKey={key} store={store} sectionContent={sectionContent} categories={store.categories} bestSellers={store.bestSellers} />;
          return null;
        })}
      </div>
    </div>
  );
}
