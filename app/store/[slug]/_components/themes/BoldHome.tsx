import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowDown, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import BoldProductCard from "./BoldProductCard";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import {
  DEFAULT_SECTION_ORDER,
  type SectionKey,
  type SectionContentMap,
} from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Bold Hero — full viewport height ────────────────────
function BoldHero({ store }: Pick<StoreHomeProps, "store">) {
  const banner = store.banners[0];
  const hasCover = !!(banner?.image || store.settings?.coverImage);
  const coverSrc = banner?.image || store.settings?.coverImage;

  return (
    <section className="relative flex h-screen min-h-[600px] w-full items-end overflow-hidden">
      {/* Background */}
      {hasCover && coverSrc ? (
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
              "linear-gradient(135deg, var(--store-primary) 0%, color-mix(in srgb, var(--store-primary) 50%, #000) 100%)",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--store-hero-overlay)" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 pb-16 sm:px-10 lg:px-16" dir="rtl">
        <div className="max-w-2xl space-y-6 text-white">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] opacity-70"
            style={{ fontVariant: "all-small-caps" }}
          >
            {store.settings?.description ? store.settings.description : "مرحباً بك"}
          </p>

          <h1 className="text-5xl font-black leading-none tracking-tight md:text-7xl lg:text-8xl">
            {store.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="rounded-none border-2 border-white bg-white px-8 font-bold uppercase tracking-widest text-black hover:bg-transparent hover:text-white"
            >
              <Link href={buildStoreUrl(store.slug, "/products")}>
                تسوق الآن
              </Link>
            </Button>
            {store.categories.length > 0 && (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-none border-2 border-white/50 px-8 font-bold uppercase tracking-widest text-white hover:border-white hover:bg-transparent hover:text-white"
              >
                <Link href={buildStoreUrl(store.slug, "/categories")}>
                  التصنيفات
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <ArrowDown className="size-5 text-white/60" />
      </div>
    </section>
  );
}

// ─── Bold Category Strip — horizontal scroll ─────────────
function BoldCategoryStrip({
  categories,
  storeSlug,
}: {
  categories: StoreHomeProps["store"]["categories"];
  storeSlug: string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" dir="rtl">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={buildStoreUrl(storeSlug, `/categories/${cat.slug}`)}
          className="group relative shrink-0 overflow-hidden"
          style={{ borderRadius: "var(--store-radius)" }}
        >
          <div className="relative h-32 w-28 sm:h-40 sm:w-36">
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="144px"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: "var(--store-primary)" }}
              />
            )}
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
            <div className="absolute inset-0 flex items-end p-2.5">
              <span className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {cat.name}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Bold Section Header ──────────────────────────────────
function BoldSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--store-border)" }}>
      <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
        {title}
      </h2>
      <Link
        href={href}
        className="mb-0.5 flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
        style={{ color: "var(--store-primary)" }}
      >
        عرض الكل
        <ArrowLeft className="size-3.5" />
      </Link>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────
function EmptyProducts({ storeSlug }: { storeSlug: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed py-16 text-center" style={{ borderRadius: "var(--store-radius)" }}>
      <ShoppingBag className="size-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-bold uppercase tracking-tight">لا توجد منتجات بعد</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          سيتم عرض منتجات المتجر هنا بمجرد إضافتها.
        </p>
      </div>
      <Button asChild variant="outline" className="rounded-none border-2 font-bold uppercase tracking-widest">
        <Link href={buildStoreUrl(storeSlug, "/products")}>تصفح المتجر</Link>
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
type BoldHomeProps = StoreHomeProps & { sectionContent?: SectionContentMap };

export default function BoldHome({ store, sections, sectionContent = {} }: BoldHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 12);
  const categories = store.categories.slice(0, 12);
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const allPossibleKeys = DEFAULT_SECTION_ORDER;
  const missingEnabled = allPossibleKeys.filter(
    (k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true,
  );
  const order: SectionKey[] = [...baseOrder, ...missingEnabled];

  const coreSections: Partial<Record<SectionKey, React.ReactNode>> = {
    showHero: sections.showHero ? <BoldHero key="showHero" store={store} /> : null,

    showCategories: sections.showCategories && categories.length > 0 ? (
      <section key="showCategories">
        <BoldSectionHeader title="التصنيفات" href={buildStoreUrl(store.slug, "/categories")} />
        <BoldCategoryStrip categories={categories} storeSlug={store.slug} />
      </section>
    ) : null,

    showFeaturedProducts: sections.showFeaturedProducts && featuredProducts.length > 0 ? (
      <section key="showFeaturedProducts">
        <BoldSectionHeader title="المميزة" href={buildStoreUrl(store.slug, "/products")} />
        <div className="grid grid-cols-2 gap-4 store-product-grid">
          {featuredProducts.map((p) => <BoldProductCard key={p.id} product={p} storeSlug={store.slug} />)}
        </div>
      </section>
    ) : null,

    showLatestProducts: sections.showLatestProducts ? (
      latestProducts.length === 0 ? (
        <EmptyProducts key="showLatestProducts" storeSlug={store.slug} />
      ) : (
        <section key="showLatestProducts">
          <BoldSectionHeader title="الجديد" href={buildStoreUrl(store.slug, "/products")} />
          <div className="grid grid-cols-2 gap-4 store-product-grid">
            {latestProducts.map((p) => <BoldProductCard key={p.id} product={p} storeSlug={store.slug} />)}
          </div>
        </section>
      )
    ) : null,
  };

  const funnelEnabled: Partial<Record<SectionKey, boolean>> = {
    showOfferStrip: sections.showOfferStrip,
    showSocialProof: sections.showSocialProof,
    showBestSellers: sections.showBestSellers,
    showWhyChooseUs: sections.showWhyChooseUs,
    showTestimonials: sections.showTestimonials,
    showAboutBrand: sections.showAboutBrand,
    showNewsletter: sections.showNewsletter,
    showUrgency: sections.showUrgency,
    showCollections: sections.showCollections,
  };

  const heroFirst = order[0] === "showHero";

  return (
    <div dir="rtl">
      {/* Full-width hero when first */}
      {heroFirst && coreSections.showHero}

      {order
        .filter((k) => (heroFirst ? k !== "showHero" : true))
        .map((key) => {
          // Core sections
          if (key in coreSections) {
            const node = coreSections[key];
            if (!node) return null;
            return (
              <div key={key} className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
                {node}
              </div>
            );
          }
          // Funnel sections
          if (funnelEnabled[key]) {
            if (key === "showOfferStrip") {
              return (
                <SectionRenderer key={key} sectionKey={key} store={store} sectionContent={sectionContent} categories={store.categories} bestSellers={store.bestSellers} />
              );
            }
            return (
              <div key={key} className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
                <SectionRenderer sectionKey={key} store={store} sectionContent={sectionContent} categories={store.categories} bestSellers={store.bestSellers} />
              </div>
            );
          }
          return null;
        })}
    </div>
  );
}
