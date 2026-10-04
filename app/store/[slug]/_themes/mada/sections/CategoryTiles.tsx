import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import { Arrow, PlateImage, SectionHeader, Wrap, num } from "../ui";

/** Categories as image tiles: a bento on desktop (lead tile larger),
 *  a swipeable row on phones. */
export default function CategoryTiles({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  const tiles = categories.slice(0, 5);
  const bento = tiles.length >= 3;
  return (
    <Wrap className="md-section md-reveal">
      <SectionHeader eyebrow="تصفّح" title="تسوّق حسب التصنيف" href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل التصنيفات" />
      <ul
        className={cn(
          "md-rail md-bleed gap-3 sm:gap-4 lg:mx-0 lg:grid lg:overflow-visible lg:px-0",
          bento ? "lg:auto-rows-[15rem] lg:grid-cols-4" : tiles.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
        )}
      >
        {tiles.map((c, i) => (
          <li key={c.id} className={cn("w-[44%] shrink-0 sm:w-[30%] lg:w-auto", bento && i === 0 && "lg:col-span-2 lg:row-span-2", bento && tiles.length === 3 && i > 0 && "lg:col-span-2")}>
            <Link
              href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
              className={cn("md-media group block aspect-[4/5] h-full", bento ? "lg:aspect-auto" : "lg:aspect-[16/10]", !c.image && "bg-(--md-brand)")}
            >
              <PlateImage src={c.image} sizes={i === 0 ? "(max-width: 1024px) 45vw, 50vw" : "(max-width: 1024px) 45vw, 25vw"} className="transition-transform duration-700 group-hover:scale-105" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(12_17_15/0.7),transparent_55%)]" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
                <span className="min-w-0">
                  <span className={cn("md-face block truncate font-bold", i === 0 && bento ? "text-xl sm:text-2xl lg:text-3xl" : "text-base sm:text-lg")}>{c.name}</span>
                  <span className="text-xs opacity-80">{num(c.productCount)} منتج</span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#121714] transition-transform duration-300 group-hover:scale-110">
                  <Arrow />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}
