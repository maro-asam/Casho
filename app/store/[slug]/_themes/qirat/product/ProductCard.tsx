import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, Swatches, delay, discountPercent, num } from "../ui";
import QuickAdd from "./QuickAdd";
import WishButton from "./WishButton";

/** Corner tags from real data only: sold out, a real saving, or new. */
export function CardTag({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew">; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0)
    return (
      <span className={cn("qr-tag", className)} data-tone="out">
        نفدت
      </span>
    );
  if (off > 0)
    return (
      <span className={cn("qr-tag", className)} data-tone="sale">
        خصم {num(off)}٪
      </span>
    );
  if (product.isNew)
    return (
      <span className={cn("qr-tag", className)} data-tone="new">
        جديد
      </span>
    );
  return null;
}

/** Casho Qirat's jewel-box card: the piece on a softly lit plate (its second
 *  photo crossfades in on hover, a glint passes over it), the name in serif.
 *  Its look follows the Studio "product card" setting through `[data-card]`
 *  on the store root — centered (default), framed box, bare, or velvet; the
 *  photo ratio and the columns follow the Studio too. */
export default function ProductCard({
  product,
  storeSlug,
  priority,
  index = 0,
  sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw",
  className,
}: {
  product: ProductCardData;
  storeSlug: string;
  priority?: boolean;
  /** Position in its grid — staggers the reveal. */
  index?: number;
  sizes?: string;
  className?: string;
}) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;

  return (
    <article className={cn("qr-card qr-reveal group", className)} style={delay(Math.min(index, 5))} data-soldout={soldOut || undefined}>
      <div className="qr-card-media" style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }}>
        <PlateImage src={product.image} priority={priority} sizes={sizes} className={cn("qr-card-img", product.hoverImage && "has-swap")} />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="qr-card-img2 object-cover" />}
        <span aria-hidden className="qr-glint" />
        <CardTag product={product} className="qr-card-tag" />
        <WishButton storeSlug={storeSlug} productId={product.id} name={product.name} className="qr-card-wish" />
        <QuickAdd storeSlug={storeSlug} product={product} className="qr-card-quick" />
      </div>

      <div className="qr-card-body">
        {(product.brand || product.categoryName) && <p className="qr-card-kicker">{product.brand || product.categoryName}</p>}
        <h3 className="qr-card-title">
          <Link href={href} title={product.name} className="qr-cover-link">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className="qr-card-price" />
        {product.colors.length > 0 && <Swatches colors={product.colors} className="qr-card-swatches" />}
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="qr-card-rating" />}
      </div>
    </article>
  );
}

/** Product grid (2 → 3 → the merchant's columns). */
export function ProductGrid({ products, storeSlug, priorityCount = 0, className }: { products: ProductCardData[]; storeSlug: string; priorityCount?: number; className?: string }) {
  return (
    <ul className={cn("qr-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
