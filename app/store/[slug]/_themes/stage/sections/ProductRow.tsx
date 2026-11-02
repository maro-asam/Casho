import Link from "next/link";
import type { ReactNode } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import BuyButton from "../product/BuyButton";
import ProductCard, { CardEyebrow } from "../product/ProductCard";
import Rail from "../product/Rail";
import { Band, PlateImage, Price, SectionHeader, Wrap, num } from "../ui";

/** apple.com/store's "The latest" shelf: tall cards, the name and price on
 *  top, the product filling the rest. */
export function BigShelf({ products, storeSlug, title, tagline, href }: { products: ProductCardData[]; storeSlug: string; title: string; tagline?: string; href?: string }) {
  return (
    <Band tone="alt" className="sg-section">
      <Rail label={title} title={title} tagline={tagline} href={href}>
        {products.map((p, i) => (
          <li key={p.id} className="sg-reveal" style={{ ["--d" as string]: Math.min(i, 4) }}>
            <article className="sg-bigcard group">
              <div className="sg-bigcard-copy">
                {p.isNew || p.stock <= 0 || p.compareAtPrice ? <CardEyebrow product={p} /> : p.categoryName ? <p className="sg-bigcard-kicker">{p.categoryName}</p> : null}
                <h3 className="sg-bigcard-title">
                  <Link href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} className="after:absolute after:inset-0 after:z-[1] after:content-['']">
                    {p.name}
                  </Link>
                </h3>
                <Price price={p.price} compareAt={p.compareAtPrice} className="mt-1.5" />
              </div>
              <div className="sg-bigcard-media">
                <PlateImage src={p.image} sizes="(max-width: 768px) 80vw, 24rem" className="sg-zoom-img" />
              </div>
            </article>
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** A shelf of regular product cards. */
export default function ProductRow({ products, storeSlug, title, tagline, href, tone = "page" }: { products: ProductCardData[]; storeSlug: string; title: string; tagline?: string; href?: string; tone?: "page" | "alt" }) {
  return (
    <Band tone={tone} className="sg-section">
      <Rail label={title} title={title} tagline={tagline} href={href} listClassName="sg-shelf--cards">
        {products.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 60vw, 18rem" />
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Best sellers as numbered rows, three columns on wide screens, the order
 *  coming from real sales. */
export function TopCharts({ products, storeSlug, title, max = 9, href }: { products: ProductCardData[]; storeSlug: string; title: string; max?: number; href: string }) {
  const list = products.slice(0, max);
  return (
    <Band className="sg-section">
      <Wrap>
        <SectionHeader title={title} tagline="اللي الكل بيشتريه." href={href} />
        <ol aria-label={title} className="sg-charts">
          {list.map((p, i) => (
            <li key={p.id} className="sg-reveal min-w-0" style={{ ["--d" as string]: Math.min(i, 5) }}>
              <article className="sg-chart-row">
                <span aria-hidden className="sg-rank">
                  {num(i + 1)}
                </span>
                <span className="sg-chart-media">
                  <PlateImage src={p.image} sizes="72px" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-(--sg-ink) after:absolute after:inset-0 after:z-[1] after:content-['']">
                    <span className="sr-only">رقم {num(i + 1)}: </span>
                    {p.name}
                  </Link>
                  <Price price={p.price} compareAt={p.compareAtPrice} size="sm" />
                </span>
                <BuyButton storeSlug={storeSlug} product={p} variant="gray" className="relative z-[2] shrink-0" />
              </article>
            </li>
          ))}
        </ol>
      </Wrap>
    </Band>
  );
}

/** Limited-time deals on night: a gradient headline, the merchant's own timer
 *  in big numerals, real discounts and, when nearly gone, the real units left. */
export function DealsBand({ products, storeSlug, title, lowStock, timer }: { products: ProductCardData[]; storeSlug: string; title: string; lowStock?: boolean; timer?: ReactNode }) {
  const list = products.slice(0, 10);
  return (
    <Band tone="night" aria-label={title} className="sg-section sg-deals">
      <Wrap className="text-center">
        <p className="sg-eyebrow sg-gradient-text sg-reveal">لفترة محدودة</p>
        <h2 className="sg-display sg-reveal mx-auto mt-2 max-w-[18ch] text-balance">{title}</h2>
        {timer && <div className="sg-reveal mt-8 flex justify-center">{timer}</div>}
      </Wrap>
      <Rail label={title} className="mt-10" listClassName="sg-shelf--cards">
        {list.map((p) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} sizes="(max-width: 768px) 60vw, 18rem" />
            {lowStock && p.stock <= 5 && <p className="mt-2 text-center text-xs font-semibold text-(--sg-low)">باقي {num(p.stock)} بس</p>}
          </li>
        ))}
      </Rail>
    </Band>
  );
}
