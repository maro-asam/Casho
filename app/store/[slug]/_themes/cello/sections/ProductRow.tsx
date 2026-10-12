import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { BannerData, ProductCardData } from "../../types";
import MiniCard from "../product/MiniCard";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import { Wrap } from "../ui";

/** Cello "featured collection": title + italic subtitle, "View all" and
 *  square arrows on the end, then a product carousel (five across on
 *  desktop). An optional promo banner leads the row on desktop. */
export default function ProductRow({
  products,
  storeSlug,
  sub,
  title,
  href,
  actions,
  max = 12,
  lead,
}: {
  products: ProductCardData[];
  storeSlug: string;
  sub?: string;
  title: string;
  href?: string;
  actions?: ReactNode;
  max?: number;
  /** Banner shown as the first, taller tile on large screens. */
  lead?: { banner: BannerData; href: string } | null;
}) {
  if (products.length === 0) return null;
  return (
    <Wrap className="ce-section">
      <div className={lead ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,3.6fr)] lg:items-end lg:gap-(--ce-gap)" : undefined}>
        {lead && (
          <Link href={lead.href} className="group relative hidden h-full min-h-[26rem] overflow-hidden rounded-(--ce-r) bg-(--ce-navy) p-7 text-white lg:block">
            <Image src={lead.banner.image} alt="" fill sizes="22vw" className="ce-zoom-img object-cover" />
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_16_48/0.75),rgb(0_16_48/0)_60%)]" />
            <span className="relative block text-2xl leading-snug font-semibold text-balance">{lead.banner.title}</span>
            <span className="ce-btn ce-btn--white relative mt-5">تسوّق الآن</span>
          </Link>
        )}
        <Rail label={title} title={title} sub={sub} href={href} actions={actions} listClassName={lead ? "lg:[&>li]:!w-[calc((100%-var(--ce-gap)*3)/4)]" : undefined}>
          {products.slice(0, max).map((p, i) => (
            <li key={p.id} className="min-w-0">
              <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 46vw, (max-width: 1280px) 25vw, 18vw" />
            </li>
          ))}
        </Rail>
      </div>
    </Wrap>
  );
}

/** Grey rounded panel with a title, optional countdown, and horizontal mini
 *  cards (Cello's "Top tech deals" and "Recommended for you"). `grid` lays
 *  the cards out three across instead of a carousel. */
export function MiniPanel({
  products,
  storeSlug,
  title,
  sub,
  timer,
  grid,
  max = 8,
}: {
  products: ProductCardData[];
  storeSlug: string;
  title: string;
  sub?: string;
  timer?: ReactNode;
  grid?: boolean;
  max?: number;
}) {
  if (products.length === 0) return null;
  const list = products.slice(0, max);
  return (
    <Wrap className="ce-section">
      <div className="rounded-(--ce-r-lg) bg-(--ce-band) p-4 sm:p-8">
        {grid ? (
          <>
            <header className="mb-5 sm:mb-8">
              <h2 className="ce-h2 text-balance">{title}</h2>
              {sub && <p className="ce-sub">{sub}</p>}
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-(--ce-gap) xl:grid-cols-3">
              {list.map((p) => (
                <li key={p.id} className="ce-reveal min-w-0">
                  <MiniCard product={p} storeSlug={storeSlug} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Rail label={title} title={title} sub={sub} actions={timer} listClassName="[&>li]:!w-[88%] sm:[&>li]:!w-[calc((100%-var(--ce-gap))/2)] lg:[&>li]:!w-[calc((100%-var(--ce-gap)*2)/3)] xl:[&>li]:!w-[calc((100%-var(--ce-gap)*3)/4)]">
            {list.map((p) => (
              <li key={p.id} className="min-w-0">
                <MiniCard product={p} storeSlug={storeSlug} />
              </li>
            ))}
          </Rail>
        )}
      </div>
    </Wrap>
  );
}
