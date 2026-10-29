import Link from "next/link";
import { ClipboardPlus, PackageSearch } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, CategoryLink } from "../../types";
import { BannerImage, BannerLink } from "../../shared/banner";
import { whatsappHref } from "../../shared/social";
import SearchBar from "../header/SearchBar";
import { CategoryIcon } from "../lib/category-icon";
import { RX_MESSAGE, waWith } from "../lib/rx";
import { Chevron, Wrap } from "../ui";
import HeroSlider from "./HeroSlider";

type HeroProps = {
  style: HeroStyle;
  store: { name: string; slug: string; description: string | null };
  banners: BannerData[];
  categories: CategoryLink[];
  whatsapp: string | null;
};

/** The store's own name, description and a big search — used when there
 *  are no banners (no stock imagery or invented copy), and as the
 *  "text only" hero style. */
function SearchHero({ store, categories, framed }: Pick<HeroProps, "store" | "categories"> & { framed?: boolean }) {
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, 6);
  return (
    <div className={cn("rx-pluses flex h-full flex-col justify-center bg-(--rx-tint) text-(--rx-btn)", framed ? "rounded-(--rx-r-lg) px-6 py-10 sm:px-10" : "py-12 sm:py-16")}>
      <div className={cn("text-(--rx-tint-ink)", !framed && "rx-wrap")}>
        <h1 className="rx-hero max-w-[20ch] text-balance !text-current">{store.name}</h1>
        {store.description && <p className="mt-3 line-clamp-3 max-w-2xl text-[0.9375rem] leading-7 opacity-85 sm:text-base">{store.description}</p>}
        <SearchBar shell={{ slug: store.slug, categories }} size="lg" className="mt-6 max-w-2xl text-(--rx-text)" />
        {shelves.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="أقسام سريعة">
            {shelves.map((c) => {
              return (
                <li key={c.id}>
                  <Link href={buildStoreUrl(store.slug, `/categories/${c.slug}`)} className="rx-opt min-h-9 gap-1.5 border-transparent px-3.5 text-[0.8125rem]">
                    <CategoryIcon name={c.name} className="size-4 text-(--rx-btn)" />
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Prescription card: hands off to the store's WhatsApp with a ready message. */
export function RxCard({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={waWith(href, RX_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("rx-pluses group flex flex-col justify-between gap-4 rounded-(--rx-r-lg) bg-(--rx-deep) p-6 text-white", className)}
    >
      <ClipboardPlus className="size-9 opacity-90" strokeWidth={1.5} />
      <span>
        <span className="block text-xl font-bold">عندك روشتة؟</span>
        <span className="mt-1 block text-sm leading-6 text-white/85">صوّرها وابعتها على واتساب المتجر، واسأل عن المتاح والسعر قبل ما تطلب.</span>
        <span className="rx-btn rx-btn--wa rx-btn--sm mt-4">ابعت الروشتة</span>
      </span>
    </a>
  );
}

function TrackCard({ storeSlug, className }: { storeSlug: string; className?: string }) {
  return (
    <Link href={buildStoreUrl(storeSlug, "/track")} className={cn("group flex items-center gap-4 rounded-(--rx-r-lg) border border-(--rx-line) bg-(--rx-card) p-5 transition-colors hover:border-(--rx-btn)", className)}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-(--rx-tint) text-(--rx-btn)">
        <PackageSearch className="size-6" strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-(--rx-ink)">تابع طلبك</span>
        <span className="block text-sm text-(--rx-quiet)">برقم الطلب والموبايل اللي طلبت بيه</span>
      </span>
      <Chevron className="text-(--rx-quiet) group-hover:text-(--rx-btn)" />
    </Link>
  );
}

function BannerTile({ banner, storeSlug, className }: { banner: BannerData; storeSlug: string; className?: string }) {
  return (
    <BannerLink banner={banner} storeSlug={storeSlug} className={cn("group relative block min-h-44 overflow-hidden rounded-(--rx-r-lg) bg-(--rx-deep) text-white", className)}>
      <BannerImage banner={banner} sizes="(max-width: 1024px) 100vw, 30vw" className="rx-zoom-img object-cover" />
      {banner.title && (
        <>
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(3_22_24/0.75),transparent_65%)]" />
          <span className="absolute inset-x-0 bottom-0 p-5">
            <span className="line-clamp-2 block text-lg font-bold">{banner.title}</span>
            {banner.link && (
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                {banner.cta}
                <Chevron />
              </span>
            )}
          </span>
        </>
      )}
    </BannerLink>
  );
}

/** Home hero, following the Studio "main banner" setting:
 *  fullscreen — full-width slideshow
 *  split      — slideshow beside a column (prescription, order tracking, second banner)
 *  compact    — a shorter slideshow inside the page width
 *  minimal    — text only: store name, description and a big search */
export default function Hero({ style, store, banners, categories, whatsapp }: HeroProps) {
  const wa = whatsappHref(whatsapp);
  const title = <h1 className="sr-only">{store.name}</h1>;

  if (style === "minimal" || banners.length === 0) {
    return style === "fullscreen" || style === "minimal" ? (
      <SearchHero store={store} categories={categories} />
    ) : (
      <Wrap className="pt-4 sm:pt-6">
        <div className={cn("grid gap-(--rx-gap)", style === "split" && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
          <SearchHero store={store} categories={categories} framed />
          {style === "split" && (
            <div className="grid gap-(--rx-gap)">
              {wa && <RxCard href={wa} />}
              <TrackCard storeSlug={store.slug} />
            </div>
          )}
        </div>
      </Wrap>
    );
  }

  if (style === "fullscreen") {
    return (
      <>
        {title}
        <HeroSlider banners={banners} storeSlug={store.slug} variant="full" height="h-[24rem] sm:h-[28rem] lg:h-[clamp(28rem,34vw,38rem)]" />
      </>
    );
  }

  if (style === "compact") {
    return (
      <Wrap className="pt-4 sm:pt-6">
        {title}
        <HeroSlider banners={banners} storeSlug={store.slug} variant="contained" height="h-56 sm:h-72 lg:h-80" />
      </Wrap>
    );
  }

  // split: the slideshow beside a column of up to two tiles
  const [main, ...rest] = banners;
  const side = rest.length > 1 ? rest[rest.length - 1] : rest[0];
  const slides = rest.length > 1 ? [main, ...rest.slice(0, -1)] : [main];
  const tiles = [
    wa && <RxCard key="rx" href={wa} />,
    side && <BannerTile key="banner" banner={side} storeSlug={store.slug} />,
    <TrackCard key="track" storeSlug={store.slug} />,
  ]
    .filter(Boolean)
    .slice(0, 2);
  return (
    <Wrap className="pt-4 sm:pt-6">
      {title}
      <div className="grid gap-(--rx-gap) lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <HeroSlider banners={slides} storeSlug={store.slug} variant="contained" height="h-72 sm:h-96 lg:h-full lg:min-h-[26rem]" />
        <div className="grid gap-(--rx-gap) sm:grid-cols-2 lg:grid-cols-1">{tiles}</div>
      </div>
    </Wrap>
  );
}
