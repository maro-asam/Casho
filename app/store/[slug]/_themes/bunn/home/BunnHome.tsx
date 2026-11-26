import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { renderSections, type SectionRegistry } from "../../shared/sections";
import { whatsappHref } from "../../shared/social";
import type { HomeViewProps, ProductCardData } from "../../types";
import { BeanIcon } from "../icons";
import { BREW_IDS, brewsForRoast, type BrewId } from "../lib/coffee";
import { ProductGrid, cardProfile } from "../product/ProductCard";
import BrewGuide, { type BrewPick } from "../sections/BrewGuide";
import Categories from "../sections/Categories";
import Countdown from "../sections/Countdown";
import { AboutBrand, Collections, JoinBand, MediaBanner, OfferStrip, Promises, RichText, Stats, Testimonials } from "../sections/Editorial";
import Hero from "../sections/Hero";
import Origins, { originsOf } from "../sections/Origins";
import { BestSellers, DealsBand, RoasterPick } from "../sections/ProductSections";
import StudioEmpty from "../sections/StudioEmpty";
import { Band, Empty, SectionHead, Wrap, btn, discountPercent } from "../ui";
import { st } from "@/lib/i18n/storefront";

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

/** For each brew method, the store's coffees that suit it: the ones whose
 *  details name it first, then the ones whose roast suits it. */
function brewPicks(products: ProductCardData[]): Record<BrewId, BrewPick[]> {
  const coffees = products.filter((p) => p.stock > 0).map((p) => ({ p, prof: cardProfile(p) })).filter((x) => x.prof.isCoffee);
  const out = {} as Record<BrewId, BrewPick[]>;
  for (const id of BREW_IDS) {
    const named = coffees.filter((x) => x.prof.brew.includes(id));
    const byRoast = coffees.filter((x) => !x.prof.brew.length && brewsForRoast(x.prof.roast?.level ?? null).includes(id));
    out[id] = [...named, ...byRoast].slice(0, 3).map(({ p, prof }) => ({ slug: p.slug, name: p.name, image: p.image, price: p.price, compareAtPrice: p.compareAtPrice, roast: prof.roast?.level ?? null }));
  }
  return out;
}

/** A section that's on but has nothing to show yet: a marker in the Studio
 *  canvas, nothing on the live store. */
const orEmpty = (node: React.ReactNode, title: string, hint: string) => node ?? <StudioEmpty title={title} hint={hint} />;

/** Casho Bunn's section registry: every merchant section key → a Bunn
 *  section. Order and visibility come from the Studio. */
