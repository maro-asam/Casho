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
import HeroEditorial from "../sections/HeroEditorial";
import ProductSection from "../sections/ProductSection";
import Spotlight from "../sections/Spotlight";
import Testimonials from "../sections/Testimonials";
import { Empty, Wrap, btn } from "../ui";

type Ctx = HomeViewProps & { underHeader: boolean };

/** Dune's section registry: every merchant section key → a Dune section. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) =>
    c.banners.length > 0 ? (
      <Hero banners={c.banners} store={c.store} dir={c.dir} hasCategories={c.categories.length > 0} underHeader={c.underHeader} />
    ) : (
      <HeroEditorial store={c.store} dir={c.dir} products={[...c.featured, ...c.latest]} hasCategories={c.categories.length > 0} />
    ),
  showHeroBanner: (c) => <ImageBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showOfferStrip: (c) => <ScrollingText content={c.sectionContent.offerStrip} />,
  showSocialProof: (c) => <Stats content={c.sectionContent.socialProof} />,
  showBestSellers: (c) => (
    <ProductSection
      products={c.bestSellers}
      storeSlug={c.store.slug}
      title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
      max={c.sectionContent.bestSellers?.maxProducts ?? 8}
      href={buildStoreUrl(c.store.slug, "/products")}
    />
  ),
  showCategories: (c) => (c.categories.length > 0 ? <CollectionList categories={c.categories} storeSlug={c.store.slug} /> : null),
  showFeaturedProducts: (c) => {
    if (c.featured.length === 0) return null;
    const [lead, ...rest] = c.featured;
    return (
      <>
        <Spotlight product={lead} storeSlug={c.store.slug} />
        {rest.length >= 2 && <ProductSection products={rest} storeSlug={c.store.slug} title="اختيارات المتجر" href={buildStoreUrl(c.store.slug, "/products?featured=true")} />}
      </>
    );
  },
  showCollections: (c) => <PromoGrid content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showWhyChooseUs: (c) => <TextColumns content={c.sectionContent.whyChooseUs} />,
  showTestimonials: (c) => <Testimonials content={c.sectionContent.testimonials} />,
  showUrgency: (c) => <Countdown content={c.sectionContent.urgency} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <ProductSection products={c.latest} storeSlug={c.store.slug} title="وصل حديثًا" href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
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
  const underHeader = first === "showHero" && props.banners.length > 0;

  return <div className="pb-6">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: { ...props, underHeader } })}</div>;
}
