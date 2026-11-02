import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { CategoryIcon } from "../lib/category-icon";
import { CategoryArt, Chevron, SectionHeader, Wrap, delay, num } from "../ui";

/** How wide each wall tile sits on desktop so the wall has no holes. */
function wallSpan(i: number, n: number) {
  if (n <= 3) return 4 / n;
  const extra = (n - 1) % 4;
  // n = 4: the third tile closes the second row.
  if (n === 4) return i === 3 ? 2 : 1;
  if (!extra || i < n - extra) return 1;
  return extra === 1 ? 4 : extra === 2 ? 2 : i === n - 1 ? 2 : 1;
}

/** "Gear up", following the Studio "category shape" setting:
 *  square — a wall: the first shelf big, red floods a tile on hover
 *  circle — every shelf is a bumper plate in a swipe row; plates turn on hover
 *  pill   — compact chips with an icon */
export default function CategoryShelf({ categories, storeSlug, style }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle }) {
  const shelves = categories.filter((c) => c.productCount > 0).slice(0, style === "square" ? 9 : 16);
  if (shelves.length === 0) return null;
  const url = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);
  const header = <SectionHeader eyebrow="تسوّق بالقسم" title="جهّز عدّتك" href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل الأقسام" />;

  if (style === "pill") {
    return (
      <Wrap className="gy-section">
        {header}
        <ul className="flex flex-wrap gap-2">
          {shelves.map((c) => (
            <li key={c.id}>
              <Link href={url(c)} className="gy-opt min-h-13 gap-2.5 ps-2 pe-4 text-[0.9375rem]">
                <span className="grid size-9 place-items-center rounded-(--gy-r-sm) bg-(--gy-tint) text-(--gy-link) [&_svg]:size-5">
                  <CategoryIcon name={c.name} />
                </span>
                {c.name}
                <span className="text-xs font-medium text-(--gy-quiet)">({num(c.productCount)})</span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    );
  }

  if (style === "circle") {
    return (
      <Wrap className="gy-section">
        {header}
        <ul className="gy-rail gy-bleed gap-4 pb-1 sm:gap-6">
          {shelves.map((c) => (
            <li key={c.id} className="w-32 shrink-0 sm:w-40">
              <Link href={url(c)} className="group flex flex-col items-center text-center">
                <span className="gy-wplate">
                  <span className="gy-wplate-hub">
                    <CategoryArt name={c.name} image={c.image} sizes="120px" />
                  </span>
                </span>
                <span className="mt-3 line-clamp-2 text-sm leading-snug font-extrabold text-(--gy-ink) group-hover:text-(--gy-link)">{c.name}</span>
                <span className="text-xs text-(--gy-quiet)">{num(c.productCount)} منتج</span>
              </Link>
            </li>
          ))}
        </ul>
      </Wrap>
    );
  }

  const n = shelves.length;
  return (
    <Wrap className="gy-section">
      {header}
      <ul className="gy-wall" data-flat={n <= 3}>
        {shelves.map((c, i) => (
          <li
            key={c.id}
            data-wide={i === n - 1 && i > 0 && (n - 1) % 2 === 1 ? "phone" : undefined}
            className="gy-reveal min-w-0"
            style={{ ...delay(Math.min(i, 5)), ["--span" as string]: wallSpan(i, n) }}
          >
            <Link href={url(c)} className="gy-wall-tile group" data-image={!!c.image}>
              {c.image ? <Image src={c.image} alt="" fill sizes={i === 0 ? "(max-width: 1024px) 100vw, 45vw" : "(max-width: 1024px) 50vw, 25vw"} className="gy-zoom-img object-cover" /> : <CategoryIcon aria-hidden name={c.name} className="gy-wall-icon size-9" strokeWidth={1.5} />}
              <span aria-hidden className="gy-wall-flood" />
              <span className="gy-wall-copy">
                <span className="min-w-0">
                  <span className={i === 0 ? "gy-h2 block !text-current" : "gy-h3 line-clamp-2 !leading-tight !text-current"}>{c.name}</span>
                  <span className="text-[0.8125rem] font-semibold opacity-80">{num(c.productCount)} منتج</span>
                </span>
                <Chevron className="size-5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Wrap>
  );
}
