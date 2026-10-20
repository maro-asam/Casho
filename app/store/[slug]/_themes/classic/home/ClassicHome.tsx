import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/types/store-theme.types";
import SectionRenderer from "../../../_components/sections/SectionRenderer";
import { StudioAnchor } from "../../shared/studio-anchor";
import type { HomeViewProps, ProductCardData } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import ProductRail from "../product/ProductRail";
import { Container, EmptyState, SectionHeading, btn } from "../ui";
import CategoryRail from "./CategoryRail";
import HeroCarousel from "./HeroCarousel";
import PromoTiles from "./PromoTiles";

const HERO_SLIDES = 3;

function HeroFallback({
  store,
  products,
  hasCategories,
}: {
  store: HomeViewProps["store"];
  products: ProductCardData[];
  hasCategories: boolean;
}) {
  const mosaic = products.filter((p) => p.image && !p.image.includes("placeholder")).slice(0, 4);
  return (
    <section className="grid items-center gap-8 overflow-hidden rounded-(--c-radius-lg) bg-(--c-subtle) px-5 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-14 lg:py-14">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-muted-foreground">أهلاً بيك في</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{store.name}</h1>
        {store.description && (
          <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-7 text-muted-foreground sm:text-base">{store.description}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8">
          <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg", className: "min-w-36" })}>
            <ShoppingBag />
            تسوق الآن
          </Link>
          {hasCategories && (
            <Link href={buildStoreUrl(store.slug, "/categories")} className={btn({ size: "lg", variant: "outline" })}>
              التصنيفات
            </Link>
          )}
        </div>
      </div>

      {mosaic.length >= 2 && (
        <div className="hidden grid-cols-2 gap-3 lg:grid" aria-hidden>
          {mosaic.slice(0, mosaic.length >= 4 ? 4 : 2).map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "relative overflow-hidden rounded-(--c-radius) bg-background",
                mosaic.length >= 4 ? "aspect-square" : "aspect-[3/4]",
                mosaic.length >= 4 && i % 2 === 1 && "translate-y-6",
              )}
            >
              <Image src={p.image} alt="" fill sizes="240px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ClassicHome({
  store,
  dir,
  banners,
  categories,
  featured,
  latest,
  bestSellers,
  sections,
  sectionContent,
  layout,
}: HomeViewProps) {
  const heroBanners = banners.slice(0, HERO_SLIDES);
  const promoBanners = banners.slice(HERO_SLIDES, HERO_SLIDES + 4);
  const url = (p: string) => buildStoreUrl(store.slug, p);

  // Saved order first, then any enabled section that isn't in it yet.
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const order: SectionKey[] = [
    ...baseOrder,
    ...DEFAULT_SECTION_ORDER.filter((k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true),
  ];

  const hasAnyProducts = latest.length > 0;

  const core: Partial<Record<SectionKey, ReactNode>> = {
    showHero: sections.showHero ? (
      <div className="pt-4 sm:pt-6">
        {heroBanners.length > 0 && layout.heroStyle !== "minimal" ? (
          <HeroCarousel
            banners={heroBanners}
            storeSlug={store.slug}
            heroStyle={layout.heroStyle}
            dir={dir}
            hasCategories={categories.length > 0}
          />
        ) : (
          <HeroFallback store={store} products={featured.length ? featured : latest} hasCategories={categories.length > 0} />
        )}
        {promoBanners.length > 0 && <div className="mt-3 sm:mt-4">
          <PromoTiles banners={promoBanners} storeSlug={store.slug} />
        </div>}
      </div>
    ) : null,

    showCategories:
      sections.showCategories && categories.length > 0 ? (
        <div className="c-section">
          <SectionHeading title="تسوق حسب التصنيف" href={url("/categories")} linkLabel="كل التصنيفات" />
          <CategoryRail categories={categories.slice(0, 12)} storeSlug={store.slug} style={layout.categoryCardStyle} />
        </div>
      ) : null,

    showFeaturedProducts:
      sections.showFeaturedProducts && featured.length > 0 ? (
        <div className="c-section">
          <SectionHeading title="منتجات مميزة" href={url("/products?featured=true")} />
          <ProductRail products={featured} storeSlug={store.slug} />
        </div>
      ) : null,

    showBestSellers:
      sections.showBestSellers && bestSellers.length > 0 ? (
        <div className="c-section">
          <SectionHeading
            title={sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
            subtitle="اختيارات عملائنا المفضلة"
            href={url("/products")}
          />
          <ProductRail products={bestSellers} storeSlug={store.slug} />
        </div>
      ) : null,

    showLatestProducts: sections.showLatestProducts ? (
      hasAnyProducts ? (
        <div className="c-section">
          <SectionHeading title="وصل حديثًا" href={url("/products")} />
          <ProductGrid products={latest} storeSlug={store.slug} />
          {latest.length >= 8 && (
            <div className="mt-8 flex justify-center sm:mt-10">
              <Link href={url("/products")} className={btn({ variant: "outline", size: "lg", className: "min-w-52" })}>
                تصفح كل المنتجات
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="c-section">
          <EmptyState
            icon={<ShoppingBag />}
            title="المنتجات جاية قريب"
            description="المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب."
          />
        </div>
      )
    ) : null,
  };

  // One home section; null when it is off or has nothing to show.
  const renderSection = (key: SectionKey) => {
    if (key in core) {
      const node = core[key];
      return node ? <Container key={key}>{node}</Container> : null;
    }

    if (!sections[key as keyof typeof sections]) return null;

    // Merchant-configured content sections (offer strip is full-bleed)
    const content = (
      <SectionRenderer
        sectionKey={key}
        store={store}
        sectionContent={sectionContent}
        categories={categories}
      />
    );
    return key === "showOfferStrip" ? (
      <div key={key} className="my-[calc(var(--c-section-y)/2)]">
        {content}
      </div>
    ) : (
      <Container key={key} className="c-section">
        {content}
      </Container>
    );
  };

  return (
    <div className="pb-4">
      {order.map((key) => {
        const node = renderSection(key);
        return node ? (
          <Fragment key={key}>
            <StudioAnchor id={key} />
            {node}
          </Fragment>
        ) : null;
      })}
    </div>
  );
}
