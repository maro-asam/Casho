import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { BannerData, HomeViewProps, ProductCardData } from "../../types";
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
 *  beside an arch framing one real product (captioned and linked). */
export default function Hero({
  store,
  banners,
  products,
  hasCategories,
}: {
  store: HomeViewProps["store"];
  banners: BannerData[];
  products: ProductCardData[];
  hasCategories: boolean;
}) {
  const url = (p: string) => buildStoreUrl(store.slug, p);
  const pictured = products.find((p) => p.image && !p.image.includes("placeholder"));
  const image = pictured?.image ?? banners[0]?.image ?? null;
  const headline = banners[0]?.title?.trim() || store.name;
  const long = [...headline].length > 22;

  return (
    <section className="rq-wrap">
      <div className="grid grid-cols-1 items-end gap-12 pb-12 pt-8 sm:pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-16 lg:pt-14">
        <div className="lg:col-span-7 lg:pb-12">
          <p className="rq-label flex items-center gap-2 text-(--rq-accent)">
            <StarMark className="size-3" />
            {seasonLabel()}
          </p>
          <h1 className={cn("mt-5 text-balance break-words", long ? "rq-h1" : "rq-display")}>{headline}</h1>
          <p className="rq-body mt-6 line-clamp-4 max-w-[46ch] text-(--rq-quiet) sm:text-[1.0625rem]">
            {store.description?.trim() || `منتجات مختارة بعناية من ${store.name}، واطلب في دقيقة.`}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Link href={url("/products")} className={btn({ size: "lg", className: "group max-sm:w-full" })}>
              تسوّق المجموعة
              <Arrow />
            </Link>
            {hasCategories && (
              <Link href={url("/categories")} className="group inline-flex min-h-11 items-center gap-2 font-semibold">
                <span className="rq-link">تصفّح التصنيفات</span>
                <Arrow />
              </Link>
            )}
          </div>
        </div>

        <figure className="relative ms-auto w-[86%] sm:w-[62%] lg:col-span-5 lg:w-[min(100%,27rem)]">
          <div className="rq-arch rq-arch--line rq-wipe aspect-[4/5] w-full">
            {image ? (
              <Image src={image} alt="" fill priority sizes="(max-width: 1024px) 86vw, 40vw" className="object-cover" />
            ) : (
              <span className="rq-face absolute inset-0 grid place-items-center bg-(--rq-accent-soft) pt-[20%] text-[8rem] font-semibold text-(--rq-accent-soft-ink)">
                {monogram(store.name)}
              </span>
            )}
          </div>
          <Stamp className="absolute -bottom-10 -start-10 sm:-start-14" />
          {pictured && (
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

