import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { Arrow, idx, monogram, num } from "../ui";
import { st } from "@/lib/i18n/storefront";

/** Categories as a row of arches — the riwaq itself. A grid when they fit,
 *  a swipeable arcade when they don't. The Studio's category shape swaps the
 *  arches (`square`, Riwaq's own) for round medallions or a row of capsules. */
export default function Arcade({
  categories,
  storeSlug,
  shape = "square",
}: {
  categories: CategoryLink[];
  storeSlug: string;
  shape?: CategoryCardStyle;
}) {
  if (shape === "pill") return <Capsules categories={categories} storeSlug={storeSlug} />;
  if (shape === "circle") return <Medallions categories={categories} storeSlug={storeSlug} />;
  const fits = categories.length <= 5;
  return (
    <ul
      className={cn(
        "rq-rail rq-bleed gap-4 sm:gap-6",
        fits && "lg:mx-0 lg:grid lg:overflow-visible lg:px-0",
        fits && "lg:grid-cols-5",
      )}
    >
      {categories.map((c, i) => (
        <li key={c.id} className={cn("w-[44%] shrink-0 sm:w-[30%]", fits ? "lg:w-auto" : "lg:w-[18.5%]")}>
          <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group block">
            <div className="rq-arch rq-arch--line aspect-[3/4]">
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 20vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span className="rq-face absolute inset-0 grid place-items-center bg-(--rq-accent-soft) pt-[18%] text-6xl font-semibold text-(--rq-accent-soft-ink) transition-transform duration-500 group-hover:scale-105">
                  {monogram(c.name)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="rq-num text-xs text-(--rq-accent)">{idx(i + 1)}</span>
              <span className="min-w-0">
                <span className="rq-h3 rq-link block truncate">{c.name}</span>
                <span className="rq-caption mt-0.5 block">{st("{0} قطعة", num(c.productCount))}</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
      {fits && (
        <li className="hidden lg:block">
          <Link href={buildStoreUrl(storeSlug, "/products")} className="group block">
            <div className="rq-arch grid aspect-[3/4] place-items-center border border-(--rq-ink) bg-transparent pt-[20%] transition-colors duration-(--rq-dur) group-hover:bg-(--rq-ink) group-hover:text-(--rq-paper)">
              <span className="rq-h3 flex items-center gap-2">
                {st("كل المنتجات")}
                <Arrow />
              </span>
            </div>
          </Link>
        </li>
      )}
    </ul>
  );
}

/** `circle`: round medallions with a hairline ring, names centered under them. */
function Medallions({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  return (
    <ul className="rq-rail rq-bleed gap-5 sm:gap-8 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0">
      {categories.map((c) => (
        <li key={c.id} className="w-[30%] shrink-0 sm:w-[22%] lg:w-[9.5rem]">
          <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group block text-center">
            <div className="relative aspect-square overflow-hidden rounded-full bg-(--rq-plate) ring-1 ring-(--rq-rule-strong) ring-offset-4 ring-offset-(--rq-paper) transition-shadow duration-(--rq-dur) group-hover:ring-(--rq-accent)">
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 30vw, 10rem"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span className="rq-face absolute inset-0 grid place-items-center bg-(--rq-accent-soft) text-4xl font-semibold text-(--rq-accent-soft-ink)">
                  {monogram(c.name)}
                </span>
              )}
            </div>
            <span className="rq-link mt-4 block truncate text-[0.9375rem] font-semibold">{c.name}</span>
            <span className="rq-caption mt-0.5 block">{st("{0} قطعة", num(c.productCount))}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** `pill`: the index as capsules — name and count, ink fills on hover. */
function Capsules({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  return (
    <ul className="flex flex-wrap gap-2.5 sm:gap-3">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
            className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-(--rq-ink) px-5 text-[0.9375rem] font-semibold transition-colors duration-(--rq-dur) hover:bg-(--rq-ink) hover:text-(--rq-paper)"
          >
            <span className="max-w-56 truncate">{c.name}</span>
            <span className="rq-num text-xs text-(--rq-quiet)">{num(c.productCount)}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={buildStoreUrl(storeSlug, "/products")}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-(--rq-ink) px-5 text-[0.9375rem] font-semibold text-(--rq-paper) transition-colors duration-(--rq-dur) hover:bg-(--rq-accent) hover:text-(--rq-accent-ink)"
        >
          {st("كل المنتجات")}
          <Arrow />
        </Link>
      </li>
    </ul>
  );
}
