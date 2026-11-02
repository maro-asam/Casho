import type { ReactNode } from "react";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { CardAddButton, CardAddFab } from "../product/CardActions";
import MiniCard from "../product/MiniCard";
import ProductCard, { CardBadges } from "../product/ProductCard";
import Rail from "../product/Rail";
import { Chevron, PlateImage, Price, Rating, SectionHeader, Wrap, num } from "../ui";
import WeightPlate from "./WeightPlate";

/** Titled product carousel ("store picks"…). */
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
  const list = products.slice(0, max);
  // Fewer cards than columns: a title panel fills the row instead of a hole.
  if (list.length <= 3) {
    return (
      <Wrap className="gy-section">
        <div className="gy-few" style={{ ["--n" as string]: list.length }}>
          <div className="gy-few-head">
            <WeightPlate label="" />
            <SectionHeader eyebrow={eyebrow} title={title} sub={sub} href={href} className="!mb-5 w-full flex-col !items-start lg:!mb-0" />
          </div>
          <ul className="contents max-lg:grid max-lg:grid-cols-2 max-lg:gap-2.5">
            {list.map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 1024px) 46vw, 24vw" />
              </li>
            ))}
          </ul>
        </div>
      </Wrap>
    );
  }
  return (
    <Wrap className="gy-section">
      <Rail label={title} eyebrow={eyebrow} title={title} sub={sub} href={href}>
        {list.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 46vw, (max-width: 1280px) 25vw, 22vw" />
          </li>
        ))}
      </Rail>
    </Wrap>
  );
}

/** One ranked line of the leaderboard. */
function RankRow({ product, rank, storeSlug }: { product: ProductCardData; rank: number; storeSlug: string }) {
  return (
    <div className="gy-rank-row group">
      <span aria-hidden className="gy-rank-num">
        {num(rank)}
      </span>
      <span className="gy-media aspect-square">
        <PlateImage src={product.image} sizes="76px" className="gy-zoom-img" />
      </span>
      <span className="min-w-0">
        <Link href={buildStoreUrl(storeSlug, `/products/${product.slug}`)} className="line-clamp-2 text-sm leading-snug font-extrabold text-(--gy-ink) after:absolute after:inset-0 after:content-[''] hover:text-(--gy-link)">
          {product.name}
        </Link>
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className="mt-0.5" />
      </span>
      <CardAddFab storeSlug={storeSlug} product={product} className="size-10" />
    </div>
  );
}

/** Best sellers as a leaderboard: number one gets the big slab, the next four
 *  a ranked list, anything else the merchant asked for keeps counting in a row
 *  underneath. The order is the store's real sales order. */
export function Podium({ products, storeSlug, title, href, max }: { products: ProductCardData[]; storeSlug: string; title: string; href: string; max: number }) {
  const list = products.slice(0, max);
  if (list.length === 0) return null;
  const eyebrow = (
    <>
      <Flame />
      الأكثر طلبًا
    </>
  );
  // Too few for a podium: a plain rail reads better.
  if (list.length < 3) return <ProductRow products={list} storeSlug={storeSlug} eyebrow={eyebrow} title={title} href={href} max={max} />;

  const [champ, ...others] = list;
  const ranked = others.slice(0, 4);
  const rest = others.slice(4);
  const url = (p: ProductCardData) => buildStoreUrl(storeSlug, `/products/${p.slug}`);

  return (
    <Wrap className="gy-section">
      <header className="gy-head">
        <div className="min-w-0">
          <p className="gy-eyebrow mb-2">{eyebrow}</p>
          <h2 className="gy-h2 text-balance">{title}</h2>
        </div>
        <Link href={href} className="gy-link text-sm">
          عرض الكل
          <Chevron />
        </Link>
      </header>

      <div className="gy-podium">
        <article className="gy-champ gy-reveal group">
          <div className="relative z-[1] flex min-w-0 flex-col justify-center p-5 sm:p-7">
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-extrabold text-(--gy-link)">
                <span aria-hidden className="grid size-9 place-items-center bg-(--gy-btn) text-(--gy-btn-ink)">
                  <Trophy className="size-5" />
                </span>
                رقم {num(1)} في المبيعات
              </p>
              {(champ.brand || champ.categoryName) && <p className="mt-3 text-sm font-bold text-(--gy-quiet)">{champ.brand || champ.categoryName}</p>}
              <h3 className="gy-h3 mt-1 !text-[clamp(1.375rem,2.3vw,2rem)] !font-black text-balance">
                <Link href={url(champ)} className="hover:text-(--gy-link)">
                  {champ.name}
                </Link>
              </h3>
              {champ.rating && <Rating value={champ.rating.average} count={champ.rating.count} size="md" className="mt-2" />}
              <Price price={champ.price} compareAt={champ.compareAtPrice} size="lg" chip className="mt-3" />
              <div className="mt-5 max-w-56">
                <CardAddButton storeSlug={storeSlug} product={champ} size="md" />
              </div>
            </div>
          </div>
          <Link href={url(champ)} tabIndex={-1} aria-hidden className="gy-champ-plate max-sm:-order-1">
            <PlateImage src={champ.image} sizes="(max-width: 640px) 100vw, 30vw" className="gy-zoom-img" />
            <CardBadges product={champ} className="pointer-events-none absolute start-3 top-3 z-[2]" />
          </Link>
        </article>

        <ol className="gy-ranks gy-panel" aria-label={`باقي ${title}`}>
          {ranked.map((p, i) => (
            <li key={p.id} className="gy-reveal" style={{ ["--d" as string]: i }}>
              <RankRow product={p} rank={i + 2} storeSlug={storeSlug} />
            </li>
          ))}
        </ol>
      </div>

      {rest.length > 0 && (
        <ol className="gy-ranks-more" aria-label={`${title} — المزيد`}>
          {rest.map((p, i) => (
            <li key={p.id} className="gy-reveal min-w-0">
              <RankRow product={p} rank={i + 6} storeSlug={storeSlug} />
            </li>
          ))}
        </ol>
      )}
    </Wrap>
  );
}

/** Deals poster: a full-bleed block in the store color with slanted edges, the
 *  merchant's countdown as gym-timer digits and real discounts on black cards.
 *  `lowStock` (Studio) adds the real units left on nearly-gone items. */
export function DealsPanel({ products, storeSlug, title, timer, ghost, lowStock }: { products: ProductCardData[]; storeSlug: string; title: string; timer?: ReactNode; ghost: string; lowStock?: boolean }) {
  if (products.length === 0) return null;
  return (
    <section className="gy-deals">
      <span aria-hidden className="gy-deals-ghost">
        {ghost}
      </span>
      <Wrap>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-1 text-sm font-extrabold opacity-90">خصومات حقيقية</p>
            <h2 className="gy-hero max-w-[18ch] !text-current text-balance">{title}</h2>
          </div>
          {timer}
        </header>
        <ul className="grid gap-(--gy-gap) sm:grid-cols-2 xl:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <li key={p.id} className="gy-reveal min-w-0">
              <MiniCard product={p} storeSlug={storeSlug} note={lowStock && p.stock <= 5 ? `باقي ${num(p.stock)} بس` : undefined} />
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}
