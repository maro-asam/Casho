import type { ReactNode } from "react";

import type { ProductCardData } from "../../types";
import MiniCard from "../product/MiniCard";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import { SectionHeader, Wrap, num } from "../ui";

/** A swipeable shelf of product cards. */
export default function ProductRow({ products, storeSlug, title, href }: { products: ProductCardData[]; storeSlug: string; title: string; href?: string }) {
  return (
    <Wrap className="mk-section">
      <Rail label={title} title={title} href={href}>
        {products.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 46vw, 20vw" />
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

/** Best sellers as App Store top charts: three numbered rows to a column,
 *  swiped sideways, the order coming from real sales. */
export function TopCharts({ products, storeSlug, title, max = 8, href }: { products: ProductCardData[]; storeSlug: string; title: string; max?: number; href: string }) {
  const list = products.slice(0, max);
  return (
    <Wrap className="mk-section">
      <SectionHeader title={title} href={href} />
      <ol aria-label={title} className="mk-charts mk-bleed">
        {list.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <MiniCard product={p} storeSlug={storeSlug} rank={num(i + 1)} />
          </li>
        ))}
      </ol>
    </Wrap>
  );
}

/** Deals on a tinted tile: the merchant's own timer, real discounts and, when
 *  they're nearly gone, the real units left. */
export function DealsPanel({ products, storeSlug, title, lowStock, timer }: { products: ProductCardData[]; storeSlug: string; title: string; lowStock?: boolean; timer?: ReactNode }) {
  const list = products.slice(0, 10);
  return (
    <Wrap className="mk-section">
      <section aria-label={title} className="mk-deals">
        <Rail label={title} title={title} actions={timer}>
          {list.map((p) => (
            <li key={p.id} className="min-w-0">
              <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 46vw, 20vw" />
              {lowStock && p.stock <= 5 && <p className="mt-1.5 text-center text-xs font-medium text-(--mk-low)">باقي {num(p.stock)} بس</p>}
            </li>
          ))}
        </Rail>
      </section>
    </Wrap>
  );
}
