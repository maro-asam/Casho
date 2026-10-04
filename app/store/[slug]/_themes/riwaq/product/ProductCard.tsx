import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { Price, StarMark, Stars, discountPercent, idx, num, PlateImage } from "../ui";
import QuickAdd from "./QuickAdd";

type Props = {
  product: ProductCardData;
  storeSlug: string;
  /** Catalogue number shown above the plate (1-based). */
  index?: number;
  /** First row of a page — load the image eagerly. */
  priority?: boolean;
  sizes?: string;
};

/** A catalogue entry: number + status set in type above a plain plate,
 *  then name, price and a square add button. No box, no shadow. */
export default function ProductCard({
  product,
  storeSlug,
  index,
  priority,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: Props) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="mb-2.5 flex min-h-[1.625rem] items-center justify-between gap-2">
        {index !== undefined ? <span className="rq-num text-xs text-(--rq-quiet)">{idx(index)}</span> : <span />}
        {soldOut ? (
          <span className="rq-badge rq-badge--ink">نفدت الكمية</span>
        ) : discount > 0 ? (
          <span className="rq-badge rq-badge--sale">−{num(discount)}٪</span>
        ) : product.isFeatured ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--rq-accent)">
            <StarMark className="size-2.5" />
            مختار
          </span>
        ) : null}
      </div>

      <div className="rq-plate relative overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }}>
        <PlateImage
          src={product.image}
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]",
            soldOut && "opacity-55 grayscale",
          )}
        />
      </div>

      <div className="mt-3.5 flex flex-1 flex-col">
        {product.categoryName && <p className="rq-caption truncate">{product.categoryName}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-[0.9375rem] font-medium leading-6 sm:text-base">
          {/* Stretched link: the whole entry is one target and one tab stop */}
          <Link
            href={href}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-(--rq-accent)"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating && product.rating.count > 0 && (
          <Stars value={product.rating.average} count={product.rating.count} className="mt-1.5" />
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price price={product.price} compareAt={product.compareAtPrice} className="min-w-0" />
          {!soldOut && (
            <QuickAdd
              storeSlug={storeSlug}
              productId={product.id}
              productName={product.name}
              productHref={href}
              hasOptions={product.hasOptions}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/** Products in a ruled catalogue grid (2 → 3 → merchant columns). */
export function RuledGrid({
  products,
  storeSlug,
  priorityCount = 0,
  startIndex = 1,
  className,
}: {
  products: ProductCardData[];
  storeSlug: string;
  priorityCount?: number;
  startIndex?: number;
  className?: string;
}) {
  return (
    <ul className={cn("rq-ruled", className)}>
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} storeSlug={storeSlug} index={startIndex + i} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
