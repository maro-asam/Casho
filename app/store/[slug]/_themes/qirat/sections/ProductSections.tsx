import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import ProductCard, { CardTag } from "../product/ProductCard";
import QuickAdd from "../product/QuickAdd";
import Rail from "../product/Rail";
import WishButton from "../product/WishButton";
import { Band, Kicker, Ornament, PlateImage, Price, SectionHead, TextLink, Wrap, delay, num, num2 } from "../ui";

/** "The edit": the lead piece large on a lit plate with its story beside it,
 *  the next four in a 2×2 next to it. Phones get a shelf. */
export function FeaturedEdit({ products, storeSlug, href }: { products: ProductCardData[]; storeSlug: string; href: string }) {
  const [lead, ...rest] = products;
  const four = rest.slice(0, 4);
  const leadHref = buildStoreUrl(storeSlug, `/products/${lead.slug}`);
  return (
    <Band tone="alt" className="qr-section">
      <Wrap>
        <SectionHead kicker="اختيار المتجر" title="مختاراتنا" note="القطع اللي بننصح بيها دلوقتي." href={href} />
        <div className="qr-edit" data-n={four.length}>
          <article className="qr-edit-lead qr-reveal group">
            <div className="qr-plate qr-edit-lead-media">
              <PlateImage src={lead.image} sizes="(max-width: 1024px) 100vw, 50vw" className="qr-card-img has-swap" priority />
              {lead.hoverImage && <Image src={lead.hoverImage} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" loading="lazy" className="qr-card-img2 object-cover" />}
              <span aria-hidden className="qr-glint" />
              <CardTag product={lead} className="qr-card-tag" />
              <WishButton storeSlug={storeSlug} productId={lead.id} name={lead.name} className="qr-card-wish" />
            </div>
            <div className="qr-edit-lead-copy">
              <Kicker>{lead.brand || lead.categoryName || "قطعة مميزة"}</Kicker>
              <h3 className="qr-h2 mt-2 text-balance">
                <Link href={leadHref} className="qr-cover-link">
                  {lead.name}
                </Link>
              </h3>
              <Price price={lead.price} compareAt={lead.compareAtPrice} size="lg" save className="mt-3" />
              <div className="relative z-[2] mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <QuickAdd storeSlug={storeSlug} product={lead} className="qr-quick--inline" />
                <TextLink href={leadHref}>شوف التفاصيل</TextLink>
              </div>
            </div>
          </article>
          {four.length > 0 && (
            <ul className="qr-edit-grid">
              {four.map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <ProductCard product={p} storeSlug={storeSlug} index={i + 1} sizes="(max-width: 768px) 50vw, 22vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Wrap>
    </Band>
  );
}

/** A shelf of regular cards. */
export function ShelfRow({ products, storeSlug, title, kicker, href, tone = "page" }: { products: ProductCardData[]; storeSlug: string; title: string; kicker?: string; href?: string; tone?: "page" | "alt" }) {
  return (
    <Band tone={tone} className="qr-section">
      <Rail label={title} title={title} kicker={kicker} href={href} listClassName="qr-shelf--cards">
        {products.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 19rem" />
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Best sellers as a shelf, each piece numbered in serif ("٠١"), the order
 *  coming from real sales. */
export function BestSellers({ products, storeSlug, title, max = 8, href }: { products: ProductCardData[]; storeSlug: string; title: string; max?: number; href: string }) {
  const list = products.slice(0, max);
  return (
    <Band className="qr-section">
      <Rail label={title} title={title} kicker="الأكثر طلبًا" href={href} listClassName="qr-shelf--cards">
        {list.map((p, i) => (
          <li key={p.id} className="qr-ranked min-w-0">
            <span aria-hidden className="qr-rank">
              {num2(i + 1)}
            </span>
            <span className="sr-only">رقم {num(i + 1)}</span>
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 19rem" />
          </li>
        ))}
      </Rail>
    </Band>
  );
}

/** Limited-time pieces on velvet: the merchant's own timer in serif numerals,
 *  real discounts and, when nearly gone, the real pieces left. */
export function DealsBand({ products, storeSlug, title, lowStock, timer }: { products: ProductCardData[]; storeSlug: string; title: string; lowStock?: boolean; timer?: ReactNode }) {
  const list = products.slice(0, 10);
  return (
    <Band tone="velvet" aria-label={title} className="qr-section qr-deals">
      <Wrap className="text-center">
        <Kicker className="qr-reveal">لفترة محدودة</Kicker>
        <h2 className="qr-display qr-reveal mx-auto mt-3 max-w-[20ch] text-balance" style={delay(1)}>
          {title}
        </h2>
        <Ornament className="qr-reveal mt-6" />
        {timer && (
          <div className="qr-reveal mt-8 flex justify-center" style={delay(2)}>
            {timer}
          </div>
        )}
      </Wrap>
      <Rail label={title} className="mt-12" listClassName="qr-shelf--cards">
        {list.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <ProductCard product={p} storeSlug={storeSlug} index={i} sizes="(max-width: 768px) 62vw, 19rem" />
            {lowStock && p.stock > 0 && p.stock <= 5 && <p className="mt-2 text-center text-xs text-(--qr-gold)">باقي {num(p.stock)} بس</p>}
          </li>
        ))}
      </Rail>
    </Band>
  );
}
