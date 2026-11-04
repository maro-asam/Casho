import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { Band, CategoryArt, SectionHead, Wrap, delay, num } from "../ui";

/** Collections as cameos. Studio "category shape":
 *  circle — round medallions ringed in gold (theme default)
 *  square — portrait plates in a passepartout frame, the count under the name
 *  pill   — a single centered line of names divided by diamonds, a jeweler's menu */
export default function Cameos({ categories, storeSlug, style, title = "تسوّق حسب القطعة" }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle; title?: string }) {
  const list = categories.filter((c) => c.productCount > 0).slice(0, 12);
  if (list.length === 0) return null;
  const url = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);

  if (style === "pill") {
    return (
      <Band className="qr-section qr-section--tight">
        <Wrap>
          <nav aria-label="المجموعات">
            <ul className="qr-namerow">
              {list.map((c, i) => (
                <li key={c.id} className="qr-reveal" style={delay(Math.min(i, 6))}>
                  <Link href={url(c)} className="qr-namerow-link">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Wrap>
      </Band>
    );
  }

  return (
    <Band className="qr-section">
      <Wrap>
        <SectionHead kicker="المجموعات" title={title} href={buildStoreUrl(storeSlug, "/categories")} linkLabel="كل المجموعات" />
      </Wrap>
      <nav aria-label="المجموعات" className="qr-cameos" data-shape={style}>
        <ul>
          {list.map((c, i) => (
            <li key={c.id} className="qr-reveal" style={delay(Math.min(i, 7))}>
              <Link href={url(c)} className="qr-cameo group">
                <span className="qr-cameo-art">
                  <CategoryArt name={c.name} image={c.image} sizes={style === "square" ? "(max-width: 768px) 40vw, 16rem" : "144px"} className="qr-zoom" />
                </span>
                <span className="qr-cameo-name">{c.name}</span>
                {style === "square" && <span className="qr-cameo-count">{num(c.productCount)} قطعة</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Band>
  );
}
