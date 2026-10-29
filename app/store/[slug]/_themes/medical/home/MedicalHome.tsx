import Link from "next/link";
import { ShoppingBag, Sparkles, TrendingUp } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import { whatsappHref } from "../../shared/social";
import { StudioAnchor } from "../../shared/studio-anchor";
import type { HomeViewProps, ProductCardData } from "../../types";
import CategoryShelf from "../sections/CategoryShelf";
import Countdown from "../sections/Countdown";
import { AboutBrand, MediaBanner, OfferStrip, PromoTiles, RichText, RxBand, Stats, Testimonials, TrustRow } from "../sections/Editorial";
import Hero from "../sections/Hero";
import ProductRow, { DealsPanel } from "../sections/ProductRow";
import { ProductGrid } from "../product/ProductCard";
import { Empty, SectionHeader, Wrap, btn, discountPercent } from "../ui";

type Ctx = HomeViewProps;

/** Every distinct in-stock product on the page with a real discount, best first. */
function deals(c: Ctx): ProductCardData[] {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest]
    .filter((p) => !seen.has(p.id) && seen.add(p.id) && p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** Casho Medical's section registry: every merchant section key → a
 *  Medical section. Order and visibility come from the Studio. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) => <Hero style={c.layout.heroStyle} store={c.store} banners={c.banners} categories={c.categories} whatsapp={c.whatsapp} />,
  showCategories: (c) => <CategoryShelf categories={c.categories} storeSlug={c.store.slug} style={c.layout.categoryCardStyle} />,
  showOfferStrip: (c) => <OfferStrip content={c.sectionContent.offerStrip} />,
  showBestSellers: (c) => (
    <ProductRow
      products={c.bestSellers}
      storeSlug={c.store.slug}
      eyebrow={
        <>
          <TrendingUp className="size-4" />
          الأكثر طلبًا
        </>
      }
      title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
      sub="المنتجات اللي عملاء المتجر بيطلبوها أكتر"
      max={c.sectionContent.bestSellers?.maxProducts ?? 12}
      href={buildStoreUrl(c.store.slug, "/products")}
    />
  ),
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    return (
      <DealsPanel
        products={deals(c)}
        storeSlug={c.store.slug}
        title={u?.headline || "عروض لفترة محدودة"}
        timer={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
      />
    );
  },
  showCollections: (c) => <PromoTiles content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showFeaturedProducts: (c) => (
    <ProductRow
      products={c.featured}
      storeSlug={c.store.slug}
      eyebrow={
        <>
          <Sparkles className="size-4" />
          مختارات
        </>
      }
      title="اختيارات المتجر"
      sub="منتجات مختارة بعناية من المتجر"
      href={buildStoreUrl(c.store.slug, "/products?featured=true")}
    />
  ),
  showHeroBanner: (c) => <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <Wrap className="rx-section">
        <SectionHeader title="وصل حديثًا" sub="أحدث المنتجات اللي نزلت المتجر" href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
        <ProductGrid products={c.latest} storeSlug={c.store.slug} />
      </Wrap>
    ) : (
      <Wrap className="rx-section">
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
  showSocialProof: (c) => <Stats content={c.sectionContent.socialProof} />,
  showTestimonials: (c) => <Testimonials content={c.sectionContent.testimonials} />,
  showAboutBrand: (c) => <AboutBrand content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} />,
  showRichText: (c) => <RichText content={c.sectionContent.richText} />,
  showWhyChooseUs: (c) => <TrustRow content={c.sectionContent.whyChooseUs} />,
  // The shared newsletter form has no backend (it only simulates a submit),
  // so this theme does not show a signup it cannot honour.
  showNewsletter: () => null,
};

export default function MedicalHome(props: HomeViewProps) {
  const wa = whatsappHref(props.whatsapp);
  // The split hero already carries the prescription card.
  const rxBand = wa && !(props.sections.showHero && props.layout.heroStyle === "split");
  return (
    <div className="pb-6">
      {renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}
      {rxBand && (
        <>
          <StudioAnchor id="__end" />
          <RxBand whatsappHref={wa} />
        </>
      )}
    </div>
  );
}
