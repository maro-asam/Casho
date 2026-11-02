import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CategoryCardStyle } from "@/types/store-theme.types";
import type { CategoryLink } from "../../types";
import { CategoryArt, delay } from "../ui";

/** apple.com's chapter nav: every shelf as a picture with its name under it,
 *  centered, sliding sideways when there are more than fit.
 *  Studio "category shape": square (rounded tiles, theme default), circle, or
 *  pill (a row of capsules with a small thumbnail). */
export default function CategoryShelf({ categories, storeSlug, style }: { categories: CategoryLink[]; storeSlug: string; style: CategoryCardStyle }) {
  const list = categories.filter((c) => c.productCount > 0).slice(0, 16);
  if (list.length === 0) return null;
  const url = (c: CategoryLink) => buildStoreUrl(storeSlug, `/categories/${c.slug}`);

  return (
    <nav aria-label="الأقسام" className="sg-chapters" data-shape={style}>
      <ul>
        {list.map((c, i) => (
          <li key={c.id} className="sg-reveal" style={delay(Math.min(i, 7))}>
            <Link href={url(c)} className="sg-chapter group">
              <span className="sg-chapter-art">
                <CategoryArt name={c.name} image={c.image} sizes={style === "pill" ? "32px" : "112px"} className="sg-zoom-img" />
              </span>
              <span className="sg-chapter-name">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
