import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import type { HomeViewProps, ProductCardData } from "../../types";
import { CategoryCircles, CollectionStrip, PromoTiles, StoryWithCategories } from "../sections/Collections";
import Countdown from "../sections/Countdown";
import { MediaBanner, OfferBand, RichText, Stats, Testimonials, TrustRow } from "../sections/Editorial";
import ProductRow from "../sections/ProductRow";
import PromotionGrid from "../sections/PromotionGrid";
import TabbedCollection from "../sections/TabbedCollection";
import { Empty, Wrap, btn, discountPercent } from "../ui";

type Ctx = HomeViewProps;

/** Every distinct product on the page, best discount first. */
function deals(c: Ctx): ProductCardData[] {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest]
    .filter((p) => !seen.has(p.id) && seen.add(p.id) && p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** Maximize's section registry: every merchant section key → a Maximize
 *  section, following the reference demo's composition. */
const REGISTRY: SectionRegistry<Ctx> = {
  // Category strip + promotion grid open the page, as in the reference.
  showHero: (c) => (
    <>
      {c.sections.showCategories && <CollectionStrip categories={c.categories} storeSlug={c.store.slug} />}
      <PromotionGrid {...c} />
    </>
  ),
  showHeroBanner: (c) => <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showOfferStrip: (c) => <OfferBand content={c.sectionContent.offerStrip} />,
  showSocialProof: (c) => <Stats content={c.sectionContent.socialProof} />,
  showBestSellers: (c) => (
    <ProductRow
      products={c.bestSellers}
      storeSlug={c.store.slug}
      eyebrow="الأكثر طلبًا"
      title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
      max={c.sectionContent.bestSellers?.maxProducts ?? 12}
      href={buildStoreUrl(c.store.slug, "/products")}
    />
  ),
  showCategories: (c) => <CategoryCircles categories={c.categories} storeSlug={c.store.slug} />,
  showFeaturedProducts: (c) => (
    <ProductRow products={c.featured} storeSlug={c.store.slug} eyebrow="مختارات" title="اختيارات المتجر" href={buildStoreUrl(c.store.slug, "/products?featured=true")} band />
  ),
  showCollections: (c) => <PromoTiles content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showWhyChooseUs: (c) => <TrustRow content={c.sectionContent.whyChooseUs} />,
  showTestimonials: (c) => <Testimonials content={c.sectionContent.testimonials} />,
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    const products = list.length ? list : c.bestSellers;
    if (products.length === 0) return null;
    return (
      <ProductRow
        products={products}
        storeSlug={c.store.slug}
        eyebrow={list.length ? "أقوى العروض" : "الأكثر طلبًا"}
        title={u?.headline || "عروض لفترة محدودة"}
        href={buildStoreUrl(c.store.slug, "/products")}
        actions={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
      />
    );
  },
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <TabbedCollection title="وصل حديثًا" products={c.latest} categories={c.categories} storeSlug={c.store.slug} href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
    ) : (
      <Wrap className="mx-section">
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
  showAboutBrand: (c) => <StoryWithCategories content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} categories={c.categories} />,
  showRichText: (c) => <RichText content={c.sectionContent.richText} />,
  // The shared newsletter form has no backend (it only simulates a submit),
  // so Maximize does not show a signup it cannot honour.
  showNewsletter: () => null,
};

export default function MaxHome(props: HomeViewProps) {
  return <div className="pb-4">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
