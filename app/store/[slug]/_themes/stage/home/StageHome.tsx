import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import { whatsappHref } from "../../shared/social";
import type { HomeViewProps, ProductCardData } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import CategoryShelf from "../sections/CategoryShelf";
import Countdown from "../sections/Countdown";
import { AboutBrand, JoinBand, MediaBanner, OfferStrip, PromoTiles, RichText, Stats, Testimonials, TrustRow } from "../sections/Editorial";
import Hero from "../sections/Hero";
import { BigShelf, DealsBand, TopCharts } from "../sections/ProductRow";
import Spotlight from "../sections/Spotlight";
import StudioEmpty from "../sections/StudioEmpty";
import { Band, Empty, SectionHeader, Wrap, btn, discountPercent } from "../ui";

type Ctx = HomeViewProps;

/** Distinct products across the lists the page already loaded. */
function unique(c: Ctx) {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest].filter((p) => !seen.has(p.id) && seen.add(p.id));
}

/** Every in-stock product on the page with a real discount, best first. */
function deals(c: Ctx): ProductCardData[] {
  return unique(c)
    .filter((p) => p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** The spotlight's product: the first featured one in stock, else the newest. */
function spotlit(c: Ctx) {
  return c.featured.find((p) => p.stock > 0) ?? c.latest.find((p) => p.stock > 0) ?? null;
}

/** A section that's on but has nothing to show yet: a marker in the Studio
 *  canvas, nothing on the live store. */
const orEmpty = (node: React.ReactNode, title: string, hint: string) => node ?? <StudioEmpty title={title} hint={hint} />;

/** Casho Stage's section registry: every merchant section key → a Stage section.
 *  Order and visibility come from the Studio. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) => <Hero style={c.layout.heroStyle} store={c.store} banners={c.banners} products={unique(c).filter((p) => p.stock > 0)} />,
  showCategories: (c) => orEmpty(c.categories.some((k) => k.productCount > 0) ? <CategoryShelf categories={c.categories} storeSlug={c.store.slug} style={c.layout.categoryCardStyle} /> : null, "التصنيفات", "هتظهر هنا أول ما تضيف تصنيف فيه منتجات."),
  showOfferStrip: (c) => orEmpty(c.sectionContent.offerStrip?.items?.some((s) => s.trim()) ? <OfferStrip content={c.sectionContent.offerStrip} /> : null, "شريط العروض", "اضغط هنا واكتب عروضك."),
  showBestSellers: (c) =>
    orEmpty(
      c.bestSellers.length > 0 ? (
        <TopCharts products={c.bestSellers} storeSlug={c.store.slug} title={c.sectionContent.bestSellers?.headline || "الأكثر طلبًا."} max={c.sectionContent.bestSellers?.maxProducts ?? 9} href={buildStoreUrl(c.store.slug, "/products")} />
      ) : null,
      "الأكثر مبيعًا",
      "هتظهر هنا لوحدها أول ما المتجر يبدأ يبيع.",
    ),
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    return orEmpty(
      list.length > 0 ? (
        <DealsBand
          products={list}
          storeSlug={c.store.slug}
          title={u?.headline || "عروض ما تتفوتش."}
          lowStock={u?.showStockBadge !== false}
          timer={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
        />
      ) : null,
      "عرض لفترة محدودة",
      "حط سعر قبل الخصم على منتجاتك وهتظهر هنا، واضبط العداد من هنا.",
    );
  },
  showCollections: (c) => orEmpty(c.sectionContent.collections?.items?.length || c.categories.filter((k) => k.productCount > 0).length > 1 ? <PromoTiles content={c.sectionContent.collections} categories={c.categories} storeSlug={c.store.slug} /> : null, "معرض المجموعات", "هيتملى من تصنيفاتك أول ما يبقى عندك تصنيفين فيهم منتجات."),
  showFeaturedProducts: (c) =>
    orEmpty(
      c.featured.length > 0 ? <BigShelf products={c.featured} storeSlug={c.store.slug} title="مختاراتنا." tagline="اللي بننصحك بيه دلوقتي." href={buildStoreUrl(c.store.slug, "/products?featured=true")} /> : null,
      "المنتجات المميزة",
      "علّم منتجاتك كمميزة وهتظهر هنا.",
    ),
  showSpotlight: (c) => {
    const p = spotlit(c);
    return orEmpty(p ? <Spotlight product={p} storeSlug={c.store.slug} /> : null, "منتج تحت الأضواء", "علّم منتج كمميز وهيظهر هنا على الخلفية السودا.");
  },
  showHeroBanner: (c) => orEmpty(c.sectionContent.heroBanner?.backgroundImage || c.sectionContent.heroBanner?.headline ? <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} dir={c.dir} /> : null, "بانر مخصص", "اضغط هنا وحط صورتك وكلامك."),
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <Band className="sg-section">
        <Wrap>
          <SectionHeader title="وصل حديثًا." tagline="شوف الجديد." href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
          <ProductGrid products={c.latest} storeSlug={c.store.slug} />
        </Wrap>
      </Band>
    ) : (
      <Wrap className="sg-section">
        <Empty
          icon={<ShoppingBag />}
          title="المنتجات جاية قريب"
          description="المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب."
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "gray" })}>
              تواصل مع المتجر
            </Link>
          }
        />
      </Wrap>
    ),
  showSocialProof: (c) => orEmpty(c.sectionContent.socialProof?.stats?.some((s) => s.value?.trim()) ? <Stats content={c.sectionContent.socialProof} /> : null, "أرقام الثقة", "اضغط هنا واكتب أرقامك الحقيقية."),
  showTestimonials: (c) => orEmpty(c.sectionContent.testimonials?.items?.some((t) => t.text?.trim()) ? <Testimonials content={c.sectionContent.testimonials} /> : null, "آراء العملاء", "اضغط هنا وضيف آراء عملائك."),
  showAboutBrand: (c) => orEmpty(c.sectionContent.aboutBrand?.text?.trim() || c.sectionContent.aboutBrand?.headline?.trim() || c.store.description?.trim() ? <AboutBrand content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} description={c.store.description} /> : null, "عن المتجر", "اضغط هنا واحكي قصة متجرك."),
  showRichText: (c) => orEmpty(c.sectionContent.richText?.heading?.trim() || c.sectionContent.richText?.paragraph?.trim() ? <RichText content={c.sectionContent.richText} /> : null, "نص", "اضغط هنا واكتب عنوان وفقرة."),
  showWhyChooseUs: (c) => orEmpty(c.sectionContent.whyChooseUs?.cards?.some((k) => k.title?.trim()) ? <TrustRow content={c.sectionContent.whyChooseUs} storeName={c.store.name} /> : null, "ليه تشتري مننا؟", "اضغط هنا واكتب مميزات متجرك."),
  showNewsletter: (c) => <JoinBand content={c.sectionContent.newsletter} storeName={c.store.name} storeSlug={c.store.slug} whatsappHref={whatsappHref(c.whatsapp)} />,
};

export default function StageHome(props: HomeViewProps) {
  return <div className="sg-home">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
