import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, ProductCardData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import Rail from "../product/Rail";
import { MoreLink, PlateImage, Wrap, btn, delay } from "../ui";

type Store = { name: string; slug: string; description: string | null };

/** The banner's two actions, apple.com style: the merchant's button filled,
 *  "shop everything" beside it. `onMedia` sets them for a photo behind. */
function Actions({ banner, storeSlug, onMedia }: { banner: BannerData; storeSlug: string; onMedia?: boolean }) {
  return (
    <div className="sg-hero-ctas">
      {banner.link && (
        <BannerLink banner={banner} storeSlug={storeSlug} className={btn()}>
          {banner.cta}
        </BannerLink>
      )}
      {onMedia ? (
        <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: banner.link ? "outline" : "solid" })}>
          تسوّق الكل
        </Link>
      ) : (
        <MoreLink href={buildStoreUrl(storeSlug, "/products")} className="text-[1.0625rem]">
          تسوّق الكل
        </MoreLink>
      )}
    </div>
  );
}

/** apple.com home tile: the photo fills the screen, the claim sits centered on
 *  top of it. */
function FullHero({ banner, storeSlug }: { banner: BannerData; storeSlug: string }) {
  return (
    <section className="sg-hero" data-media="true">
      <BannerImage banner={banner} sizes="100vw" priority className="sg-hero-img object-cover" />
      <span aria-hidden className="sg-hero-shade" />
      <div className="sg-hero-copy">
        <h1 className="sg-hero-title sg-rise text-balance">{banner.title}</h1>
        {banner.subtitle && (
          <p className="sg-hero-sub sg-rise text-balance" style={delay(1)}>
            {banner.subtitle}
          </p>
        )}
        <div className="sg-rise" style={delay(2)}>
          <Actions banner={banner} storeSlug={storeSlug} onMedia />
        </div>
      </div>
    </section>
  );
}

/** Copy on the start side, the photo on a large rounded tile beside it. */
function SplitHero({ banner, store }: { banner: BannerData; store: Store }) {
  return (
    <Wrap className="sg-hero-split">
      <div className="min-w-0">
        <p className="sg-eyebrow sg-rise !text-(--sg-label-2)">{store.name}</p>
        <h1 className="sg-display sg-rise mt-2 text-balance" style={delay(1)}>
          {banner.title}
        </h1>
        {banner.subtitle && (
          <p className="sg-lead sg-rise mt-4 text-balance" style={delay(2)}>
            {banner.subtitle}
          </p>
        )}
        <div className="sg-rise" style={delay(3)}>
          <Actions banner={banner} storeSlug={store.slug} />
        </div>
      </div>
      <BannerLink banner={banner} storeSlug={store.slug} className="sg-hero-split-media" aria-label={banner.title} tabIndex={-1}>
        <BannerImage banner={banner} sizes="(max-width: 1024px) 100vw, 55vw" priority className="sg-zoom-img object-cover" />
      </BannerLink>
    </Wrap>
  );
}

/** apple.com/store's header: the store's name huge, a gray line beside it,
 *  then every banner as a card on a shelf. */
function StoreHead({ store, banners }: { store: Store; banners: BannerData[] }) {
  const line = store.description?.split(/[.\n]/)[0]?.trim() || "أحسن طريقة تشتري الحاجات اللي بتحبها.";
  return (
    <section className="sg-storehead">
      <Wrap className="sg-storehead-top">
        <h1 className="sg-storehead-title sg-rise">{store.name}</h1>
        <p className="sg-storehead-line sg-rise text-balance" style={delay(1)}>
          {line}
        </p>
      </Wrap>
      {banners.length > 0 && (
        <Rail label="عروض المتجر" listClassName="sg-shelf--banners">
          {banners.map((b, i) => (
            <li key={b.id}>
              <BannerLink banner={b} storeSlug={store.slug} className="sg-bannercard group" aria-label={b.title}>
                <BannerImage banner={b} sizes="(max-width: 768px) 88vw, 40rem" priority={i < 2} className="sg-zoom-img object-cover" />
                <span aria-hidden className="sg-hero-shade" />
                <span className="sg-bannercard-copy">
                  <span className="sg-h3 block text-balance">{b.title}</span>
                  {b.subtitle && <span className="mt-1 line-clamp-2 block text-[0.9375rem] opacity-90">{b.subtitle}</span>}
                  {b.link && <span className="sg-link-light mt-3 inline-flex">{b.cta} ›</span>}
                </span>
              </BannerLink>
            </li>
          ))}
        </Rail>
      )}
    </section>
  );
}

