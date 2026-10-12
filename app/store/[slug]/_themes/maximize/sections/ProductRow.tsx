import type { ReactNode } from "react";

import type { ProductCardData } from "../../types";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import { SectionHeader, Wrap } from "../ui";

/** Maximize "featured collection": eyebrow + title on the start side,
 *  optional countdown and "View all »" on the end, then a product carousel
 *  (six across on desktop, swipeable everywhere). */
export default function ProductRow({
  products,
  storeSlug,
  eyebrow,
  title,
  href,
  actions,
  max = 12,
  band,
}: {
  products: ProductCardData[];
  storeSlug: string;
  eyebrow?: string;
  title: string;
  href?: string;
  actions?: ReactNode;
  max?: number;
  /** Sit on the tinted band instead of the page canvas. */
  band?: boolean;
}) {
  if (products.length === 0) return null;
  const body = (
    <Wrap className="mx-section">
      <SectionHeader eyebrow={eyebrow} title={title} href={href} actions={actions} />
      <Rail label={title}>
        {products.slice(0, max).map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 46vw, (max-width: 1280px) 25vw, 16vw" />
          </li>
        ))}
      </Rail>
    </Wrap>
  );
  return band ? <section className="mx-band my-[calc(var(--mx-section)/2)]">{body}</section> : <section>{body}</section>;
}
