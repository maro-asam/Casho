import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, Swatches, delay, discountPercent, num } from "../ui";
import { QuickLook } from "./CardActions";
import Stepper from "./Stepper";

/** Corner labels from real product data: unavailable, "-X%" on a real
 *  discount, "new" (added in the last 30 days) or the store's pick. */
export function CardBadges({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew" | "isFeatured">; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0) {
    return (
      <span className={cn("flex flex-col items-start gap-1", className)}>
        <span className="mk-badge mk-badge--out">خلص</span>
      </span>
    );
  }
  return (
    <span className={cn("flex flex-col items-start gap-1", className)}>
      {off > 0 && <span className="mk-badge mk-badge--sale">خصم {num(off)}٪</span>}
      {off === 0 && product.isNew && <span className="mk-badge mk-badge--new">جديد</span>}
    </span>
  );
}

/** Casho Market product card. Its look follows the Studio "product card"
 *  setting through `[data-card]` on the store root (tile, big add button, bare
 *  or centered — see market.css); the image ratio and the number of columns
 *  follow the Studio too. Inside a `[data-view="list"]` container it lays out
 *  as a row. */
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
    <article className="mk-card mk-reveal group in-data-[view=list]:flex-row in-data-[view=list]:items-center" style={delay(Math.min(index, 5))}>
      <div className="mk-media shrink-0 in-data-[view=list]:w-24 sm:in-data-[view=list]:w-32" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage src={product.image} priority={priority} sizes={sizes} className={cn("mk-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-50 grayscale")} />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="mk-card-img-2 mk-product-img" />}
        <CardBadges product={product} className="pointer-events-none absolute start-2 top-2 z-[2]" />
        <QuickLook slug={product.slug} name={product.name} className="mk-card-peek !absolute end-2 top-2 max-lg:hidden" />
      </div>

      <div className="mk-card-body">
        <Stepper storeSlug={storeSlug} product={product} className="mk-card-step" />
        <Price price={product.price} compareAt={product.compareAtPrice} />
        <h3 className="mk-card-title">
          <Link
            href={href}
            title={product.name}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:rounded-(--mk-r) focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--mk-tint)"
          >
            {product.name}
          </Link>
        </h3>
        {product.brand && <p className="mt-0.5 truncate text-xs text-(--mk-label-2)">{product.brand}</p>}
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-1" />}
        {product.colors.length > 0 && <Swatches colors={product.colors} className="mt-1" />}
        <Stepper storeSlug={storeSlug} product={product} block className="mk-card-cta" />
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
    <ul data-sidebar="false" className={cn("mk-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
