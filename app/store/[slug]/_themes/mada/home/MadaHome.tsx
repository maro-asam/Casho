import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import NewsletterSection from "../../../_components/sections/NewsletterSection";
import type { HomeViewProps, ProductCardData } from "../../types";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import CategoryTiles from "../sections/CategoryTiles";
import Countdown from "../sections/Countdown";
import FeaturedCollection from "../sections/FeaturedCollection";
import Hero from "../sections/Hero";
import HeroEditorial from "../sections/HeroEditorial";
import { Benefits, ImageBanner, ImageWithText, Marquee, PromoGrid, RichText, Stats, Testimonials } from "../sections/Merch";
import NewArrivals from "../sections/NewArrivals";
import ProductRail from "../sections/ProductRail";
import RecentlyViewed from "../sections/RecentlyViewed";
import { Empty, Wrap, btn } from "../ui";

type Ctx = HomeViewProps & { onSale: ProductCardData[] };

/** Mada's section registry: every merchant section key → a Mada section. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) =>
    c.banners.length > 0 ? (
      <Hero banners={c.banners} store={c.store} dir={c.dir} hasCategories={c.categories.length > 0} />
    ) : (
      <HeroEditorial store={c.store} products={[...c.featured, ...c.latest.filter((p) => !c.featured.some((f) => f.id === p.id))]} hasCategories={c.categories.length > 0} />
    ),
  showHeroBanner: (c) => <ImageBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showOfferStrip: (c) => <Marquee content={c.sectionContent.offerStrip} />,
  showSocialProof: (c) => <Stats content={c.sectionContent.socialProof} />,
  showBestSellers: (c) =>
    c.bestSellers.length > 0 ? (
      <ProductRail
        products={c.bestSellers}
        storeSlug={c.store.slug}
        eyebrow="الأكثر طلبًا"
        title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
        subtitle="اللي العملاء بيرجعوا يطلبوه تاني"
        href={buildStoreUrl(c.store.slug, "/products")}
      />
    ) : null,
  showCategories: (c) => (c.categories.length > 0 ? <CategoryTiles categories={c.categories} storeSlug={c.store.slug} /> : null),
  showFeaturedProducts: (c) => (c.featured.length > 0 ? <FeaturedCollection products={c.featured} storeSlug={c.store.slug} /> : null),
  showCollections: (c) => <PromoGrid content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showWhyChooseUs: (c) => <Benefits content={c.sectionContent.whyChooseUs} />,
  showTestimonials: (c) => <Testimonials content={c.sectionContent.testimonials} />,
  showUrgency: (c) => <Countdown content={c.sectionContent.urgency} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <NewArrivals latest={c.latest} onSale={c.onSale} storeSlug={c.store.slug} />
    ) : (
      <Wrap className="md-section">
        <Empty
          icon={<ShoppingBag />}
          title="المنتجات جاية قريب"
          description="المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب."
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "outline" })}>
              تواصل مع المتجر
            </Link>
          }
        />
      </Wrap>
    ),
  showAboutBrand: (c) => <ImageWithText content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} />,
  showRichText: (c) => <RichText content={c.sectionContent.richText} />,
  // No newsletter backend exists yet; the shared section is used as-is.
  showNewsletter: (c) => (
    <Wrap className="md-section">
      <NewsletterSection content={c.sectionContent.newsletter} />
    </Wrap>
  ),
};

export default function MadaHome(props: HomeViewProps) {
  // Products on sale across the lists the home page already loaded.
  const seen = new Set<string>();
  const onSale = [...props.featured, ...props.latest, ...props.bestSellers].filter((p) => {
    if (seen.has(p.id) || !p.compareAtPrice || p.compareAtPrice <= p.price) return false;
    seen.add(p.id);
    return true;
  });

  return (
    <div className="pb-6">
      {renderSections({ sections: props.sections, registry: REGISTRY, ctx: { ...props, onSale } })}
      <RecentlyViewed storeSlug={props.store.slug} />
    </div>
  );
}
