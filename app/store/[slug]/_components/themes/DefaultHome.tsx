import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import StoreBanner from "../StoreBanner";
import ProductCard from "../shared/ProductCard";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreHomeProps } from "../StoreHome";
import {
  DEFAULT_SECTION_ORDER,
  type SectionKey,
  type SectionContentMap,
} from "@/types/store-theme.types";
import SectionRenderer from "../sections/SectionRenderer";

// ─── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm font-medium transition-colors hover:underline"
        style={{ color: "var(--store-primary)" }}
      >
        عرض الكل
        <ArrowLeft className="size-4" />
      </Link>
    </div>
  );
}

function CategoryCard({
  category,
  storeSlug,
}: {
  category: StoreHomeProps["store"]["categories"][number];
  storeSlug: string;
}) {
  return (
    <Link
      href={buildStoreUrl(storeSlug, `/categories/${category.slug}`)}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 25vw, 12vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold"
            style={{
              background: "var(--store-primary)",
              color: "var(--store-primary-foreground)",
            }}
          >
            {category.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
      </div>
      <span className="line-clamp-1 text-center text-xs font-medium">
        {category.name}
      </span>
    </Link>
  );
}

function HeroFallback({ store }: Pick<StoreHomeProps, "store">) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-8 py-16 md:py-24"
      style={{
        background:
          "linear-gradient(135deg, var(--store-primary) 0%, color-mix(in srgb, var(--store-primary) 60%, #000) 100%)",
        color: "var(--store-primary-foreground)",
      }}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-24 left-16 size-96 rounded-full bg-white/5" />
      <div className="relative z-10 max-w-xl space-y-5">
        <p className="text-sm font-medium opacity-75">أهلاً بك في</p>
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          {store.name}
        </h1>
        {store.settings?.description && (
          <p className="max-w-lg text-base leading-7 opacity-80">
            {store.settings.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            asChild
            size="lg"
            className="rounded-2xl font-semibold shadow-lg"
            style={{
              background: "white",
              color: "var(--store-primary)",
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
              className="rounded-2xl border border-white/30 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href={buildStoreUrl(store.slug, "/categories")}>
                التصنيفات
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyProducts({ storeSlug }: { storeSlug: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
      <ShoppingBag className="size-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">لا توجد منتجات بعد</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          سيتم عرض منتجات المتجر هنا بمجرد إضافتها.
        </p>
      </div>
      <Button asChild variant="outline" className="rounded-2xl">
        <Link href={buildStoreUrl(storeSlug, "/products")}>تصفح المتجر</Link>
      </Button>
    </div>
  );
}

// ─── Main DefaultHome ──────────────────────────────────────────────────────────

type DefaultHomeProps = StoreHomeProps & {
  sectionContent?: SectionContentMap;
};

export default function DefaultHome({
  store,
  sections,
  sectionContent = {},
}: DefaultHomeProps) {
  const featuredProducts = store.products.filter((p) => p.isFeatured).slice(0, 8);
  const latestProducts = store.products.slice(0, 12);
  const categories = store.categories.slice(0, 8);
  // Safety net: start from saved order (or default), then append any enabled
  // sections that aren't in it yet (happens when store has old saved order
  // and merchant just enabled a new funnel section).
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const allPossibleKeys = DEFAULT_SECTION_ORDER;
  const missingEnabled = allPossibleKeys.filter(
    (k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true,
  );
  const order: SectionKey[] = [...baseOrder, ...missingEnabled];

  // ── Core section nodes (theme-specific rendering) ──────────────────────────
  const coreSections: Partial<Record<SectionKey, React.ReactNode>> = {
    showHero: sections.showHero ? (
      <section key="showHero">
        {store.banners.length > 0 ? (
          <StoreBanner banners={store.banners} storeSlug={store.slug} />
        ) : (
          <HeroFallback store={store} />
        )}
      </section>
    ) : null,

    showCategories:
      sections.showCategories && categories.length > 0 ? (
        <section key="showCategories">
          <SectionHeader
            title="تسوق حسب التصنيف"
            href={buildStoreUrl(store.slug, "/categories")}
          />
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} storeSlug={store.slug} />
            ))}
          </div>
        </section>
      ) : null,

    showFeaturedProducts:
      sections.showFeaturedProducts && featuredProducts.length > 0 ? (
        <section key="showFeaturedProducts">
          <SectionHeader
            title="منتجات مميزة"
            href={buildStoreUrl(store.slug, "/products")}
          />
          <div className="grid grid-cols-2 gap-5 store-product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={store.slug} />
            ))}
          </div>
        </section>
      ) : null,

    showLatestProducts: sections.showLatestProducts ? (
      latestProducts.length === 0 ? (
        <EmptyProducts key="showLatestProducts" storeSlug={store.slug} />
      ) : (
        <section key="showLatestProducts">
          <SectionHeader
            title="أحدث المنتجات"
            href={buildStoreUrl(store.slug, "/products")}
          />
          <div className="grid grid-cols-2 gap-5 store-product-grid">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={store.slug} />
            ))}
          </div>
        </section>
      )
    ) : null,
  };

  // ── Funnel section check helpers ───────────────────────────────────────────
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

  return (
    <div className="w-full" dir="rtl">
      {order.map((key) => {
        // Core sections render inline
        if (key in coreSections) {
          const node = coreSections[key];
          if (!node) return null;
          return (
            <div
              key={key}
              className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8"
            >
              {node}
            </div>
          );
        }

        // Funnel sections use shared SectionRenderer
        if (funnelEnabled[key]) {
          // OfferStrip renders full-width (no container padding)
          if (key === "showOfferStrip") {
            return (
              <div key={key}>
                <SectionRenderer
                  sectionKey={key}
                  store={store}
                  sectionContent={sectionContent}
                  categories={store.categories}
                  bestSellers={store.bestSellers}
                />
              </div>
            );
          }
          return (
            <div
              key={key}
              className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8"
            >
              <SectionRenderer
                sectionKey={key}
                store={store}
                sectionContent={sectionContent}
                categories={store.categories}
                bestSellers={store.bestSellers}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
