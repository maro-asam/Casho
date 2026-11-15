import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { Arrow, PlateImage, SectionHeader, Wrap, num } from "../ui";

/** Categories as image tiles: a bento on desktop (lead tile larger),
 *  a swipeable row on phones. The Studio's category shape: `square` (Mada's
 *  own) the bento, `circle` round photos in a row, `pill` image chips. */
export default function CategoryTiles({
  categories,
  storeSlug,
  shape = "square",
}: {
  categories: CategoryLink[];
  storeSlug: string;
  shape?: CategoryCardStyle;
}) {
  if (shape !== "square") {
    return (
      <Wrap className="md-section md-reveal">
        <SectionHeader eyebrow="تصفّح" title="تسوّق حسب التصنيف" href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل التصنيفات" />
        {shape === "circle" ? <Circles categories={categories.slice(0, 12)} storeSlug={storeSlug} /> : <Chips categories={categories} storeSlug={storeSlug} />}
      </Wrap>
    );
  }
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

function Circles({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  return (
    <ul className="md-rail md-bleed gap-4 sm:gap-6 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0">
      {categories.map((c) => (
        <li key={c.id} className="w-[28%] shrink-0 sm:w-[20%] lg:w-[8.75rem]">
          <Link href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)} className="group block text-center">
            <span className={cn("md-media block aspect-square rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-(--md-bg) transition-shadow duration-(--md-dur) group-hover:ring-(--md-signal)", !c.image && "bg-(--md-brand)")}>
              <PlateImage src={c.image} sizes="(max-width: 640px) 28vw, 9rem" className="transition-transform duration-700 group-hover:scale-105" />
            </span>
            <span className="md-face mt-3 block truncate text-[0.9375rem] font-bold">{c.name}</span>
            <span className="text-xs text-(--md-quiet)">{num(c.productCount)} منتج</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Chips({ categories, storeSlug }: { categories: CategoryLink[]; storeSlug: string }) {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={buildStoreUrl(storeSlug, `/categories/${c.slug}`)}
            className="group flex min-h-12 items-center gap-2.5 rounded-full bg-(--md-surface) py-1.5 pe-5 ps-1.5 shadow-[0_0_0_1px_var(--md-line)] transition-colors duration-(--md-dur) hover:bg-(--md-brand) hover:text-(--md-brand-ink)"
          >
            <span className={cn("md-media size-9 shrink-0 rounded-full", !c.image && "bg-(--md-brand)")}>
              <PlateImage src={c.image} sizes="36px" />
            </span>
            <span className="max-w-48 truncate text-[0.9375rem] font-semibold">{c.name}</span>
            <span className="text-xs opacity-60">{num(c.productCount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
