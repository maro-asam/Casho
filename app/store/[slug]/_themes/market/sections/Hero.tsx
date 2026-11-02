"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, CategoryLink, ProductCardData } from "../../types";
import { openSearch } from "../lib/events";
import { CategoryIcon } from "../lib/category-icon";
import { greeting } from "../lib/market";
import { PlateImage, Wrap } from "../ui";
import HeroSlider from "./HeroSlider";

const noSubscribe = () => () => {};

/** "صباح الخير", from the shopper's own clock (the server has no idea). */
function Greeting({ name }: { name: string }) {
  const hello = useSyncExternalStore(
    noSubscribe,
    () => greeting(new Date().getHours()),
    () => "أهلًا بيك",
  );
  return (
    <h1 className="mk-display text-balance">
      {hello}،
      <br />
      <span className="text-(--mk-label-2)">{name} فاتح.</span>
    </h1>
  );
}

/** No banners yet (or Studio → minimal): a greeting, one big search field and
 *  the top aisles, so even a kiosk with ten products opens like an app. */
function Welcome({ store, categories, products, plain }: { store: HeroProps["store"]; categories: CategoryLink[]; products: ProductCardData[]; plain?: boolean }) {
  const aisles = categories.filter((c) => c.productCount > 0).slice(0, 6);
  const stage = plain ? [] : products.slice(0, 4);
  return (
    <Wrap className="mk-welcome">
      <div className="min-w-0">
        <Greeting name={store.name} />
        <button type="button" onClick={openSearch} className="mk-searchpill mk-searchpill--hero">
          <Search />
          <span className="truncate">عايز تشتري إيه النهارده؟</span>
        </button>
        {aisles.length > 0 && (
          <ul className="mk-rail mk-bleed mt-4 gap-2">
            {aisles.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="mk-opt">
                  <CategoryIcon name={c.name} className="size-4 text-(--mk-label-2)" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {stage.length > 0 && (
        <ul aria-hidden className="mk-stage">
          {stage.map((p, i) => (
            <li key={p.id} className="mk-media relative" data-i={i}>
              <PlateImage src={p.image} sizes="14rem" priority />
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

type HeroProps = {
  style: HeroStyle;
  store: { name: string; slug: string; description: string | null };
  banners: BannerData[];
  categories: CategoryLink[];
  products: ProductCardData[];
};

/** Studio "hero" setting:
 *  fullscreen — one big rounded tile at a time (theme default)
 *  split      — copy on a tile beside the photo
 *  compact    — short promo cards you swipe through
 *  minimal    — greeting and search, no pictures
 *  Without banners every style but minimal shows the greeting with products. */
export default function Hero({ style, store, banners, categories, products }: HeroProps) {
  if (style === "minimal" || banners.length === 0) return <Welcome store={store} categories={categories} products={products} plain={style === "minimal"} />;
  return <HeroSlider banners={banners} storeSlug={store.slug} variant={style === "split" ? "split" : style === "compact" ? "compact" : "full"} />;
}
