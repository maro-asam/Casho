import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import { DEFAULT_SECTION_ORDER, type SectionKey, type SectionContentMap } from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Modern Section Header — bold with left accent bar ────────────
function ModernSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full" style={{ background: "var(--store-primary)" }} />
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:opacity-80"
        style={{
          background: "color-mix(in srgb, var(--store-primary) 12%, transparent)",
          color: "var(--store-primary)",
        }}
      >
        عرض الكل
        <ArrowLeft className="size-3.5" />
      </Link>
    </div>
  );
}

// ─── Modern Hero — colorful gradient with stats ───────────────────
function ModernHero({ store }: Pick<StoreHomeProps, "store">) {
  const banner = store.banners[0];
  const coverSrc = banner?.image || store.settings?.coverImage;

  return (
    <section
      className="relative overflow-hidden"
      style={{ borderRadius: "var(--store-radius)" }}
      dir="rtl"
    >
      {coverSrc ? (
        <div className="relative h-[480px] w-full sm:h-[540px]">
          <Image
            src={coverSrc}
            alt={store.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--store-hero-overlay)" }}
          />
          {/* Content */}
          <div className="absolute inset-0 flex items-center px-8 sm:px-14">
            <div className="max-w-lg space-y-5 text-white">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
              >
                <Sparkles className="size-3.5" />
                <span>وصل حديثاً</span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                {store.name}
              </h1>
              {store.settings?.description && (
                <p className="text-base leading-relaxed text-white/80">
                  {store.settings.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full font-bold shadow-xl"
                  style={{ background: "#ffffff", color: "var(--store-primary)" }}
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
                    className="rounded-full border-2 border-white/40 text-white hover:bg-white/15 hover:text-white"
                  >
                    <Link href={buildStoreUrl(store.slug, "/categories")}>
                      التصنيفات
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Gradient fallback
        <div
          className="relative overflow-hidden px-8 py-20 sm:px-14 sm:py-28"
          style={{ background: "var(--store-hero-overlay)" }}
        >
          {/* Decorative circles */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full opacity-20"
            style={{ background: "var(--store-secondary)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 right-8 size-56 rounded-full opacity-15"
            style={{ background: "var(--store-secondary)" }}
          />

          <div className="relative max-w-xl space-y-5 text-white">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Sparkles className="size-3.5" />
              <span>اكتشف الجديد</span>
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              {store.name}
            </h1>
            {store.settings?.description && (
              <p className="text-base leading-relaxed text-white/80">
                {store.settings.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="rounded-full font-bold shadow-xl"
                style={{ background: "#ffffff", color: "var(--store-primary)" }}
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
                  className="rounded-full border-2 border-white/40 text-white hover:bg-white/15 hover:text-white"
                >
                  <Link href={buildStoreUrl(store.slug, "/categories")}>
                    التصنيفات
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Modern Category Bubble — circle with image ───────────────────
function ModernCategoryBubble({
  category,
  storeSlug,
}: {
  category: StoreHomeProps["store"]["categories"][number];
  storeSlug: string;
}) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      className="group flex shrink-0 flex-col items-center gap-2"
    >
      <div
        className="relative size-20 overflow-hidden rounded-full border-2 transition-all duration-300 group-hover:shadow-lg sm:size-24"
        style={{
          borderColor: "color-mix(in srgb, var(--store-primary) 25%, transparent)",
        }}
      >
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="96px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold"
            style={{
              background: "color-mix(in srgb, var(--store-primary) 15%, white)",
              color: "var(--store-primary)",
            }}
          >
            {category.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="line-clamp-1 max-w-[4.5rem] text-center text-xs font-semibold">
        {category.name}
      </span>
    </Link>
  );
}

// ─── Modern Product Card — square with badge and add to cart ─────
function ModernProductCard({
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
      className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderRadius: "var(--store-radius)",
        background: "var(--store-card)",
        border: "1px solid var(--store-border)",
      }}
    >
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
            style={{ background: "var(--store-muted)" }}
          />
        )}
        {/* Badges */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          {discount && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
              style={{ background: "#ef4444" }}
            >
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
              style={{ background: "var(--store-primary)" }}
            >
              <Sparkles className="size-2.5" />
              مميز
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3" dir="rtl">
        {product.category && (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--store-primary)" }}
          >
            <Tag className="size-2.5" />
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        <div className="mt-auto flex items-center gap-2">
          <span className="text-base font-extrabold" style={{ color: "var(--store-primary)" }}>
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
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-5 border border-dashed py-16 text-center"
      style={{ borderRadius: "var(--store-radius)" }}
    >
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{
          background: "color-mix(in srgb, var(--store-primary) 10%, transparent)",
          color: "var(--store-primary)",
        }}
      >
        <ShoppingBag className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold">لا توجد منتجات بعد</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          سيتم عرض منتجات المتجر هنا بمجرد إضافتها.
        </p>
      </div>
      <Button
        asChild
        className="rounded-full font-bold"
        style={{ background: "var(--store-primary)", color: "white" }}
      >
        <Link href={buildStoreUrl(storeSlug, "/products")}>تصفح المتجر</Link>
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
type ModernHomeProps = StoreHomeProps & { sectionContent?: SectionContentMap };

export default function ModernHome({ store, sections, sectionContent = {} }: ModernHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 12);
  const categories = store.categories.slice(0, 10);
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const allPossibleKeys = DEFAULT_SECTION_ORDER;
  const missingEnabled = allPossibleKeys.filter(
    (k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true,
  );
  const order: SectionKey[] = [...baseOrder, ...missingEnabled];

  const coreSections: Partial<Record<SectionKey, React.ReactNode>> = {
    showHero: sections.showHero ? <ModernHero key="showHero" store={store} /> : null,
    showCategories: sections.showCategories && categories.length > 0 ? (
      <section key="showCategories">
        <ModernSectionHeader title="تسوق حسب التصنيف" href={buildStoreUrl(store.slug, "/categories")} />
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
          {categories.map((cat) => <ModernCategoryBubble key={cat.id} category={cat} storeSlug={store.slug} />)}
        </div>
      </section>
    ) : null,
    showFeaturedProducts: sections.showFeaturedProducts && featuredProducts.length > 0 ? (
      <section key="showFeaturedProducts">
        <ModernSectionHeader title="منتجات مميزة" href={buildStoreUrl(store.slug, "/products")} />
        <div className="grid grid-cols-2 gap-4 store-product-grid">
          {featuredProducts.map((p) => <ModernProductCard key={p.id} product={p} storeSlug={store.slug} />)}
        </div>
      </section>
    ) : null,
    showLatestProducts: sections.showLatestProducts ? (
      latestProducts.length === 0 ? (
        <EmptyProducts key="showLatestProducts" storeSlug={store.slug} />
      ) : (
        <section key="showLatestProducts">
          <ModernSectionHeader title="أحدث المنتجات" href={buildStoreUrl(store.slug, "/products")} />
          <div className="grid grid-cols-2 gap-4 store-product-grid">
            {latestProducts.map((p) => <ModernProductCard key={p.id} product={p} storeSlug={store.slug} />)}
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

  return (
    <div dir="rtl">
      <div className="mx-auto w-full max-w-screen-2xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
        {order.map((key) => {
          if (key in coreSections) return coreSections[key] ?? null;
          if (funnelEnabled[key]) return <SectionRenderer key={key} sectionKey={key} store={store} sectionContent={sectionContent} categories={store.categories} bestSellers={store.bestSellers} />;
          return null;
        })}
      </div>
    </div>
  );
}
