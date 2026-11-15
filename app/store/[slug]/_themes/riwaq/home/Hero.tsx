import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { HeroStyle } from "@/types/store-theme.types";
import type { BannerData, HomeViewProps, ProductCardData } from "../../types";
import { BannerLink } from "../../shared/banner";
import { Arrow, StarMark, btn, monogram } from "../ui";

const SEASONS = ["شتاء", "شتاء", "ربيع", "ربيع", "ربيع", "صيف", "صيف", "صيف", "خريف", "خريف", "خريف", "شتاء"];

function seasonLabel(date = new Date()) {
  return `مختارات ${SEASONS[date.getMonth()]} ${new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(date.getFullYear())}`;
}

/** Slowly turning stamp that overlaps the arch. */
function Stamp({ className }: { className?: string }) {
  const text = "وصل حديثًا  ✦  وصل حديثًا  ✦  ";
  return (
    <div
      aria-hidden
      className={cn("grid size-28 place-items-center rounded-full bg-(--rq-accent) text-(--rq-accent-ink) sm:size-32", className)}
    >
      <svg viewBox="0 0 100 100" className="rq-spin-slow absolute size-full">
        <defs>
          <path id="rq-stamp-path" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text className="rq-face" fontSize="10.5" fontWeight="600" fill="currentColor" style={{ direction: "ltr", unicodeBidi: "plaintext" }}>
          <textPath href="#rq-stamp-path">{text}</textPath>
        </text>
      </svg>
      <StarMark className="size-6" />
    </div>
  );
}

/** Type-led opener: season line, a big headline and the store's pitch,
 *  beside an arch framing one real product (captioned and linked).
 *  The Studio's hero style reshapes it: `split` (Riwaq's own) as above,
 *  `fullscreen` the lead banner full-bleed under a paper arch of copy,
 *  `compact` one short band, `minimal` type only. */
