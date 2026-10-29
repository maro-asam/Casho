import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, Swatches, delay, discountPercent, num } from "../ui";
import { CardAddButton, CardAddFab, QuickLook } from "./CardActions";

/** Corner labels from real product data: unavailable, "-X%" on a real
 *  discount, "new" (added in the last 30 days) or the store's pick. */
export function CardBadges({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew" | "isFeatured">; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0) {
    return (
      <span className={cn("flex flex-col items-start gap-1", className)}>
        <span className="rx-badge rx-badge--out">غير متوفر</span>
      </span>
    );
  }
  return (
    <span className={cn("flex flex-col items-start gap-1", className)}>
      {off > 0 && <span className="rx-badge rx-badge--sale">خصم {num(off)}٪</span>}
      {product.isNew && <span className="rx-badge rx-badge--new">جديد</span>}
      {off === 0 && !product.isNew && product.isFeatured && <span className="rx-badge rx-badge--pick">اختيار المتجر</span>}
    </span>
  );
}

/** Casho Medical product card. Its look follows the merchant's Studio
 *  "product card" setting through `[data-card]` on the store root (framed,
 *  minimal, bold or elegant — see medical.css); the image ratio and the
 *  number of columns follow the Studio too. Inside a `[data-view="list"]`
 *  container it lays out horizontally. */
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
    <article className="rx-card rx-reveal group in-data-[view=list]:flex-row in-data-[view=list]:gap-4 sm:in-data-[view=list]:gap-6" style={delay(Math.min(index, 5))}>
      <div className="rx-media shrink-0 in-data-[view=list]:w-32 sm:in-data-[view=list]:w-48" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage
          src={product.image}
          priority={priority}
          sizes={sizes}
          className={cn("rx-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-50 grayscale")}
        />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="rx-card-img-2 rx-product-img" />}
        <CardBadges product={product} className="pointer-events-none absolute start-2 top-2 z-[2]" />
        <QuickLook slug={product.slug} name={product.name} className="rx-card-peek !absolute end-2 top-2 max-lg:hidden" />
        <CardAddFab storeSlug={storeSlug} product={product} className="rx-card-quick !absolute bottom-2 end-2" />
      </div>

      <div className="rx-card-body in-data-[view=list]:pt-1">
        {(product.brand || product.categoryName) && <p className="truncate text-xs text-(--rx-quiet)">{product.brand || product.categoryName}</p>}
        <h3 className="rx-card-title mt-1 line-clamp-2 min-h-[2.75em] text-[0.875rem] leading-snug font-semibold text-(--rx-ink) sm:text-[0.9375rem] in-data-[view=list]:min-h-0">
          <Link
            href={href}
            title={product.name}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-(--rx-btn) focus-visible:outline-none focus-visible:after:rounded-(--rx-r) focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--rx-btn)"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-1.5" />}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Price price={product.price} compareAt={product.compareAtPrice} />
          {product.colors.length > 0 && <Swatches colors={product.colors} />}
        </div>
        <div className="rx-card-cta in-data-[view=list]:max-w-56">
          <CardAddButton storeSlug={storeSlug} product={product} />
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
    <ul data-sidebar="false" className={cn("rx-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
