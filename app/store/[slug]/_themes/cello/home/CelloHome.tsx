import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import type { HomeViewProps, ProductCardData } from "../../types";
import { CategoryGrid, PromoTiles, StoryWithCategories } from "../sections/Collections";
import Countdown from "../sections/Countdown";
import { MediaBanner, OfferBand, RichText, Stats, Testimonials, TrustRow } from "../sections/Editorial";
import HeroSlider from "../sections/HeroSlider";
import ProductRow, { MiniPanel } from "../sections/ProductRow";
import Spotlight from "../sections/Spotlight";
import { Empty, Wrap, btn, discountPercent } from "../ui";

type Ctx = HomeViewProps;

/** Every distinct product on the page, best discount first. */
function deals(c: Ctx): ProductCardData[] {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest]
    .filter((p) => !seen.has(p.id) && seen.add(p.id) && p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** Without banners the hero is a navy band with the store's own name and
 *  description (no stock imagery or invented copy). */
function PlainHero({ c }: { c: Ctx }) {
  return (
    <section className="bg-(--ce-navy) text-white">
      <div className="ce-wrap flex min-h-72 flex-col items-start justify-center py-14 sm:min-h-96">
        <h1 className="ce-hero max-w-[20ch] text-balance text-white">{c.store.name}</h1>
        {c.store.description && <p className="mt-4 line-clamp-3 max-w-2xl text-[0.9375rem] leading-7 text-white/85">{c.store.description}</p>}
        <Link href={buildStoreUrl(c.store.slug, "/products")} className="ce-btn ce-btn--cta mt-7">
          تسوّق الآن
        </Link>
      </div>
    </section>
  );
}

/** Cello's section registry: every merchant section key → a Cello
 *  section, following the reference demo's composition. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) =>
    c.banners.length > 0 ? (
      <>
        <h1 className="sr-only">{c.store.name}</h1>
        <HeroSlider banners={c.banners} storeName={c.store.name} href={buildStoreUrl(c.store.slug, "/products")} />
      </>
    ) : (
      <PlainHero c={c} />
    ),
  showCategories: (c) => <CategoryGrid categories={c.categories} storeSlug={c.store.slug} />,
  showOfferStrip: (c) => <OfferBand content={c.sectionContent.offerStrip} />,
  showBestSellers: (c) => (
    <ProductRow
      products={c.bestSellers}
      storeSlug={c.store.slug}
      title={c.sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
      sub="المنتجات اللي عملاء المتجر بيطلبوها أكتر"
      max={c.sectionContent.bestSellers?.maxProducts ?? 12}
      href={buildStoreUrl(c.store.slug, "/products")}
    />
  ),
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    if (list.length === 0) return null;
    return (
      <MiniPanel
        products={list}
        storeSlug={c.store.slug}
        title={u?.headline || "أقوى العروض"}
        sub="خصومات حقيقية على منتجات المتجر"
        timer={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
      />
    );
  },
  showCollections: (c) => <PromoTiles content={c.sectionContent.collections} storeSlug={c.store.slug} />,
  showFeaturedProducts: (c) => {
    if (c.featured.length === 0) return null;
    const [first, ...rest] = c.featured;
    return (
      <>
        <Spotlight storeSlug={c.store.slug} slug={first.slug} />
        <ProductRow
          products={rest.length >= 3 ? rest : c.featured}
          storeSlug={c.store.slug}
          title="اختيارات المتجر"
          sub="منتجات مختارة بعناية من المتجر"
          href={buildStoreUrl(c.store.slug, "/products?featured=true")}
          lead={c.banners[1] ? { banner: c.banners[1], href: buildStoreUrl(c.store.slug, "/products?featured=true") } : null}
        />
      </>
    );
  },
  showHeroBanner: (c) => <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <MiniPanel products={c.latest} storeSlug={c.store.slug} title="وصل حديثًا" sub="أحدث المنتجات اللي نزلت المتجر" grid max={6} />
    ) : (
      <Wrap className="ce-section">
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
  showAboutBrand: (c) => <StoryWithCategories content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} categories={c.categories} />,
  showRichText: (c) => <RichText content={c.sectionContent.richText} />,
  showWhyChooseUs: (c) => <TrustRow content={c.sectionContent.whyChooseUs} />,
  // The shared newsletter form has no backend (it only simulates a submit),
  // so Cello does not show a signup it cannot honour.
  showNewsletter: () => null,
};

export default function CelloHome(props: HomeViewProps) {
  return <div>{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
