import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { Eyebrow, PlateImage, Price, Rating, Swatches, delay, discountPercent, num } from "../ui";
import BuyButton from "./BuyButton";

/** apple.com's eyebrow from real product data: unavailable, a real saving,
 *  or "new" (added in the last 30 days). */
export function CardEyebrow({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew">; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0) return <Eyebrow className={cn("!text-(--sg-label-2)", className)}>خلصت الكمية</Eyebrow>;
  if (off > 0) return <Eyebrow className={className}>وفّر {num(off)}٪</Eyebrow>;
  if (product.isNew) return <Eyebrow className={className}>جديد</Eyebrow>;
  return null;
}

/** Casho Stage product card. Its look follows the Studio "product card"
 *  setting through `[data-card]` on the store root (store card, bare, night or
 *  centered — see stage.css); the image ratio and the number of columns follow
 *  the Studio too. Inside a `[data-view="list"]` container it lays out as a row. */
export default function ProductCard({
  product,
  storeSlug,
  priority,
  index = 0,
  sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw",
}: {
  product: ProductCardData;
  storeSlug: string;
  priority?: boolean;
  /** Position in its grid — staggers the reveal. */
  index?: number;
  sizes?: string;
}) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;

  return (
    <article className="sg-card sg-reveal group in-data-[view=list]:flex-row in-data-[view=list]:items-center" style={delay(Math.min(index, 5))}>
      <div className="sg-card-media in-data-[view=list]:w-28 sm:in-data-[view=list]:w-36" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage src={product.image} priority={priority} sizes={sizes} className={cn("sg-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-50 grayscale")} />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="sg-card-img-2 object-cover" />}
      </div>

      <div className="sg-card-body">
        {product.colors.length > 0 && <Swatches colors={product.colors} className="sg-card-swatches" />}
        <CardEyebrow product={product} />
        <h3 className="sg-card-title">
          <Link
            href={href}
            title={product.name}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:rounded-(--sg-r-lg) focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--sg-tint)"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-1" />}
        <div className="sg-card-foot">
          <Price price={product.price} compareAt={product.compareAtPrice} />
          <BuyButton storeSlug={storeSlug} product={product} className="sg-card-buy relative z-[2]" />
        </div>
      </div>
    </article>
  );
}

/** Product grid (2 → 3 → the merchant's columns). */
export function ProductGrid({
  products,
  storeSlug,
  priorityCount = 0,
  className,
}: {
  products: ProductCardData[];
  storeSlug: string;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul data-sidebar="false" className={cn("sg-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
