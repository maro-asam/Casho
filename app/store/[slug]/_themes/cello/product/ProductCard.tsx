import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, Swatches, delay } from "../ui";
import { CardCartButton, QuickLook } from "./CardActions";

/** Corner label from real product data: sold out, "Save X" on a real
 *  discount, otherwise "New" (added in the last 30 days) or the store's pick. */
export function CardBadge({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew" | "isFeatured">; className?: string }) {
  const save = product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;
  return (
    <span className={cn("flex flex-col items-start gap-1", className)}>
      {product.stock <= 0 ? (
        <span className="ce-badge ce-badge--out">نفدت الكمية</span>
      ) : save > 0 ? (
        <span className="ce-badge ce-badge--drop">وفّر {formatPrice(save)}</span>
      ) : product.isNew ? (
        <span className="ce-badge ce-badge--new">جديد</span>
      ) : product.isFeatured ? (
        <span className="ce-badge ce-badge--pick">اختيار المتجر</span>
      ) : null}
      {product.stock > 0 && save > 0 && product.isNew && <span className="ce-badge ce-badge--new">جديد</span>}
    </span>
  );
}

/** Cello product card: a white card with the badge and an underlined
 *  "Quick look" link above the contained product shot, a square navy cart
 *  button on the image's bottom corner, then category, two-line title,
 *  price with a red struck compare-at price, and "Color: …" with square
 *  swatches. Inside a `[data-view="list"]` container it lays out
 *  horizontally. */
export default function ProductCard({
  product,
  storeSlug,
  priority,
  index = 0,
  sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw",
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
    <article
      className="ce-card ce-reveal group relative flex h-full flex-col p-2.5 sm:p-4 in-data-[view=list]:flex-row in-data-[view=list]:gap-4 sm:in-data-[view=list]:gap-6"
      style={delay(Math.min(index, 5))}
    >
      <div className="relative shrink-0 in-data-[view=list]:w-32 sm:in-data-[view=list]:w-56">
        <div className="relative z-[2] flex min-h-6 items-start justify-between gap-2">
          <CardBadge product={product} />
          <QuickLook slug={product.slug} name={product.name} />
        </div>
        <div className="ce-media mt-1.5 !bg-transparent" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
          <PlateImage
            src={product.image}
            priority={priority}
            sizes={sizes}
            className={cn("ce-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-50 grayscale")}
          />
          {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="ce-card-img-2 ce-product-img" />}
        </div>
        <CardCartButton storeSlug={storeSlug} product={product} className="relative z-[2] -mt-6 sm:-mt-7" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-3 sm:pt-4 in-data-[view=list]:pt-8">
        {(product.brand || product.categoryName) && <p className="truncate text-xs text-(--ce-quiet)">{product.brand || product.categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 text-[0.9375rem] leading-snug font-medium text-(--ce-ink) sm:text-base">
          <Link
            href={href}
            title={product.name}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-(--ce-btn) focus-visible:outline-none focus-visible:after:rounded-(--ce-r) focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--ce-btn)"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-1.5" />}
        <Price price={product.price} compareAt={product.compareAtPrice} className="mt-1.5" />
        {product.colors.length > 0 && <Swatches colors={product.colors} className="mt-2" />}
      </div>
    </article>
  );
}

/** Product grid (2 → 3 → 4/5 by width and merchant columns). */
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
    <ul data-sidebar="false" className={cn("ce-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
