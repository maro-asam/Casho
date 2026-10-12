import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, StockLine, Swatches, delay, discountPercent } from "../ui";
import CardActions from "./CardActions";

/** Stacked corner labels from real product data only. */
function Badges({ product }: { product: ProductCardData }) {
  if (product.stock <= 0) return <span className="mx-badge mx-badge--out">نفدت الكمية</span>;
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <>
      {product.isFeatured && <span className="mx-badge mx-badge--pick">اختيار المتجر</span>}
      {off > 0 && <span className="mx-badge mx-badge--drop">تخفيض</span>}
      {product.isNew && <span className="mx-badge mx-badge--new">جديد</span>}
    </>
  );
}

/** Maximize product card: grey plate with the product shot contained, stacked
 *  labels, hover quick view + add-to-cart bar, then brand, one-line title,
 *  rating, price with "-%" chip, swatches and stock. Inside a
 *  `[data-view="list"]` container it lays out horizontally. */
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
      className="mx-card mx-reveal group relative flex h-full flex-col in-data-[view=list]:flex-row in-data-[view=list]:gap-4 in-data-[view=list]:border-b in-data-[view=list]:border-(--mx-line) in-data-[view=list]:py-4 sm:in-data-[view=list]:gap-6"
      style={delay(Math.min(index, 5))}
    >
      <div className="mx-media shrink-0 in-data-[view=list]:w-32 sm:in-data-[view=list]:w-52" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage
          src={product.image}
          priority={priority}
          sizes={sizes}
          className={cn("mx-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-50 grayscale")}
        />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="mx-card-img-2 mx-product-img" />}
        <div className="pointer-events-none absolute start-2 top-2 z-[2] flex flex-col items-start gap-1.5">
          <Badges product={product} />
        </div>
        <CardActions storeSlug={storeSlug} product={product} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-3 in-data-[view=list]:pt-1">
        {(product.brand || product.categoryName) && <p className="truncate text-[0.8125rem] text-(--mx-quiet)">{product.brand || product.categoryName}</p>}
        <h3 className="mt-0.5 truncate text-[0.9375rem] font-semibold text-(--mx-ink) in-data-[view=list]:line-clamp-2 in-data-[view=list]:whitespace-normal">
          <Link
            href={href}
            title={product.name}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-(--mx-link) focus-visible:outline-none focus-visible:after:rounded-(--mx-r) focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--mx-btn)"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating && <Rating value={product.rating.average} count={product.rating.count} className="mt-1.5" />}
        <Price price={product.price} compareAt={product.compareAtPrice} className="mt-2" />
        {product.colors.length > 0 && <Swatches colors={product.colors} className="mt-2.5" />}
        <StockLine stock={product.stock} className="mt-2.5" />
      </div>
    </article>
  );
}

/** Responsive product grid (2 → 3 → 4/5/6 by width and merchant columns). */
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
    <ul data-sidebar="false" className={cn("mx-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
