import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { Band, CategoryArt, SectionHead, Wrap, delay, num } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

/** Studio "category shape":
 *  circle — cups seen from above on their saucers, the name under each (theme default)
 *  square — bag labels: the photo, then the name and count on a dashed label
 *  pill   — the menu: names with dotted leaders and their starting price */
export default function Categories({ categories, storeSlug, style }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle }) {
  const list = categories.filter((c) => c.productCount > 0).slice(0, 12);
  if (list.length === 0) return null;
  const href = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);

  if (style === "pill")
    return (
      <Band tone="alt" className="bn-section">
        <Wrap>
          <SectionHead kicker={st("المنيو")} title={st("تسوّق حسب القسم")} href={buildStoreUrl(storeSlug, "/categories")} />
          <ul className="bn-catmenu">
            {list.map((c, i) => (
              <li key={c.id} className="bn-reveal" style={delay(Math.min(i, 5))}>
                <Link href={href(c)} className="bn-menu-line">
                  <span className="bn-menu-name">{c.name}</span>
                  <span aria-hidden className="bn-menu-dots" />
                  <span className="bn-menu-count">{c.fromPrice ? st("من {0}", formatPrice(c.fromPrice)) : st("{0} منتج", num(c.productCount))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </Band>
    );

  if (style === "square")
    return (
      <Band className="bn-section">
        <Wrap>
          <SectionHead kicker={st("الأقسام")} title={st("تسوّق حسب القسم")} href={buildStoreUrl(storeSlug, "/categories")} />
          <ul className="bn-catlabels">
            {list.slice(0, 8).map((c, i) => (
              <li key={c.id} className="bn-reveal min-w-0" style={delay(Math.min(i, 5))}>
                <Link href={href(c)} className="bn-catlabel group">
                  <span className="bn-catlabel-media">
                    <CategoryArt name={c.name} image={c.image} sizes="(max-width: 768px) 50vw, 25vw" className="bn-zoom" />
                  </span>
                  <span className="bn-catlabel-tag">
                    <span className="bn-display block truncate text-[1.0625rem] text-(--bn-ink)">{c.name}</span>
                    <span className="block text-xs text-(--bn-ink-2)">{st("{0} منتج", num(c.productCount))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </Band>
    );

  return (
    <Band className="bn-section">
      <Wrap>
        <SectionHead kicker={st("الأقسام")} title={st("تسوّق حسب القسم")} href={buildStoreUrl(storeSlug, "/categories")} />
      </Wrap>
      <ul className="bn-cups bn-shelf" aria-label={st("الأقسام")}>
        {list.map((c, i) => (
          <li key={c.id} className="bn-reveal" style={delay(Math.min(i, 6))}>
            <Link href={href(c)} className="bn-cupitem group">
              <span className="bn-cup">
                <span className="bn-cup-art">
                  <CategoryArt name={c.name} image={c.image} sizes="(max-width: 768px) 40vw, 12rem" className="bn-zoom" />
                </span>
              </span>
              <span className="bn-display mt-4 block truncate text-center text-[1rem] text-(--bn-ink)">{c.name}</span>
              <span className="block text-center text-xs text-(--bn-ink-2)">{st("{0} منتج", num(c.productCount))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Band>
  );
}
