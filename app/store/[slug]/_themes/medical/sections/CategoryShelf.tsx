import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { CategoryIcon } from "../lib/category-icon";
import { CategoryArt, SectionHeader, Wrap, delay, num } from "../ui";

/** "Shop by department", following the Studio "category shape" setting:
 *  circle — round icons/photos in a swipe row (pharmacy-app style)
 *  square — tiles with the photo or icon, name and count
 *  pill   — compact chips with an icon */
export default function CategoryShelf({ categories, storeSlug, style }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle }) {
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, style === "square" ? 12 : 16);
  if (shelves.length === 0) return null;
  const url = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);
  const header = <SectionHeader title="تسوّق حسب القسم" sub={`${num(shelves.length)} قسم في المتجر`} href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل الأقسام" />;

  if (style === "pill") {
    return (
      <Wrap className="rx-section">
        {header}
        <ul className="flex flex-wrap gap-2">
          {shelves.map((c) => {
            return (
              <li key={c.id}>
                <Link href={url(c)} className="rx-opt min-h-12 gap-2 ps-2 pe-4 text-[0.9375rem] font-semibold">
                  <span className="grid size-8 place-items-center rounded-full bg-(--rx-tint) text-(--rx-btn) [&_svg]:size-4">
                    <CategoryIcon name={c.name} />
                  </span>
                  {c.name}
                  <span className="text-xs font-normal text-(--rx-quiet)">({num(c.productCount)})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Wrap>
    );
  }

  if (style === "square") {
    return (
      <Wrap className="rx-section">
        {header}
        <ul className="grid grid-cols-2 gap-(--rx-gap) sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shelves.map((c, i) => (
            <li key={c.id} className="rx-reveal" style={delay(Math.min(i, 5))}>
              <Link href={url(c)} className="group flex h-full flex-col overflow-hidden rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card) transition-[border-color,box-shadow] hover:border-(--rx-btn) hover:shadow-(--rx-shadow-sm)">
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <CategoryArt name={c.name} image={c.image} sizes="(max-width: 640px) 45vw, (max-width: 1280px) 25vw, 16vw" className="rx-zoom-img" />
                </span>
                <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="truncate font-bold text-(--rx-ink) group-hover:text-(--rx-btn)">{c.name}</span>
                  <span className="shrink-0 text-xs text-(--rx-quiet)">{num(c.productCount)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    );
  }

  return (
    <Wrap className="rx-section">
      {header}
      <ul className="rx-rail rx-bleed gap-3 pb-1 sm:gap-5">
        {shelves.map((c) => (
          <li key={c.id} className="w-[5.5rem] shrink-0 sm:w-28">
            <Link href={url(c)} className="group flex flex-col items-center text-center">
              <span className="relative block size-20 overflow-hidden rounded-full border-2 border-transparent bg-(--rx-card) shadow-(--rx-shadow-sm) transition-colors group-hover:border-(--rx-btn) sm:size-24">
                <CategoryArt name={c.name} image={c.image} sizes="96px" className="rx-zoom-img" />
              </span>
              <span className="mt-2.5 line-clamp-2 text-[0.8125rem] leading-snug font-bold text-(--rx-ink) group-hover:text-(--rx-btn) sm:text-sm">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}
