import type { ReactNode } from "react";
import { BadgePercent } from "lucide-react";

import type { ProductCardData } from "../../types";
import MiniCard from "../product/MiniCard";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import { Wrap } from "../ui";

/** Titled product carousel ("best sellers", "store picks"…). */
export default function ProductRow({
  products,
  storeSlug,
  eyebrow,
  title,
  sub,
  href,
  max = 12,
}: {
  products: ProductCardData[];
  storeSlug: string;
  eyebrow?: ReactNode;
  title: string;
  sub?: string;
  href?: string;
  max?: number;
}) {
  if (products.length === 0) return null;
  return (
    <Wrap className="rx-section">
      <Rail label={title} eyebrow={eyebrow} title={title} sub={sub} href={href}>
        {products.slice(0, max).map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 46vw, (max-width: 1280px) 25vw, 18vw" />
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

/** Tinted deals panel: title, the merchant's countdown and real discounts
 *  as horizontal mini cards. */
export function DealsPanel({ products, storeSlug, title, timer }: { products: ProductCardData[]; storeSlug: string; title: string; timer?: ReactNode }) {
  if (products.length === 0) return null;
  return (
    <Wrap className="rx-section">
      <div className="rounded-(--rx-r-lg) bg-(--rx-tint) p-4 sm:p-7">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
          <div className="text-(--rx-tint-ink)">
            <p className="rx-eyebrow mb-1.5 !text-(--rx-sale)">
              <BadgePercent className="size-4" />
              خصومات حقيقية
            </p>
            <h2 className="rx-h2 !text-current">{title}</h2>
          </div>
          {timer}
        </header>
        <ul className="grid gap-(--rx-gap) sm:grid-cols-2 xl:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <li key={p.id} className="rx-reveal min-w-0">
              <MiniCard product={p} storeSlug={storeSlug} />
            </li>
          ))}
        </ul>
      </div>
    </Wrap>
  );
}
