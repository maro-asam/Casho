import Link from "next/link";
import { Gem } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import { whatsappHref } from "../../shared/social";
import type { HomeViewProps, ProductCardData } from "../../types";
import { ProductGrid } from "../product/ProductCard";
import Cameos from "../sections/Cameos";
import Countdown from "../sections/Countdown";
import { AboutBrand, Collections, JoinBand, MediaBanner, OfferStrip, Promises, RichText, Stats, Testimonials } from "../sections/Editorial";
import GiftFinder from "../sections/GiftFinder";
import Hero from "../sections/Hero";
import { BestSellers, DealsBand, FeaturedEdit } from "../sections/ProductSections";
import StudioEmpty from "../sections/StudioEmpty";
import { Band, Empty, SectionHead, Wrap, btn, discountPercent } from "../ui";

type Ctx = HomeViewProps;

/** Distinct products across the lists the page already loaded. */
function unique(c: Ctx) {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest].filter((p) => !seen.has(p.id) && seen.add(p.id));
}

/** Every in-stock piece on the page with a real discount, best first. */
function deals(c: Ctx): ProductCardData[] {
  return unique(c)
    .filter((p) => p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** A section that's on but has nothing to show yet: a marker in the Studio
 *  canvas, nothing on the live store. */
const orEmpty = (node: React.ReactNode, title: string, hint: string) => node ?? <StudioEmpty title={title} hint={hint} />;

/** Casho Qirat's section registry: every merchant section key → a Qirat
 *  section. Order and visibility come from the Studio. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) => <Hero style={c.layout.heroStyle} store={c.store} banners={c.banners} products={unique(c).filter((p) => p.stock > 0)} />,
  showOfferStrip: (c) => orEmpty(c.sectionContent.offerStrip?.items?.some((s) => s.trim()) ? <OfferStrip content={c.sectionContent.offerStrip} /> : null, "شريط العروض", "اضغط هنا واكتب عروضك."),
  showCategories: (c) =>
    orEmpty(
      c.categories.some((k) => k.productCount > 0) ? <Cameos categories={c.categories} storeSlug={c.store.slug} style={c.layout.categoryCardStyle} /> : null,
      "التصنيفات",
      "هتظهر هنا أول ما تضيف تصنيف فيه منتجات.",
    ),
  showFeaturedProducts: (c) =>
    orEmpty(c.featured.length > 0 ? <FeaturedEdit products={c.featured} storeSlug={c.store.slug} href={buildStoreUrl(c.store.slug, "/products?featured=true")} /> : null, "المنتجات المميزة", "علّم منتجاتك كمميزة وهتظهر هنا."),
  showCollections: (c) =>
    orEmpty(
      c.sectionContent.collections?.items?.length || c.categories.filter((k) => k.productCount > 0).length > 1 ? <Collections content={c.sectionContent.collections} categories={c.categories} storeSlug={c.store.slug} /> : null,
      "معرض المجموعات",
      "هيتملى من تصنيفاتك أول ما يبقى عندك تصنيفين فيهم منتجات.",
    ),
  showBestSellers: (c) =>
    orEmpty(
      c.bestSellers.length > 0 ? (
        <BestSellers products={c.bestSellers} storeSlug={c.store.slug} title={c.sectionContent.bestSellers?.headline || "القطع اللي الكل بيسأل عليها"} max={c.sectionContent.bestSellers?.maxProducts ?? 8} href={buildStoreUrl(c.store.slug, "/products")} />
      ) : null,
      "الأكثر مبيعًا",
      "هتظهر هنا لوحدها أول ما المتجر يبدأ يبيع.",
    ),
  showGiftFinder: (c) => {
    const list = unique(c);
    return orEmpty(
      list.length >= 3 ? <GiftFinder products={list} categories={c.categories} storeSlug={c.store.slug} storeName={c.store.name} whatsappHref={whatsappHref(c.whatsapp)} /> : null,
      "مساعد الهدايا",
      "هيشتغل لوحده أول ما يبقى عندك ٣ منتجات أو أكتر — الميزانيات بتتحسب من أسعارك الحقيقية.",
    );
  },
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    return orEmpty(
      list.length > 0 ? (
        <DealsBand
          products={list}
          storeSlug={c.store.slug}
          title={u?.headline || "عرض خاص على قطع مختارة"}
          lowStock={u?.showStockBadge !== false}
          timer={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
        />
      ) : null,
      "عرض لفترة محدودة",
      "حط سعر قبل الخصم على منتجاتك وهتظهر هنا، واضبط العداد من هنا.",
    );
  },
  showHeroBanner: (c) => orEmpty(c.sectionContent.heroBanner?.backgroundImage || c.sectionContent.heroBanner?.headline ? <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} dir={c.dir} /> : null, "بانر مخصص", "اضغط هنا وحط صورتك وكلامك."),
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <Band className="qr-section">
        <Wrap>
          <SectionHead kicker="وصل حديثًا" title="أحدث القطع" href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
          <ProductGrid products={c.latest} storeSlug={c.store.slug} />
        </Wrap>
      </Band>
    ) : (
      <Wrap className="qr-section">
        <Empty
          icon={<Gem />}
          title="القطع جاية قريب"
          description="المتجر بيجهز مجموعته دلوقتي. ارجع تاني قريب."
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "outline" })}>
              تواصل مع المتجر
            </Link>
          }
        />
      </Wrap>
    ),
  showWhyChooseUs: (c) => orEmpty(c.sectionContent.whyChooseUs?.cards?.some((k) => k.title?.trim()) ? <Promises content={c.sectionContent.whyChooseUs} storeName={c.store.name} /> : null, "ليه تشتري مننا؟", "اضغط هنا واكتب مميزات متجرك."),
  showAboutBrand: (c) =>
    orEmpty(
      c.sectionContent.aboutBrand?.text?.trim() || c.sectionContent.aboutBrand?.headline?.trim() || c.store.description?.trim() ? (
        <AboutBrand content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} description={c.store.description} />
      ) : null,
      "عن المتجر",
      "اضغط هنا واحكي قصة متجرك.",
    ),
  showSocialProof: (c) => orEmpty(c.sectionContent.socialProof?.stats?.some((s) => s.value?.trim()) ? <Stats content={c.sectionContent.socialProof} /> : null, "أرقام الثقة", "اضغط هنا واكتب أرقامك الحقيقية."),
  showTestimonials: (c) => orEmpty(c.sectionContent.testimonials?.items?.some((t) => t.text?.trim()) ? <Testimonials content={c.sectionContent.testimonials} /> : null, "آراء العملاء", "اضغط هنا وضيف آراء عملائك."),
  showRichText: (c) => orEmpty(c.sectionContent.richText?.heading?.trim() || c.sectionContent.richText?.paragraph?.trim() ? <RichText content={c.sectionContent.richText} /> : null, "نص", "اضغط هنا واكتب عنوان وفقرة."),
  showNewsletter: (c) => <JoinBand content={c.sectionContent.newsletter} storeName={c.store.name} storeSlug={c.store.slug} whatsappHref={whatsappHref(c.whatsapp)} />,
};

export default function QiratHome(props: HomeViewProps) {
  return <div className="qr-home">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
