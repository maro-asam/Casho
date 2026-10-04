import Link from "next/link";
import type { ReactNode } from "react";
import { ShoppingBag } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/types/store-theme.types";
import SectionRenderer from "../../../_components/sections/SectionRenderer";
import type { HomeViewProps } from "../../types";
import { RuledGrid } from "../product/ProductCard";
import { Arrow, Empty, SectionHead, Wrap } from "../ui";
import Arcade from "./Arcade";
import EditorsPick from "./EditorsPick";
import Hero, { Ticker } from "./Hero";
import Plates from "./Plates";
import Ranked from "./Ranked";

export default function RiwaqHome({
  store,
  banners,
  categories,
  featured,
  latest,
  bestSellers,
  sections,
  sectionContent,
}: HomeViewProps) {
  const url = (p: string) => buildStoreUrl(store.slug, p);

  // Saved order first, then any enabled section that isn't in it yet.
  const baseOrder: SectionKey[] = sections.sectionOrder ?? DEFAULT_SECTION_ORDER;
  const order: SectionKey[] = [
    ...baseOrder,
    ...DEFAULT_SECTION_ORDER.filter((k) => !baseOrder.includes(k) && sections[k as keyof typeof sections] === true),
  ];

  // Product sections are numbered in the order they appear: ٠١, ٠٢, …
  let chapter = 0;
  const next = () => ++chapter;

  const core: Partial<Record<SectionKey, () => ReactNode>> = {
    showHero: () =>
      sections.showHero ? (
        <>
          <Hero
            store={store}
            banners={banners}
            products={featured.length ? featured : latest}
            hasCategories={categories.length > 0}
          />
          <Ticker words={categories.length >= 2 ? categories.slice(0, 8).map((c) => c.name) : [store.name, "وصل حديثًا", "مختارات المتجر"]} />
          {banners.length > 0 && <Plates banners={banners} storeSlug={store.slug} />}
        </>
      ) : null,

    showCategories: () =>
      sections.showCategories && categories.length > 0 ? (
        <Wrap className="rq-section rq-reveal">
          <SectionHead index={next()} title="التصنيفات" href={url("/categories")} linkLabel="الفهرس الكامل" />
          <Arcade categories={categories.slice(0, 10)} storeSlug={store.slug} />
        </Wrap>
      ) : null,

    showFeaturedProducts: () =>
      sections.showFeaturedProducts && featured.length > 0 ? (
        <Wrap className="rq-section rq-reveal">
          <SectionHead index={next()} title="اختيارات المتجر" href={url("/products?featured=true")} />
          <EditorsPick products={featured} storeSlug={store.slug} />
        </Wrap>
      ) : null,

    showBestSellers: () =>
      sections.showBestSellers && bestSellers.length > 0 ? (
        <Wrap className="rq-section rq-reveal">
          <SectionHead
            index={next()}
            title={sectionContent.bestSellers?.headline || "الأكثر مبيعًا"}
            subtitle="اللي العملاء بيرجعوا يطلبوه"
            href={url("/products")}
          />
          <Ranked products={bestSellers} storeSlug={store.slug} />
        </Wrap>
      ) : null,

    showLatestProducts: () =>
      sections.showLatestProducts ? (
        <Wrap className="rq-section">
          <SectionHead index={next()} title="وصل حديثًا" href={latest.length ? url("/products") : undefined} />
          {latest.length > 0 ? (
            <>
              <RuledGrid products={latest} storeSlug={store.slug} />
              <Link
                href={url("/products")}
                className="group flex min-h-20 items-center justify-between gap-6 border-b border-(--rq-ink) transition-colors hover:text-(--rq-accent)"
              >
                <span className="rq-h3">تصفّح كل المنتجات</span>
                <Arrow className="text-2xl" />
              </Link>
            </>
          ) : (
            <Empty
              icon={<ShoppingBag />}
              title="المنتجات جاية قريب"
              description="المتجر بيجهز منتجاته دلوقتي. ارجع تاني قريب."
            />
          )}
        </Wrap>
      ) : null,
  };

  return (
    <div className="pb-4">
      {order.map((key) => {
        const render = core[key];
        if (render) {
          const node = render();
          return node ? <div key={key}>{node}</div> : null;
        }

        if (!sections[key as keyof typeof sections]) return null;

        // Merchant-configured content sections (offer strip is full-bleed)
        const content = (
          <SectionRenderer sectionKey={key} store={store} sectionContent={sectionContent} categories={categories} />
        );
        return key === "showOfferStrip" ? (
          <div key={key} className="my-[calc(var(--rq-section)/2)]">
            {content}
          </div>
        ) : (
          <Wrap key={key} className="rq-section">
            {content}
          </Wrap>
        );
      })}
    </div>
  );
}
