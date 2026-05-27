import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import { type SectionContentMap } from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Dark Section Header ──────────────────────────────────────────
function DarkSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4" dir="rtl">
      <div className="flex items-center gap-3">
        {/* Neon accent dot */}
        <span
          className="size-2 rounded-full"
          style={{
            background: "var(--store-primary)",
            boxShadow: "0 0 8px var(--store-primary)",
          }}
        />
        <h2 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: "var(--store-foreground, #f1f5f9)" }}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--store-primary)" }}
      >
        عرض الكل
        <ArrowLeft className="size-3.5" />
      </Link>
    </div>
  );
}

// ─── Dark Hero ────────────────────────────────────────────────────
function DarkHero({ store }: Pick<StoreHomeProps, "store">) {
  const banner = store.banners[0];
  const coverSrc = banner?.image || store.settings?.coverImage;

  return (
    <section className="relative flex min-h-[90vh] w-full items-end overflow-hidden">
      {/* Background */}
      {coverSrc ? (
        <Image
          src={coverSrc}
          alt={store.name}
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
      ) : (
        /* Animated noise/grid fallback */
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--store-primary) 20%, transparent), transparent 70%), var(--store-background)",
          }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--store-hero-overlay)" }}
      />

      {/* Glow line at top */}
      <div
        className="absolute left-0 right-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--store-primary), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 pb-20 sm:px-12 lg:px-16" dir="rtl">
        <div className="max-w-2xl space-y-6">
          {/* Neon badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: "color-mix(in srgb, var(--store-primary) 40%, transparent)",
              color: "var(--store-primary)",
              background: "color-mix(in srgb, var(--store-primary) 10%, transparent)",
            }}
          >
            <Zap className="size-3" />
            {store.settings?.description || "مجموعة حصرية"}
          </div>

          <h1
            className="text-5xl font-black leading-none tracking-tight sm:text-7xl lg:text-8xl"
            style={{ color: "#ffffff" }}
          >
            {store.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="rounded-xl font-bold"
              style={{
                background: "var(--store-primary)",
                color: "#000",
                boxShadow: "0 0 24px color-mix(in srgb, var(--store-primary) 50%, transparent)",
              }}
            >
              <Link href={buildStoreUrl(store.slug, "/products")}>
                <ShoppingBag className="me-2 size-4" />
                تسوق الآن
              </Link>
            </Button>
            {store.categories.length > 0 && (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-xl border font-medium"
                style={{
                  borderColor: "color-mix(in srgb, var(--store-primary) 30%, #ffffff30)",
                  color: "#ffffff",
                }}
              >
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  التصنيفات
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Dark Category Card ───────────────────────────────────────────
function DarkCategoryCard({
  category,
  storeSlug,
}: {
  category: StoreHomeProps["store"]["categories"][number];
  storeSlug: string;
}) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        borderRadius: "var(--store-radius)",
        border: "1px solid var(--store-border)",
        background: "var(--store-card)",
      }}
    >
      <div className="relative aspect-square">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: "color-mix(in srgb, var(--store-primary) 15%, var(--store-card))",
            }}
          />
        )}
        {/* Neon bottom border on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
          style={{ background: "var(--store-primary)" }}
        />
      </div>
      <div className="p-2 text-center">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--store-foreground, #f1f5f9)" }}
        >
          {category.name}
        </span>
      </div>
    </Link>
  );
}

// ─── Dark Product Card ────────────────────────────────────────────
function DarkProductCard({
  product,
  storeSlug,
}: {
  product: StoreHomeProps["store"]["products"][number];
  storeSlug: string;
}) {
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : null;

  return (
    <Link
      href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        borderRadius: "var(--store-radius)",
        background: "var(--store-card)",
        border: "1px solid var(--store-border)",
      }}
    >
      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          borderRadius: "var(--store-radius)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--store-primary) 40%, transparent)",
        }}
      />

      {/* Image — aspect ratio from merchant layout setting */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
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
            style={{
              background: "color-mix(in srgb, var(--store-primary) 8%, var(--store-muted))",
            }}
          />
        )}
        {discount && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: "var(--store-primary)",
              color: "#000",
              boxShadow: "0 0 12px color-mix(in srgb, var(--store-primary) 60%, transparent)",
            }}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3" dir="rtl">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-snug"
          style={{ color: "var(--store-foreground, #f1f5f9)" }}
        >
          {product.name}
        </h3>
        <div className="mt-auto flex items-center gap-2">
          <span
            className="text-sm font-extrabold"
            style={{ color: "var(--store-primary)" }}
          >
            {(product.price / 100).toLocaleString("ar-EG")} ج.م
          </span>
          {hasDiscount && product.compareAtPrice && (
            <span
              className="text-xs line-through"
              style={{ color: "var(--store-muted-foreground, #94a3b8)" }}
            >
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
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-5 border border-dashed py-16 text-center"
      style={{
        borderRadius: "var(--store-radius)",
        borderColor: "var(--store-border)",
      }}
    >
      <ShoppingBag className="size-8" style={{ color: "var(--store-primary)" }} />
      <div className="space-y-1">
        <p className="text-sm font-bold" style={{ color: "var(--store-foreground, #f1f5f9)" }}>
          لا توجد منتجات بعد
        </p>
        <p className="max-w-xs text-xs" style={{ color: "var(--store-muted-foreground, #94a3b8)" }}>
          سيتم عرض منتجات المتجر هنا بمجرد إضافتها.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="rounded-xl font-semibold"
        style={{ background: "var(--store-primary)", color: "#000" }}
      >
        <Link href={buildStoreUrl(storeSlug, "/products")}>تصفح المتجر</Link>
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
type DarkHomeProps = StoreHomeProps & { sectionContent?: SectionContentMap };

export default function DarkHome({ store, sections, sectionContent = {} }: DarkHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 12);
  const categories = store.categories.slice(0, 8);

  const funnelEnabled: Partial<Record<string, boolean>> = {
    showSocialProof: sections.showSocialProof, showBestSellers: sections.showBestSellers,
    showCollections: sections.showCollections, showWhyChooseUs: sections.showWhyChooseUs,
    showTestimonials: sections.showTestimonials, showUrgency: sections.showUrgency,
    showAboutBrand: sections.showAboutBrand, showNewsletter: sections.showNewsletter,
  };

  return (
    <div dir="rtl" style={{ background: "var(--store-background)" }}>
      {/* Offer strip — full width */}
      {sections.showOfferStrip && (
        <SectionRenderer sectionKey="showOfferStrip" store={store} sectionContent={sectionContent} />
      )}

      {/* Hero */}
      {sections.showHero && <DarkHero store={store} />}

      <div className="mx-auto w-full max-w-screen-2xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {/* Categories */}
        {sections.showCategories && categories.length > 0 && (
          <section>
            <DarkSectionHeader title="التصنيفات" href={buildStoreUrl(store.slug, "/categories")} />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
              {categories.map((cat) => (
                <DarkCategoryCard key={cat.id} category={cat} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {sections.showFeaturedProducts && featuredProducts.length > 0 && (
          <section>
            <DarkSectionHeader title="منتجات مميزة" href={buildStoreUrl(store.slug, "/products")} />
            <div className="grid grid-cols-2 gap-4 store-product-grid">
              {featuredProducts.map((product) => (
                <DarkProductCard key={product.id} product={product} storeSlug={store.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Latest */}
        {sections.showLatestProducts && (
          latestProducts.length === 0 ? (
            <EmptyProducts storeSlug={store.slug} />
          ) : (
            <section>
              <DarkSectionHeader title="أحدث المنتجات" href={buildStoreUrl(store.slug, "/products")} />
              <div className="grid grid-cols-2 gap-4 store-product-grid">
                {latestProducts.map((product) => (
                  <DarkProductCard key={product.id} product={product} storeSlug={store.slug} />
                ))}
              </div>
            </section>
          )
        )}

        {/* Funnel sections */}
        {Object.entries(funnelEnabled).filter(([, v]) => v).map(([key]) => (
          <SectionRenderer
            key={key}
            sectionKey={key as Parameters<typeof SectionRenderer>[0]["sectionKey"]}
            store={store}
            sectionContent={sectionContent}
            categories={store.categories}
            bestSellers={store.bestSellers}
          />
        ))}
      </div>
    </div>
  );
}
