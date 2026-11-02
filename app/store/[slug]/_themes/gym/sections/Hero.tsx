import type { CSSProperties } from "react";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, CategoryLink, ProductCardData } from "../../types";
import SearchBar from "../header/SearchBar";
import { CategoryIcon } from "../lib/category-icon";
import { Arrow, PlateImage, Wrap, btn, num } from "../ui";
import HeroSlider from "./HeroSlider";
import WeightPlate from "./WeightPlate";

type HeroProps = {
  style: HeroStyle;
  store: { name: string; slug: string; description: string | null };
  banners: BannerData[];
  categories: CategoryLink[];
  /** The store's strongest products, for the poster's stage. */
  products: ProductCardData[];
};

/** The store's name set as big as it fits. */
function megaClass(name: string) {
  const n = [...name].length;
  return n <= 10 ? "gy-mega" : n <= 18 ? "gy-mega gy-mega--md" : "gy-mega gy-mega--sm";
}

const STAGE: CSSProperties[] = [
  { "--w": "52%", "--x": "24%", "--y": "9%", "--z": 3 } as CSSProperties,
  { "--w": "33%", "--x": "0%", "--y": "52%", "--z": 2 } as CSSProperties,
  { "--w": "33%", "--x": "67%", "--y": "55%", "--z": 1 } as CSSProperties,
];

/** Stage: a turning plate, a red slash and up to three real products on chalk. */
function Stage({ storeName, storeSlug, products }: { storeName: string; storeSlug: string; products: ProductCardData[] }) {
  return (
    <div className="gy-stage">
      {products.length > 0 && <span aria-hidden className="gy-stage-slash" />}
      <WeightPlate label={storeName} />
      {products.map((p, i) => (
        <Link key={p.id} href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} className="gy-stage-item" style={STAGE[i]}>
          <span className="gy-stage-plate">
            <PlateImage src={p.image} priority sizes="(max-width: 1024px) 60vw, 24rem" alt={p.name} />
          </span>
          <span className="gy-stage-tag">
            <span className="truncate font-bold text-(--gy-ink) max-sm:sr-only">{p.name}</span>
            <span className="gy-price shrink-0 text-(--gy-link)">{formatPrice(p.price)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Used when the merchant has no banners yet, so a brand-new store still opens
 *  on a full poster: the store's name huge, its real numbers and products. */
function Poster({ store, categories, products, short }: Pick<HeroProps, "store" | "categories" | "products"> & { short?: boolean }) {
  const shelves = categories.filter((c) => c.productCount > 0);
  const total = shelves.reduce((t, c) => t + c.productCount, 0);
  const stage = products.slice(0, short ? 1 : 3);
  return (
    <section className="gy-poster">
      <span aria-hidden className="gy-poster-ghost gy-outline">
        {store.name}
      </span>
      <div className={cn("gy-wrap gy-poster-grid", short && "lg:!min-h-0 lg:!py-10")}>
        <div className="min-w-0">
          <h1 className={cn(megaClass(store.name), "text-balance")}>{store.name}</h1>
          {store.description && <p className="mt-4 line-clamp-3 max-w-xl text-base leading-8 text-(--gy-text) sm:text-lg">{store.description}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
              ابدأ التسوق
              <Arrow />
            </Link>
            {shelves.length > 0 && (
              <Link href={buildStoreUrl(store.slug, "/categories")} className={btn({ size: "lg", variant: "outline" })}>
                كل الأقسام
              </Link>
            )}
          </div>
          {total > 0 && !short && (
            <dl className="gy-poster-stats">
              <div>
                <dt>منتج</dt>
                <dd>{num(total)}</dd>
              </div>
              <div>
                <dt>قسم</dt>
                <dd>{num(shelves.length)}</dd>
              </div>
            </dl>
          )}
        </div>
        <Stage storeName={store.name} storeSlug={store.slug} products={stage} />
      </div>
    </section>
  );
}

/** Text only: the store's name, description, a big search and quick shelves. */
function SearchHero({ store, categories }: Pick<HeroProps, "store" | "categories">) {
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, 6);
  return (
    <section className="gy-poster gy-knurl py-12 sm:py-20">
      <Wrap>
        <h1 className={cn(megaClass(store.name), "max-w-[14ch] text-balance")}>{store.name}</h1>
        {store.description && <p className="mt-4 line-clamp-3 max-w-2xl text-base leading-8 text-(--gy-text) sm:text-lg">{store.description}</p>}
        <SearchBar shell={{ slug: store.slug, categories }} size="lg" className="mt-7 max-w-2xl" />
        {shelves.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="أقسام سريعة">
            {shelves.map((c) => (
              <li key={c.id}>
                <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="gy-opt min-h-10 gap-1.5 px-3.5 text-[0.8125rem]">
                  <CategoryIcon name={c.name} className="size-4 text-(--gy-link)" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Wrap>
    </section>
  );
}

/** Gym tape under the hero: the store's real shelves on a slow loop. */
function ShelfTape({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, 10);
  if (shelves.length < 2) return null;
  const run = Array.from({ length: Math.max(2, Math.ceil(10 / shelves.length)) }, () => shelves).flat();
  return (
    <div className="gy-tape-wrap gy-marquee !pt-0 -mt-3">
      <div className="gy-tape py-2.5">
        <nav aria-label="الأقسام" className="sr-only">
          <ul>
            {shelves.map((c) => (
              <li key={c.id}>
                <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} tabIndex={-1}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="gy-marquee-track" aria-hidden style={{ ["--gy-marquee-dur" as string]: `${run.length * 5}s` }}>
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {run.map((c, i) => (
                <li key={i} className="gy-tape-item">
                  {c.name}
                  <i />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Home hero, following the Studio "main banner" setting:
 *  fullscreen — full-bleed slideshow (no banners yet: the poster)
 *  split      — copy on the page, the photo behind a slanted edge
 *  compact    — a shorter slideshow inside the page width
 *  minimal    — text only: store name, description and a big search */
export default function Hero({ style, store, banners, categories, products }: HeroProps) {
  const title = <h1 className="sr-only">{store.name}</h1>;
  const tape = <ShelfTape categories={categories} storeSlug={store.slug} />;

  if (style === "minimal") {
    return (
      <>
        <SearchHero store={store} categories={categories} />
        {tape}
      </>
    );
  }

  if (banners.length === 0) {
    return (
      <>
        <Poster store={store} categories={categories} products={products} short={style === "compact"} />
        {tape}
      </>
    );
  }

  if (style === "fullscreen") {
    return (
      <>
        {title}
        <HeroSlider banners={banners} storeSlug={store.slug} variant="full" height="h-[min(82dvh,50rem)] min-h-[26rem]" />
        {tape}
      </>
    );
  }

  if (style === "compact") {
    return (
      <>
        <Wrap className="pt-4 sm:pt-6">
          {title}
          <HeroSlider banners={banners} storeSlug={store.slug} variant="contained" height="h-64 sm:h-80 lg:h-[26rem]" />
        </Wrap>
        <div className="h-5" />
        {tape}
      </>
    );
  }

  return (
    <>
      {title}
      <HeroSlider banners={banners} storeSlug={store.slug} variant="split" height="h-[32rem] lg:h-[min(76dvh,44rem)]" />
      {tape}
    </>
  );
}
