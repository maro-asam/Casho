import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { resolveSectionOrder, renderSections, type SectionRegistry } from "../../shared/sections";
import NewsletterSection from "../../../_components/sections/NewsletterSection";
import type { HomeViewProps } from "../../types";
import { CollectionList, PromoGrid } from "../sections/Collections";
import Countdown from "../sections/Countdown";
import { ImageBanner, ImageWithText, RichText, ScrollingText, Stats, TextColumns } from "../sections/Editorial";
import Hero from "../sections/Hero";
import HeroEditorial, { HeroMinimal } from "../sections/HeroEditorial";
import ProductSection from "../sections/ProductSection";
import Spotlight from "../sections/Spotlight";
import Testimonials from "../sections/Testimonials";
import { Empty, Wrap, btn } from "../ui";

type Ctx = HomeViewProps & { underHeader: boolean };

/** Dune's section registry: every merchant section key → a Dune section. */
const REGISTRY: SectionRegistry<Ctx> = {
  // Studio hero: `fullscreen` (Dune's own) the slideshow under the header,
  // `compact` the same at a band's height, `split` the editorial spread with
  // the lead banner's photo, `minimal` the name set large. No banners → the
  // spread with the store's own products.
  showHero: (c) => {
    const style = c.layout.heroStyle;
    const hasCategories = c.categories.length > 0;
    if (style === "minimal") return <HeroMinimal store={c.store} banner={c.banners[0]} hasCategories={hasCategories} />;
    if (c.banners.length > 0 && style !== "split") {
      return (
        <Hero banners={c.banners} store={c.store} dir={c.dir} hasCategories={hasCategories} underHeader={c.underHeader} compact={style === "compact"} />
      );
    }
    return (
      <HeroEditorial
        store={c.store}
        dir={c.dir}
        products={[...c.featured, ...c.latest]}
        hasCategories={hasCategories}
        banner={c.banners[0]}
        compact={style === "compact"}
      />
    );
  },
  showHeroBanner: (c) => <ImageBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showOfferStrip: (c) => <ScrollingText content={c.sectionContent.offerStrip} />,
  showSocialProof: (c) => <Stats content={c.sectionContent.socialProof} />,
  showBestSellers: (c) => (
    <ProductSection
      cols={c.layout.desktopGridCols}
      products={c.bestSellers}
      storeSlug={c.store.slug}
      title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
      max={c.sectionContent.bestSellers?.maxProducts ?? 8}
      href={buildStoreUrl(c.store.slug, "/products")}
    />
  ),
  showCategories: (c) =>
    c.categories.length > 0 ? <CollectionList categories={c.categories} storeSlug={c.store.slug} shape={c.layout.categoryCardStyle} /> : null,
  showFeaturedProducts: (c) => {
    if (c.featured.length === 0) return null;
    const [lead, ...rest] = c.featured;
    return (
      <>
        <Spotlight product={lead} storeSlug={c.store.slug} />
        {rest.length >= 2 && <ProductSection cols={c.layout.desktopGridCols} products={rest} storeSlug={c.store.slug} title="اختيارات المتجر" href={buildStoreUrl(c.store.slug, "/products?featured=true")} />}
      </>
    );
  },
  showCollections: (c) => <PromoGrid content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showWhyChooseUs: (c) => <TextColumns content={c.sectionContent.whyChooseUs} />,
  showTestimonials: (c) => <Testimonials content={c.sectionContent.testimonials} />,
  showUrgency: (c) => <Countdown content={c.sectionContent.urgency} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <ProductSection cols={c.layout.desktopGridCols} products={c.latest} storeSlug={c.store.slug} title="وصل حديثًا" href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
    ) : (
      <Wrap className="dn-section">
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
    <Wrap className="dn-section">
      <NewsletterSection content={c.sectionContent.newsletter} />
    </Wrap>
  ),
};

export default function DuneHome(props: HomeViewProps) {
  // The banner slideshow tucks under the transparent header only when it is
  // the first thing on the page.
  const first = resolveSectionOrder(props.sections).find((k) => props.sections[k as keyof typeof props.sections] === true);
  const style = props.layout.heroStyle;
  const underHeader = first === "showHero" && props.banners.length > 0 && (style === "fullscreen" || style === "compact");

  return <div className="pb-6">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: { ...props, underHeader } })}</div>;
}
