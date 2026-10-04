import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import { Arrow, idx, monogram, num } from "../ui";

/** Categories as a row of arches — the riwaq itself. A grid when they fit,
 *  a swipeable arcade when they don't. */
export default function Arcade({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
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
                <span className="rq-caption mt-0.5 block">{num(c.productCount)} قطعة</span>
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
                كل المنتجات
                <Arrow />
              </span>
            </div>
          </Link>
        </li>
      )}
    </ul>
  );
}
