import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { BannerImage, BannerLink } from "../../shared/banner";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import type { HomeViewProps, ProductCardData } from "../../types";
import { CategoryGrid, PromoTiles, StoryWithCategories } from "../sections/Collections";
import Countdown from "../sections/Countdown";
import { MediaBanner, OfferBand, RichText, Stats, Testimonials, TrustRow } from "../sections/Editorial";
import HeroSlider from "../sections/HeroSlider";
import ProductRow, { MiniPanel } from "../sections/ProductRow";
import Spotlight from "../sections/Spotlight";
import { Empty, Wrap, btn, discountPercent } from "../ui";
import { st } from "@/lib/i18n/storefront";

type Ctx = HomeViewProps;

/** Every distinct product on the page, best discount first. */
function deals(c: Ctx): ProductCardData[] {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest]
    .filter((p) => !seen.has(p.id) && seen.add(p.id) && p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** Without banners the hero is a navy band with the store's own name and
 *  description (no stock imagery or invented copy). It is also the Studio's
 *  `minimal` hero, carrying the lead banner's copy when there is one. */
function PlainHero({ c, compact }: { c: Ctx; compact?: boolean }) {
  const lead = c.layout.heroStyle === "minimal" ? c.banners[0] : undefined;
  const text = lead?.subtitle || c.store.description;
  return (
    <section className="bg-(--ce-navy) text-white">
      <div className={cn("ce-wrap flex flex-col items-start justify-center", compact ? "min-h-56 py-10" : "min-h-72 py-14 sm:min-h-96")}>
        <h1 className="ce-hero max-w-[20ch] text-balance text-white">{lead?.title || c.store.name}</h1>
        {text && <p className="mt-4 line-clamp-3 max-w-2xl text-[0.9375rem] leading-7 text-white/85">{text}</p>}
        {lead?.link ? (
          <BannerLink banner={lead} storeSlug={c.store.slug} className="ce-btn ce-btn--cta mt-7">
            {lead.cta}
          </BannerLink>
        ) : (
          <Link href={buildStoreUrl(c.store.slug, "/products")} className="ce-btn ce-btn--cta mt-7">
            {st("تسوّق الآن")}
          </Link>
        )}
      </div>
    </section>
  );
}

/** The Studio's `split` hero: the lead banner's copy on the navy band beside
 *  its photo. */
function SplitHero({ c }: { c: Ctx }) {
  const b = c.banners[0];
  return (
    <section className="bg-(--ce-navy) text-white">
      <div className="ce-wrap grid items-center gap-6 py-6 sm:py-8 lg:grid-cols-2 lg:gap-12 lg:py-10">
        <div className="flex flex-col items-start lg:py-6">
          <p className="text-sm text-white/85">{c.store.name}</p>
          <h1 className="ce-hero mt-3 max-w-[18ch] text-balance text-white">{b.title}</h1>
          {b.subtitle && <p className="mt-3 line-clamp-3 max-w-[48ch] text-base text-white/85">{b.subtitle}</p>}
          {b.link ? (
            <BannerLink banner={b} storeSlug={c.store.slug} className="ce-btn ce-btn--cta mt-7">
              {b.cta}
            </BannerLink>
          ) : (
            <Link href={buildStoreUrl(c.store.slug, "/products")} className="ce-btn ce-btn--cta mt-7">
              {st("تسوّق الآن")}
            </Link>
          )}
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-(--ce-r-lg) bg-white/5">
          <BannerImage banner={b} priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

/** Cello's section registry: every merchant section key → a Cello
 *  section, following the reference demo's composition. */
const REGISTRY: SectionRegistry<Ctx> = {
  // Studio hero: `fullscreen` (Cello's own) the full-width slideshow,
  // `compact` the same at a band's height, `split` copy beside the lead
  // banner's photo, `minimal` the navy band with words only.
  showHero: (c) => {
    const style = c.layout.heroStyle;
    if (c.banners.length === 0 || style === "minimal") return <PlainHero c={c} compact={style === "compact"} />;
    if (style === "split") return <SplitHero c={c} />;
    return (
      <>
        <h1 className="sr-only">{c.store.name}</h1>
        <HeroSlider banners={c.banners} storeName={c.store.name} storeSlug={c.store.slug} compact={style === "compact"} />
      </>
    );
  },
  showCategories: (c) => <CategoryGrid categories={c.categories} storeSlug={c.store.slug} shape={c.layout.categoryCardStyle} />,
  showOfferStrip: (c) => <OfferBand content={c.sectionContent.offerStrip} />,
  showBestSellers: (c) => (
    <ProductRow
      products={c.bestSellers}
      storeSlug={c.store.slug}
      title={c.sectionContent.bestSellers?.headline || st("الأكثر مبيعًا")}
      sub={st("المنتجات اللي عملاء المتجر بيطلبوها أكتر")}
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
        title={u?.headline || st("أقوى العروض")}
        sub={st("خصومات حقيقية على منتجات المتجر")}
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
          title={st("اختيارات المتجر")}
          sub={st("منتجات مختارة بعناية من المتجر")}
          href={buildStoreUrl(c.store.slug, "/products?featured=true")}
          lead={c.banners[1] ?? null}
        />
      </>
    );
  },
  showHeroBanner: (c) => <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} />,
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <MiniPanel products={c.latest} storeSlug={c.store.slug} title={st("وصل حديثًا")} sub={st("أحدث المنتجات اللي نزلت المتجر")} grid max={6} />
    ) : (
      <Wrap className="ce-section">
        <Empty
          icon={<ShoppingBag />}
          title={st("المنتجات جاية قريب")}
          description={st("المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب.")}
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "outline" })}>
              {st("تواصل مع المتجر")}
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
