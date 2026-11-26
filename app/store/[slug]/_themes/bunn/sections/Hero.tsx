import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, CategoryLink, ProductCardData } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { Steam } from "../icons";
import { cardProfile, gramsLabel } from "../product/ProductCard";
import { Kicker, PlateImage, Price, RoastMeter, TextLink, Wrap, btn, delay, num } from "../ui";
import HeroSlides from "./HeroSlides";
import Stamp from "./Stamp";
import { formatPrice, st } from "@/lib/i18n/storefront";

type Store = { name: string; slug: string; description: string | null };

const firstLine = (s: string | null | undefined) => s?.split(/[.\n]/)[0]?.trim() || "";

/** Origins the store's coffees come from ("إثيوبيا · كولومبيا · اليمن"). */
function originLine(products: ProductCardData[]) {
  const seen = new Set<string>();
  for (const p of products) for (const o of cardProfile(p).origins) seen.add(o.label);
  return [...seen].slice(0, 5);
}

/** The cup: copy on the start; on the end the main banner seen from above
 *  inside a cup on its saucer, steam rising, the roastery stamp turning at
 *  its rim, and the next banner as a small cup beside it. */
function Cup({ banners, store, categories, products }: { banners: BannerData[]; store: Store; categories: CategoryLink[]; products: ProductCardData[] }) {
  const [main, second] = banners;
  const origins = originLine(products);
  return (
    <section className="bn-hero-cup">
      <Wrap className="bn-hero-cup-grid">
        <div className="bn-hero-copy">
          <Kicker className="bn-rise">{store.name}</Kicker>
          <h1 className="bn-display-xl bn-rise text-balance" style={delay(1)}>
            {main.title}
          </h1>
          {main.subtitle && (
            <p className="bn-lead bn-rise text-balance" style={delay(2)}>
              {main.subtitle}
            </p>
          )}
          <div className="bn-hero-ctas bn-rise" style={delay(3)}>
            {main.link && (
              <BannerLink banner={main} storeSlug={store.slug} className={btn({ size: "lg" })}>
                {main.cta}
              </BannerLink>
            )}
            <TextLink href={buildStoreUrl(store.slug, "/products")}>{st("تسوّق كل المنتجات")}</TextLink>
          </div>
          {origins.length > 1 && (
            <div className="bn-hero-origins bn-rise" style={delay(4)}>
              <span className="bn-hero-origins-label">{st("من محاصيل")}</span>
              <ul>
                {origins.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bn-hero-cup-stage bn-rise" style={delay(1)}>
          <Steam className="bn-steam" />
          <div className="bn-saucer">
            <BannerLink banner={main} storeSlug={store.slug} className="bn-cup-photo group" aria-label={main.title} tabIndex={-1}>
              <BannerImage banner={main} sizes="(max-width: 1024px) 80vw, 34rem" priority className="bn-zoom object-cover" />
            </BannerLink>
          </div>
          <Stamp words={[store.name, categories.find((c) => c.productCount > 0)?.name ?? ""]} className="bn-hero-stamp" />
          {second && (
            <BannerLink banner={second} storeSlug={store.slug} className="bn-cup-side group" aria-label={second.title}>
              <span className="bn-cup-side-photo">
                <BannerImage banner={second} sizes="12rem" className="bn-zoom object-cover" />
              </span>
              <span className="bn-cup-side-label">{second.title}</span>
            </BannerLink>
          )}
        </div>
      </Wrap>
    </section>
  );
}

/** The menu board: the store's name like a café's, the main banner framed
 *  on one side and the sections on the other as menu lines with dotted
 *  leaders and their counts. */
function MenuBoard({ banners, store, categories }: { banners: BannerData[]; store: Store; categories: CategoryLink[] }) {
  const [main] = banners;
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, 7);
  const line = firstLine(store.description);
  return (
    <section className="bn-hero-menu" data-tone="espresso">
      <Wrap>
        <header className="bn-menu-head">
          <Kicker className="bn-rise">{st("المنيو")}</Kicker>
          <h1 className="bn-masthead bn-rise" style={delay(1)}>
            {store.name}
          </h1>
          {line && (
            <p className="bn-lead bn-rise mx-auto max-w-2xl text-balance" style={delay(2)}>
              {line}
            </p>
          )}
        </header>
        <div className="bn-menu-grid">
          <BannerLink banner={main} storeSlug={store.slug} className="bn-menu-photo bn-rise group" aria-label={main.title}>
            <BannerImage banner={main} sizes="(max-width: 1024px) 100vw, 40rem" priority className="bn-zoom object-cover" />
            <span aria-hidden className="bn-shade" />
            <span className="bn-menu-photo-copy">
              <span className="bn-display block text-2xl leading-tight sm:text-3xl">{main.title}</span>
              {main.subtitle && <span className="mt-2 line-clamp-2 block text-sm opacity-85">{main.subtitle}</span>}
            </span>
          </BannerLink>
          <div className="bn-rise" style={delay(2)}>
            {shelves.length > 0 ? (
              <ul className="bn-menu-lines">
                {shelves.map((c) => (
                  <li key={c.id}>
                    <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="bn-menu-line">
                      <span className="bn-menu-name">{c.name}</span>
                      <span aria-hidden className="bn-menu-dots" />
                      <span className="bn-menu-count">{c.fromPrice ? st("من {0}", formatPrice(c.fromPrice)) : num(c.productCount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="bn-hero-ctas">
              {main.link && (
                <BannerLink banner={main} storeSlug={store.slug} className={btn({ variant: "crema", size: "lg" })}>
                  {main.cta}
                </BannerLink>
              )}
              <TextLink href={buildStoreUrl(store.slug, "/products")}>{st("كل المنتجات")}</TextLink>
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/** No banners yet (or Studio → minimal): the store's name, then up to three
 *  bags standing on a shelf, each with its price tag and roast. */
function Shelf({ store, products }: { store: Store; products: ProductCardData[] }) {
  const row = products.slice(0, 3);
  const line = firstLine(store.description) || st("قهوة مختارة بعناية، وكل اللي تحتاجه عشان تحضّرها صح.");
  return (
    <section className="bn-hero-shelf">
      <Wrap className="text-center">
        <Kicker className="bn-rise justify-center">{st("أهلًا بيك")}</Kicker>
        <h1 className="bn-display-xl bn-rise mx-auto mt-3 text-balance" style={delay(1)}>
          {store.name}
        </h1>
        <p className="bn-lead bn-rise mx-auto mt-5 max-w-xl text-balance" style={delay(2)}>
          {line}
        </p>
        <div className="bn-hero-ctas bn-rise justify-center" style={delay(3)}>
          <Link href={buildStoreUrl(store.slug, "/products")} className={btn({ size: "lg" })}>
            {st("شوف القهوة")}
          </Link>
          <TextLink href={buildStoreUrl(store.slug, "/categories")}>{st("كل الأقسام")}</TextLink>
        </div>
      </Wrap>
      {row.length > 0 && (
        <Wrap>
          <ul className="bn-shelf-row" data-n={row.length}>
            {row.map((p, i) => {
              const prof = cardProfile(p);
              return (
                <li key={p.id} className="bn-rise min-w-0" style={delay(4 + i)}>
                  <Link href={buildStoreUrl(store.slug, `/products/${p.slug}`)} className="group block">
                    <span className="bn-plate bn-shelf-plate">
                      <PlateImage src={p.image} sizes="(max-width: 768px) 33vw, 22rem" priority className="bn-zoom" />
                    </span>
                    <span className="bn-shelf-tag">
                      <span className="bn-display line-clamp-1 block text-[0.9375rem] text-(--bn-ink) max-sm:text-xs">{p.name}</span>
                      <span className="mt-1 flex items-center justify-center gap-2 max-sm:hidden">
                        <Price price={p.price} compareAt={p.compareAtPrice} size="sm" />
                        {prof.isCoffee && prof.grams && <span className="text-xs text-(--bn-ink-2)">/ {gramsLabel(prof.grams)}</span>}
                      </span>
                      {prof.roast && <RoastMeter level={prof.roast.level} className="mt-1.5 justify-center max-sm:hidden" />}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <span aria-hidden className="bn-shelf-board" />
        </Wrap>
      )}
    </section>
  );
}

/** Studio "hero" setting:
 *  split      — the cup: copy beside the banner seen from above in a cup, steam and the stamp (theme default)
 *  fullscreen — the board: banners fill the screen one after another
 *  compact    — the menu board: the store's name, the banner and the sections as menu lines
 *  minimal    — the shelf: the store's name over three bags on a shelf (also used without banners) */
export default function Hero({ style, store, banners, products, categories }: { style: HeroStyle; store: Store; banners: BannerData[]; products: ProductCardData[]; categories: CategoryLink[] }) {
  if (style === "minimal" || banners.length === 0) return <Shelf store={store} products={products} />;
  if (style === "compact") return <MenuBoard banners={banners} store={store} categories={categories} />;
  if (style === "fullscreen") return <HeroSlides banners={banners.slice(0, 5)} storeSlug={store.slug} storeName={store.name} />;
  return <Cup banners={banners} store={store} categories={categories} products={products} />;
}
