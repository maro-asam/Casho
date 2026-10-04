import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Rating, Swatches, discountPercent, num } from "../ui";
import CardActions, { WishlistButton } from "./CardActions";

type Variant = "standard" | "compact";

function Badges({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 3;
  return (
    <div className="pointer-events-none absolute start-3 top-3 z-[2] flex flex-col items-start gap-1.5">
      {soldOut ? (
        <span className="md-badge md-badge--ink">نفدت الكمية</span>
      ) : (
        <>
          {discount > 0 && <span className="md-badge md-badge--sale">−{num(discount)}٪</span>}
          {product.isNew && <span className="md-badge md-badge--new">جديد</span>}
          {low && <span className="md-badge md-badge--soft">آخر {num(product.stock)} قطع</span>}
        </>
      )}
    </div>
  );
}

/** The standard product tile: studio image with a hover swap, badges, wishlist,
 *  floating actions, then a calm info block. `compact` trims it for rails. */
export default function ProductCard({
  product,
  storeSlug,
  priority,
  variant = "standard",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  product: ProductCardData;
  storeSlug: string;
  priority?: boolean;
  variant?: Variant;
  sizes?: string;
}) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const compact = variant === "compact";

  return (
    <article className="md-card group relative flex h-full flex-col">
      <div className="md-media" style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }}>
        <PlateImage
          src={product.image}
          priority={priority}
          sizes={sizes}
          className={cn("md-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-60 grayscale")}
        />
        {product.hoverImage && (
          <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="md-card-img-2 object-cover" />
        )}
        <Badges product={product} />
        <WishlistButton storeSlug={storeSlug} product={product} className="absolute end-2.5 top-2.5 size-10" />
        <CardActions storeSlug={storeSlug} product={product} />
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "pt-3" : "pt-4")}>
        <div className="flex min-h-5 items-center justify-between gap-2">
          <p className="truncate text-xs text-(--md-quiet)">{product.brand || product.categoryName}</p>
          {!compact && <Swatches colors={product.colors} />}
        </div>
        <h3 className={cn("mt-1 line-clamp-2 font-medium leading-6", compact ? "text-sm" : "text-[0.9375rem]")}>
          <Link
            href={href}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:rounded-(--md-radius) focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-(--md-brand)"
          >
            {product.name}
          </Link>
        </h3>
        {!compact && product.rating && product.rating.count > 0 && (
          <Rating value={product.rating.average} count={product.rating.count} className="mt-1.5" />
        )}
        <Price price={product.price} compareAt={product.compareAtPrice} size={compact ? "sm" : "md"} className="mt-auto pt-2" />
      </div>
    </article>
  );
}

/** Responsive product grid: 2 → 3 → merchant columns (or a fixed count). */
export function ProductGrid({
  products,
  storeSlug,
  priorityCount = 0,
  cols,
  className,
  children,
}: {
  products: ProductCardData[];
  storeSlug: string;
  priorityCount?: number;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
  /** Extra tiles appended to the grid (e.g. a promo). */
  children?: React.ReactNode;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10",
        !cols && "lg:grid-cols-[repeat(var(--store-grid-cols,4),minmax(0,1fr))]",
        cols === 2 && "lg:grid-cols-2",
        cols === 3 && "lg:grid-cols-3",
        cols === 4 && "lg:grid-cols-4",
        cols === 5 && "lg:grid-cols-5",
        className,
      )}
    >
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} />
        </li>
      ))}
      {children}
    </ul>
  );
}
