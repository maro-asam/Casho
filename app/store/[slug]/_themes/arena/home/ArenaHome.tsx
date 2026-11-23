import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import { whatsappHref } from "../../shared/social";
import type { HomeViewProps, ProductCardData } from "../../types";
import Countdown from "../sections/Countdown";
import { AboutBrand, Collections, JoinBand, MediaBanner, OfferStrip, RichText, Section, Stats, Steps, Testimonials } from "../sections/Editorial";
import { GameGrid, gamesAvailable } from "../sections/Games";
import Hero from "../sections/Hero";
import StudioEmpty from "../sections/StudioEmpty";
import { featuredGameIds } from "../lib/arena";
import { Empty, PackageGrid, SectionHead, btn, discountPercent } from "../ui";
import { st } from "@/lib/i18n/storefront";

type Ctx = HomeViewProps;

/** Distinct products across the lists the page already loaded. */
function unique(c: Ctx) {
  const seen = new Set<string>();
  return [...c.featured, ...c.bestSellers, ...c.latest].filter((p) => !seen.has(p.id) && seen.add(p.id));
}

/** In-stock packages with a real discount, best first. */
function deals(c: Ctx): ProductCardData[] {
  return unique(c)
    .filter((p) => p.stock > 0 && discountPercent(p.price, p.compareAtPrice) > 0)
    .sort((a, b) => discountPercent(b.price, b.compareAtPrice) - discountPercent(a.price, a.compareAtPrice));
}

/** On in the Studio but nothing to show yet: a marker in the canvas, nothing live. */
const orEmpty = (node: React.ReactNode, title: string, hint: string) => node ?? <StudioEmpty title={title} hint={hint} />;

const shelf = (c: Ctx, products: ProductCardData[], title: string, note: string | undefined, href: string) =>
  products.length > 0 ? (
    <Section>
      <SectionHead title={title} note={note} href={href} />
      <PackageGrid products={products} storeSlug={c.store.slug} />
    </Section>
  ) : null;

/** Casho Arena's section registry. Order and visibility come from the Studio. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) => <Hero style={c.layout.heroStyle} store={c.store} banners={c.banners} categories={c.categories} />,
  showCategories: (c) =>
    c.categories.length > 0 ? (
      <Section id="games">
        <SectionHead title={st("اختار لعبتك أو تطبيقك")} note={gamesAvailable(c.categories)} />
        <GameGrid games={c.categories} storeSlug={c.store.slug} hot={featuredGameIds(c.categories, unique(c))} shape={c.layout.categoryCardStyle} />
      </Section>
    ) : (
      <Section>
        <Empty
          icon={<Gamepad2 />}
          title={st("الألعاب جاية قريب")}
          description={st("المتجر بيجهز باقاته دلوقتي. ارجع تاني قريب.")}
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "glass" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      </Section>
    ),
  showOfferStrip: (c) => orEmpty(c.sectionContent.offerStrip?.items?.some((s) => s.trim()) ? <OfferStrip content={c.sectionContent.offerStrip} /> : null, st("شريط العروض"), st("اضغط هنا واكتب عروضك.")),
  showFeaturedProducts: (c) => orEmpty(shelf(c, c.featured, st("الأكثر مبيعًا"), st("الباقات اللي الناس بتطلبها أكتر."), buildStoreUrl(c.store.slug, "/products?featured=true")), st("المنتجات المميزة"), st("علّم باقاتك كمميزة وهتظهر هنا.")),
  showBestSellers: (c) =>
    orEmpty(
      shelf(c, c.bestSellers.slice(0, c.sectionContent.bestSellers?.maxProducts ?? 8), c.sectionContent.bestSellers?.headline || st("الأكتر طلبًا"), undefined, buildStoreUrl(c.store.slug, "/products")),
      st("الأكثر مبيعًا"),
      st("هتظهر هنا لوحدها أول ما المتجر يبدأ يبيع."),
    ),
  showLatestProducts: (c) => shelf(c, c.latest, st("وصل حديثًا"), undefined, buildStoreUrl(c.store.slug, "/products?sort=newest")),
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    return orEmpty(
      list.length > 0 ? (
        <Section>
          <div className="an-sechead">
            <h2 className="an-h2">{u?.headline || st("عروض لفترة محدودة")}</h2>
            {u?.timerEndDate && <Countdown endDate={u.timerEndDate} label={u.timerLabel} />}
          </div>
          <PackageGrid products={list.slice(0, 8)} storeSlug={c.store.slug} />
        </Section>
      ) : null,
      st("عرض لفترة محدودة"),
      st("حط سعر قبل الخصم على باقاتك وهتظهر هنا، واضبط العداد من هنا."),
    );
  },
  showWhyChooseUs: (c) => <Steps content={c.sectionContent.whyChooseUs} askPlayer={c.layout.playerId !== false} />,
  showCollections: (c) => orEmpty(<Collections content={c.sectionContent.collections} categories={c.categories} storeSlug={c.store.slug} />, st("معرض المجموعات"), st("هيتملى من ألعابك أول ما يبقى عندك لعبتين بصور.")),
  showHeroBanner: (c) => orEmpty(c.sectionContent.heroBanner?.backgroundImage || c.sectionContent.heroBanner?.headline ? <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} /> : null, st("بانر مخصص"), st("اضغط هنا وحط صورتك وكلامك.")),
  showSocialProof: (c) => orEmpty(c.sectionContent.socialProof?.stats?.some((s) => s.value?.trim()) ? <Stats content={c.sectionContent.socialProof} /> : null, st("أرقام الثقة"), st("اضغط هنا واكتب أرقامك الحقيقية.")),
  showTestimonials: (c) => orEmpty(c.sectionContent.testimonials?.items?.some((t) => t.text?.trim()) ? <Testimonials content={c.sectionContent.testimonials} /> : null, st("آراء العملاء"), st("اضغط هنا وضيف آراء عملائك.")),
  showAboutBrand: (c) =>
    orEmpty(
      c.sectionContent.aboutBrand?.text?.trim() || c.sectionContent.aboutBrand?.headline?.trim() || c.store.description?.trim() ? (
        <AboutBrand content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} description={c.store.description} />
      ) : null,
      st("عن المتجر"),
      st("اضغط هنا واحكي قصة متجرك."),
    ),
  showRichText: (c) => orEmpty(c.sectionContent.richText?.heading?.trim() || c.sectionContent.richText?.paragraph?.trim() ? <RichText content={c.sectionContent.richText} /> : null, st("نص"), st("اضغط هنا واكتب عنوان وفقرة.")),
  showNewsletter: (c) => orEmpty(c.whatsapp ? <JoinBand content={c.sectionContent.newsletter} storeName={c.store.name} whatsappHref={whatsappHref(c.whatsapp)} /> : null, st("تابعنا"), st("ضيف رقم واتساب المتجر وهيظهر هنا.")),
};

export default function ArenaHome(props: HomeViewProps) {
  return <div className="an-home">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
