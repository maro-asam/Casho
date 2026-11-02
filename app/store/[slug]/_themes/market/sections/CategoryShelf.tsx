import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { CategoryIcon } from "../lib/category-icon";
import { AisleArt, SectionHeader, Wrap, delay } from "../ui";

/** Studio "category shape" setting:
 *  square — aisles as home-screen app icons (theme default)
 *  circle — the same grid in circles
 *  pill   — a swipeable row of chips
 *  A photo fills the icon; without one the aisle gets its glyph and color. */
export default function CategoryShelf({ categories, storeSlug, style }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle }) {
  const list = categories.filter((c) => c.productCount > 0).slice(0, 16);
  if (list.length === 0) return null;
  const url = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);

  return (
    <Wrap className="mk-section">
      <SectionHeader title="الأقسام" href={buildStoreUrl(storeSlug, "/categories")} />
      {style === "pill" ? (
        <ul className="mk-rail mk-bleed gap-2">
          {list.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link href={url(c)} className="mk-opt">
                <CategoryIcon name={c.name} className="size-4 text-(--mk-label-2)" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mk-aisles" data-shape={style} data-many={list.length > 8}>
          {list.map((c, i) => (
            <li key={c.id} className="mk-reveal min-w-0" style={delay(Math.min(i, 7))}>
              <Link href={url(c)} className="mk-aisle group">
                {c.image ? (
                  <span className="mk-aisle-art relative block overflow-hidden">
                    <Image src={c.image} alt="" fill sizes="96px" className="object-cover" />
                  </span>
                ) : (
                  <AisleArt name={c.name} />
                )}
                <span className="mk-aisle-name">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}