const REGISTRY: SectionRegistry<Ctx> = {
  showHero: (c) => <Hero style={c.layout.heroStyle} store={c.store} banners={c.banners} products={unique(c).filter((p) => p.stock > 0)} categories={c.categories} />,
  showOfferStrip: (c) => orEmpty(c.sectionContent.offerStrip?.items?.some((s) => s.trim()) ? <OfferStrip content={c.sectionContent.offerStrip} /> : null, st("شريط العروض"), st("اضغط هنا واكتب عروضك.")),
  showCategories: (c) =>
    orEmpty(
      c.categories.some((k) => k.productCount > 0) ? <Categories categories={c.categories} storeSlug={c.store.slug} style={c.layout.categoryCardStyle} /> : null,
      st("الأقسام"),
      st("هتظهر هنا أول ما تضيف قسم فيه منتجات."),
    ),
  showFeaturedProducts: (c) =>
    orEmpty(c.featured.length > 0 ? <RoasterPick products={c.featured} storeSlug={c.store.slug} href={buildStoreUrl(c.store.slug, "/products?featured=true")} /> : null, st("المنتجات المميزة"), st("علّم منتجاتك كمميزة وهتظهر هنا.")),
  showOrigins: (c) => {
    const origins = originsOf(unique(c));
    return orEmpty(
      origins.length > 0 ? <Origins origins={origins} storeSlug={c.store.slug} /> : null,
      st("حزام البن"),
      st("اكتب «المنشأ» في خصائص منتجات البن (أو اسم البلد في اسم المنتج) وهتظهر على الخريطة."),
    );
  },
  showBrewGuide: (c) => <BrewGuide picks={brewPicks(unique(c))} storeSlug={c.store.slug} storeName={c.store.name} whatsappHref={whatsappHref(c.whatsapp)} />,
  showCollections: (c) =>
    orEmpty(
      c.sectionContent.collections?.items?.length || c.categories.filter((k) => k.productCount > 0).length > 1 ? <Collections content={c.sectionContent.collections} categories={c.categories} storeSlug={c.store.slug} /> : null,
      st("معرض المجموعات"),
      st("هيتملى من أقسامك أول ما يبقى عندك قسمين فيهم منتجات."),
    ),
  showBestSellers: (c) =>
    orEmpty(
      c.bestSellers.length > 0 ? (
        <BestSellers products={c.bestSellers} storeSlug={c.store.slug} title={c.sectionContent.bestSellers?.headline || st("الأكتر طلبًا عندنا")} max={c.sectionContent.bestSellers?.maxProducts ?? 8} href={buildStoreUrl(c.store.slug, "/products")} />
      ) : null,
      st("الأكثر مبيعًا"),
      st("هتظهر هنا لوحدها أول ما المتجر يبدأ يبيع."),
    ),
  showUrgency: (c) => {
    const u = c.sectionContent.urgency;
    const list = deals(c);
    return orEmpty(
      list.length > 0 ? (
        <DealsBand
          products={list}
          storeSlug={c.store.slug}
          title={u?.headline || st("عرض خاص على قهوة مختارة")}
          lowStock={u?.showStockBadge !== false}
          timer={u?.timerEndDate ? <Countdown endDate={u.timerEndDate} label={u.timerLabel} /> : undefined}
        />
      ) : null,
      st("عرض لفترة محدودة"),
      st("حط سعر قبل الخصم على منتجاتك وهتظهر هنا، واضبط العداد من هنا."),
    );
  },
  showHeroBanner: (c) => orEmpty(c.sectionContent.heroBanner?.backgroundImage || c.sectionContent.heroBanner?.headline ? <MediaBanner content={c.sectionContent.heroBanner} storeSlug={c.store.slug} dir={c.dir} /> : null, st("بانر مخصص"), st("اضغط هنا وحط صورتك وكلامك.")),
  showLatestProducts: (c) =>
    c.latest.length > 0 ? (
      <Band className="bn-section">
        <Wrap>
          <SectionHead kicker={st("وصل جديد")} title={st("أحدث المنتجات")} href={buildStoreUrl(c.store.slug, "/products?sort=newest")} />
          <ProductGrid products={c.latest} storeSlug={c.store.slug} />
        </Wrap>
      </Band>
    ) : (
      <Wrap className="bn-section">
        <Empty
          icon={<BeanIcon />}
          title={st("القهوة جاية قريب")}
          description={st("المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب.")}
          action={
            <Link href={buildStoreUrl(c.store.slug, "/contact")} className={btn({ variant: "outline" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      </Wrap>
    ),
  showWhyChooseUs: (c) => orEmpty(c.sectionContent.whyChooseUs?.cards?.some((k) => k.title?.trim()) ? <Promises content={c.sectionContent.whyChooseUs} storeName={c.store.name} /> : null, st("ليه تشتري مننا؟"), st("اضغط هنا واكتب مميزات متجرك.")),
  showAboutBrand: (c) =>
    orEmpty(
      c.sectionContent.aboutBrand?.text?.trim() || c.sectionContent.aboutBrand?.headline?.trim() || c.store.description?.trim() ? (
        <AboutBrand content={c.sectionContent.aboutBrand} storeName={c.store.name} storeSlug={c.store.slug} description={c.store.description} />
      ) : null,
      st("عن المتجر"),
      st("اضغط هنا واحكي قصة متجرك."),
    ),
  showSocialProof: (c) => orEmpty(c.sectionContent.socialProof?.stats?.some((s) => s.value?.trim()) ? <Stats content={c.sectionContent.socialProof} /> : null, st("أرقام الثقة"), st("اضغط هنا واكتب أرقامك الحقيقية.")),
  showTestimonials: (c) => orEmpty(c.sectionContent.testimonials?.items?.some((t) => t.text?.trim()) ? <Testimonials content={c.sectionContent.testimonials} /> : null, st("آراء العملاء"), st("اضغط هنا وضيف آراء عملائك.")),
  showRichText: (c) => orEmpty(c.sectionContent.richText?.heading?.trim() || c.sectionContent.richText?.paragraph?.trim() ? <RichText content={c.sectionContent.richText} /> : null, st("نص"), st("اضغط هنا واكتب عنوان وفقرة.")),
  showNewsletter: (c) => <JoinBand content={c.sectionContent.newsletter} storeName={c.store.name} storeSlug={c.store.slug} whatsappHref={whatsappHref(c.whatsapp)} />,
};

export default function BunnHome(props: HomeViewProps) {
  return <div className="bn-home">{renderSections({ sections: props.sections, registry: REGISTRY, ctx: props })}</div>;
}
