import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import BuyButton from "../product/BuyButton";
import { MoreLink, PlateImage, Price } from "../ui";

/** Casho Stage's own section: one product on night, the way Apple opens a
 *  launch. With motion on, the section pins while you scroll: the name steps
 *  back, the product grows to fill the stage, then the price and the buy
 *  button arrive (CSS scroll-driven animations; anywhere they aren't supported,
 *  with reduced motion, or with the Studio's motion off, it's a still layout).
 *  The product is the store's first featured one, else its newest. */
export default function Spotlight({ product, storeSlug }: { product: ProductCardData; storeSlug: string }) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  return (
    <section data-tone="night" aria-label={`تحت الأضواء: ${product.name}`} className="sg-band sg-spot">
      <div className="sg-spot-stage">
        <div className="sg-spot-head">
          <p className="sg-eyebrow sg-gradient-text">{product.isNew ? "جديد. تحت الأضواء." : "تحت الأضواء."}</p>
          <h2 className="sg-spot-title text-balance">{product.name}</h2>
          {product.categoryName && <p className="sg-spot-kicker">{product.categoryName}</p>}
        </div>
        <Link href={href} tabIndex={-1} aria-hidden className="sg-spot-media">
          <PlateImage src={product.image} sizes="(max-width: 768px) 92vw, 64rem" />
        </Link>
        <div className="sg-spot-buy">
          <Price price={product.price} compareAt={product.compareAtPrice} size="lg" chip className="justify-center" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <BuyButton storeSlug={storeSlug} product={product} className="sg-btn--md-force" />
            <MoreLink href={href} className="text-[1.0625rem]">
              اعرف أكتر
            </MoreLink>
          </div>
        </div>
      </div>
    </section>
  );
}