/** No banners yet (or Studio → minimal): the store's name in the tint's
 *  gradient, and up to three of its products standing on the stage below. */
function StageHero({ store, products }: { store: Store; products: ProductCardData[] }) {
  const podium = products.slice(0, 3);
  return (
    <section className="sg-stagehero">
      <Wrap className="text-center">
        <h1 className="sg-hero-title sg-gradient-text sg-rise mx-auto text-balance">{store.name}</h1>
        <p className="sg-hero-sub sg-rise mx-auto text-balance" style={delay(1)}>
          {store.description?.split("\n")[0]?.trim() || "كل اللي بتحبه، في مكان واحد."}
        </p>
        <div className="sg-hero-ctas sg-rise justify-center" style={delay(2)}>
          <Link href={buildStoreUrl(store.slug, "/products")} className={btn()}>
            تسوّق دلوقتي
          </Link>
          <MoreLink href={buildStoreUrl(store.slug, "/categories")} className="text-[1.0625rem]">
            كل الأقسام
          </MoreLink>
        </div>
      </Wrap>
      {podium.length > 0 && (
        <ul className="sg-podium" data-n={podium.length}>
          {podium.map((p, i) => (
            <li key={p.id} className="sg-podium-item sg-rise" style={delay(3 + i)}>
              <Link href={buildStoreUrl(store.slug, `/products/${p.slug}`)} aria-label={p.name} className="sg-podium-media">
                <PlateImage src={p.image} sizes="(max-width: 768px) 40vw, 22rem" priority />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** apple.com's second row: two tiles side by side, each a banner. */
export function BannerTiles({ banners, storeSlug }: { banners: BannerData[]; storeSlug: string }) {
  if (banners.length === 0) return null;
  return (
    <ul className="sg-tiles sg-tiles--hero" data-n={banners.length}>
      {banners.map((b, i) => (
        <li key={b.id} className="sg-reveal min-w-0" style={delay(i)}>
          <div className="sg-tile" data-media="true">
            <BannerImage banner={b} sizes="(max-width: 768px) 100vw, 50vw" className="sg-zoom-img object-cover" />
            <span aria-hidden className="sg-hero-shade" />
            <div className="sg-tile-copy">
              <h2 className="sg-tile-title text-balance">{b.title}</h2>
              {b.subtitle && <p className="sg-tile-sub text-balance">{b.subtitle}</p>}
              <Actions banner={b} storeSlug={storeSlug} onMedia />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

type HeroProps = {
  style: HeroStyle;
  store: Store;
  banners: BannerData[];
  products: ProductCardData[];
};

/** Studio "hero" setting:
 *  fullscreen — the first banner fills the screen, the rest follow as tiles (theme default)
 *  split      — copy beside the photo on a rounded tile
 *  compact    — apple.com/store's header with every banner on a shelf
 *  minimal    — the store's name on the stage with its products, no banners
 *  Without banners every style shows the stage. */
export default function Hero({ style, store, banners, products }: HeroProps) {
  if (style === "minimal" || banners.length === 0) return <StageHero store={store} products={products} />;
  if (style === "compact") return <StoreHead store={store} banners={banners} />;
  const [first, ...rest] = banners;
  return (
    <>
      {style === "split" ? <SplitHero banner={first} store={store} /> : <FullHero banner={first} storeSlug={store.slug} />}
      <BannerTiles banners={rest.slice(0, 4)} storeSlug={store.slug} />
    </>
  );
}
