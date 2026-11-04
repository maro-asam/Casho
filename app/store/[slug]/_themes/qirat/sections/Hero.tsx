import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, ProductCardData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Kicker, Ornament, PlateImage, Price, TextLink, Wrap, btn, delay } from "../ui";
import HeroSlides from "./HeroSlides";

type Store = { name: string; slug: string; description: string | null };

const firstLine = (s: string | null | undefined) => s?.split(/[.\n]/)[0]?.trim() || "";

/** Copy on the start, the banner in a passepartout frame on the end, a second
 *  banner (when there is one) laid over its corner like a print on a print. */
function Atelier({ banners, store }: { banners: BannerData[]; store: Store }) {
  const [main, second] = banners;
  return (
    <section className="qr-atelier">
      <Wrap className="qr-atelier-grid">
        <div className="qr-atelier-copy">
          <Kicker className="qr-rise">{store.name}</Kicker>
          <h1 className="qr-display qr-rise mt-3 text-balance" style={delay(1)}>
            {main.title}
          </h1>
          <Ornament className="qr-rise mt-6" />
          {main.subtitle && (
            <p className="qr-lead qr-rise mt-6 text-balance" style={delay(2)}>
              {main.subtitle}
            </p>
          )}
          <div className="qr-hero-ctas qr-rise" style={delay(3)}>
            {main.link && (
              <BannerLink banner={main} storeSlug={store.slug} className={btn({ size: "lg" })}>
                {main.cta}
              </BannerLink>
            )}
            <TextLink href={buildStoreUrl(store.slug, "/products")}>تسوّق كل القطع</TextLink>
          </div>
        </div>
        <div className="qr-atelier-art">
          <BannerLink banner={main} storeSlug={store.slug} className="qr-frame qr-atelier-main group" aria-label={main.title} tabIndex={-1}>
            <BannerImage banner={main} sizes="(max-width: 1024px) 100vw, 50vw" priority className="qr-zoom object-cover" />
          </BannerLink>
          {second && (
            <BannerLink banner={second} storeSlug={store.slug} className="qr-frame qr-atelier-second group" aria-label={second.title}>
              <BannerImage banner={second} sizes="(max-width: 1024px) 40vw, 18rem" className="qr-zoom object-cover" />
            </BannerLink>
          )}
        </div>
      </Wrap>
    </section>
  );
}

/** The store's name set huge like a magazine masthead over the ornament, and
 *  the banners under it as framed plates with their captions beneath. */
function Gazette({ banners, store }: { banners: BannerData[]; store: Store }) {
  const line = firstLine(store.description);
  const list = banners.slice(0, 3);
  return (
    <section className="qr-gazette">
      <Wrap className="text-center">
        <h1 className="qr-masthead qr-rise">{store.name}</h1>
        <Ornament className="qr-rise mt-5" />
        {line && (
          <p className="qr-lead qr-rise mx-auto mt-5 max-w-2xl text-balance" style={delay(1)}>
            {line}
          </p>
        )}
      </Wrap>
      <Wrap>
        <ul className="qr-gazette-grid" data-n={list.length}>
          {list.map((b, i) => (
            <li key={b.id} className="qr-rise min-w-0" style={delay(2 + i)}>
              <BannerLink banner={b} storeSlug={store.slug} className="group block" aria-label={b.title}>
                <span className="qr-frame qr-gazette-media">
                  <BannerImage banner={b} sizes="(max-width: 768px) 100vw, 33vw" priority={i === 0} className="qr-zoom object-cover" />
                </span>
                <span className="mt-4 block text-center">
                  <span className="qr-h3 block text-balance">{b.title}</span>
                  {b.subtitle && <span className="mt-1 line-clamp-2 block text-sm text-(--qr-ink-2)">{b.subtitle}</span>}
                  {b.link && (
                    <span className="qr-link mt-3 justify-center text-sm">
                      <span className="qr-underline">{b.cta}</span>
                    </span>
                  )}
                </span>
              </BannerLink>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

/** No banners yet (or Studio → minimal): the jeweler's tray — the store's name,
 *  then up to three pieces laid on lit plates, the middle one raised. */
function Tray({ store, products }: { store: Store; products: ProductCardData[] }) {
  const tray = products.slice(0, 3);
  const line = firstLine(store.description) || "قطع مختارة بعناية، لكل مناسبة.";
  return (
    <section className="qr-tray">
      <Wrap className="text-center">
        <Kicker className="qr-rise">أهلًا بيك</Kicker>
        <h1 className="qr-hero-title qr-rise mx-auto mt-3 text-balance" style={delay(1)}>
          {store.name}
        </h1>
        <Ornament className="qr-rise mt-6" />
        <p className="qr-lead qr-rise mx-auto mt-6 max-w-xl text-balance" style={delay(2)}>
          {line}
        </p>
        <div className="qr-hero-ctas qr-rise justify-center" style={delay(3)}>
          <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
            اكتشف المجموعة
          </Link>
          <TextLink href={buildStoreUrl(store.slug, "/categories")}>كل المجموعات</TextLink>
        </div>
      </Wrap>
      {tray.length > 0 && (
        <Wrap>
          <ul className="qr-tray-row" data-n={tray.length}>
            {tray.map((p, i) => (
              <li key={p.id} className="qr-rise min-w-0" style={delay(4 + i)}>
                <Link href={buildStoreUrl(store.slug, `/products/${p.slug}`)} className="group block text-center">
                  <span className="qr-plate qr-tray-plate">
                    <PlateImage src={p.image} sizes="(max-width: 768px) 33vw, 22rem" priority className="qr-zoom" />
                    <span aria-hidden className="qr-glint" />
                  </span>
                  <span className="qr-serif mt-4 line-clamp-1 block text-[1.0625rem] text-(--qr-ink) max-sm:text-sm">{p.name}</span>
                  <Price price={p.price} compareAt={p.compareAtPrice} size="sm" className="justify-center max-sm:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      )}
    </section>
  );
}

/** Studio "hero" setting:
 *  fullscreen — the vitrine: banners fill the screen one after another under a clear header (theme default)
 *  split      — the atelier: copy beside the banner in a passepartout frame
 *  compact    — the gazette: the store's name as a masthead, banners as framed plates
 *  minimal    — the tray: the store's name with three pieces on lit plates
 *  Without banners every style shows the tray. */
export default function Hero({ style, store, banners, products }: { style: HeroStyle; store: Store; banners: BannerData[]; products: ProductCardData[] }) {
  if (style === "minimal" || banners.length === 0) return <Tray store={store} products={products} />;
  if (style === "compact") return <Gazette banners={banners} store={store} />;
  if (style === "split") return <Atelier banners={banners} store={store} />;
  return <HeroSlides banners={banners.slice(0, 5)} storeSlug={store.slug} storeName={store.name} />;
}