export default function Hero({
  store,
  banners,
  products,
  hasCategories,
  style = "split",
}: {
  store: HomeViewProps["store"];
  banners: BannerData[];
  products: ProductCardData[];
  hasCategories: boolean;
  style?: HeroStyle;
}) {
  const url = (p: string) => buildStoreUrl(store.slug, p);
  const pictured = products.find((p) => p.image && !p.image.includes("placeholder"));
  const image = pictured?.image ?? banners[0]?.image ?? null;
  const lead = banners[0];
  const headline = lead?.title?.trim() || store.name;
  const long = [...headline].length > 22;
  const pitch = lead?.subtitle || store.description?.trim() || `منتجات مختارة بعناية من ${store.name}، واطلب في دقيقة.`;

  const season = (
    <p className="rq-label flex items-center gap-2 text-(--rq-accent)">
      <StarMark className="size-3" />
      {seasonLabel()}
    </p>
  );

  const actions = (center?: boolean) => (
    <div className={cn("flex flex-wrap items-center gap-x-8 gap-y-5", center && "justify-center")}>
      {/* The headline is the lead banner's, so its button follows that banner. */}
      {lead?.link ? (
        <BannerLink banner={lead} storeSlug={store.slug} className={btn({ size: "lg", className: "group max-sm:w-full" })}>
          {lead.cta}
          <Arrow />
        </BannerLink>
      ) : (
        <Link href={url("/products")} className={btn({ size: "lg", className: "group max-sm:w-full" })}>
          تسوّق المجموعة
          <Arrow />
        </Link>
      )}
      {hasCategories && (
        <Link href={url("/categories")} className="group inline-flex min-h-11 items-center gap-2 font-semibold">
          <span className="rq-link">تصفّح التصنيفات</span>
          <Arrow />
        </Link>
      )}
    </div>
  );

  if (style === "minimal" || (style === "fullscreen" && !(lead?.image || image))) {
    return (
      <section className="rq-wrap">
        <div className="mx-auto flex max-w-4xl flex-col items-center border-b border-(--rq-rule) pb-14 pt-12 text-center sm:pb-20 sm:pt-20">
          {season}
          <h1 className={cn("mt-6 text-balance break-words", long ? "rq-h1" : "rq-display")}>{headline}</h1>
          <p className="rq-body mt-6 line-clamp-3 max-w-[52ch] text-(--rq-quiet) sm:text-[1.0625rem]">{pitch}</p>
          <div className="mt-10 w-full">{actions(true)}</div>
        </div>
      </section>
    );
  }

  if (style === "fullscreen") {
    const backdrop = lead?.image || image!;
    return (
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
        <Image src={backdrop} alt="" fill priority sizes="100vw" className="rq-wipe -z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
        <div className="rq-wrap pb-8 pt-40 sm:pb-12">
          <div className="relative w-full max-w-xl">
            <div className="rq-arch bg-(--rq-paper) px-7 pb-9 pt-[22%] text-center sm:px-12 sm:pb-11">
              <div className="flex justify-center">{season}</div>
              <h1 className="rq-h1 mt-4 text-balance break-words">{headline}</h1>
              <p className="rq-body mt-4 line-clamp-3 text-(--rq-quiet)">{pitch}</p>
              <div className="mt-8">{actions(true)}</div>
            </div>
            <Stamp className="absolute -top-6 -end-4 hidden sm:grid" />
          </div>
        </div>
      </section>
    );
  }

  const compact = style === "compact";
  return (
    <section className="rq-wrap">
      <div
        className={cn(
          "grid grid-cols-1 items-end lg:grid-cols-12",
          compact ? "gap-8 pb-8 pt-6 sm:pt-8 lg:gap-10 lg:pb-10 lg:pt-8" : "gap-12 pb-12 pt-8 sm:pt-12 lg:gap-12 lg:pb-16 lg:pt-14",
        )}
      >
        <div className={cn("lg:col-span-7", compact ? "lg:col-span-8 lg:pb-6" : "lg:pb-12")}>
          {season}
          <h1 className={cn("text-balance break-words", compact ? "rq-h1 mt-4" : cn("mt-5", long ? "rq-h1" : "rq-display"))}>{headline}</h1>
          <p className={cn("rq-body max-w-[46ch] text-(--rq-quiet)", compact ? "mt-4 line-clamp-2" : "mt-6 line-clamp-4 sm:text-[1.0625rem]")}>{pitch}</p>
          <div className={compact ? "mt-7" : "mt-9"}>{actions()}</div>
        </div>

        <figure
          className={cn(
            "relative ms-auto",
            compact ? "w-[60%] sm:w-[40%] lg:col-span-4 lg:w-[min(100%,17rem)]" : "w-[86%] sm:w-[62%] lg:col-span-5 lg:w-[min(100%,27rem)]",
          )}
        >
          <div className="rq-arch rq-arch--line rq-wipe aspect-[4/5] w-full">
            {image ? (
              <Image src={image} alt="" fill priority sizes="(max-width: 1024px) 86vw, 40vw" className="object-cover" />
            ) : (
              <span className="rq-face absolute inset-0 grid place-items-center bg-(--rq-accent-soft) pt-[20%] text-[8rem] font-semibold text-(--rq-accent-soft-ink)">
                {monogram(store.name)}
              </span>
            )}
          </div>
          {compact ? (
            <Stamp className="absolute -bottom-6 -start-6 size-20 sm:size-24" />
          ) : (
            <Stamp className="absolute -bottom-10 -start-10 sm:-start-14" />
          )}
          {pictured && !compact && (
            <figcaption className="mt-4 flex items-baseline justify-between gap-4 ps-20 text-sm sm:ps-24">
              <span className="min-w-0 truncate text-(--rq-quiet)">
                في الصورة:{" "}
                <Link href={url(`/products/${pictured.slug}`)} className="rq-link font-semibold text-(--rq-ink)">
                  {pictured.name}
                </Link>
              </span>
              <span className="rq-price shrink-0">{formatPrice(pictured.price)}</span>
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}

/** Full-bleed ink strip of category names drifting by (decorative). */
export function Ticker({ words }: { words: string[] }) {
  if (words.length === 0) return null;
  // Repeat so one copy is always wider than the screen, then duplicate for the loop.
  const base = Array.from({ length: Math.max(2, Math.ceil(10 / words.length)) }, () => words).flat();
  return (
    <div aria-hidden className="rq-marquee overflow-hidden bg-(--rq-ink) text-(--rq-paper)">
      <div className="rq-marquee-track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {base.map((w, i) => (
              <li key={i} className="rq-face flex h-12 items-center gap-6 pe-6 text-base font-semibold sm:h-14 sm:text-lg">
                {w}
                <span className="text-(--rq-accent)">
                  <StarMark />
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

