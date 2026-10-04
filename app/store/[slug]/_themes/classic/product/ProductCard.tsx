import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { Price, Stars, discountPercent } from "../ui";
import QuickAddButton from "./QuickAddButton";

type Props = {
  product: ProductCardData;
  storeSlug: string;
  /** First row of a page — load the image eagerly. */
  priority?: boolean;
  sizes?: string;
};

export default function ProductCard({
  product,
  storeSlug,
  priority,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: Props) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="group relative flex h-full flex-col">
      <div
        className="c-img-bg relative overflow-hidden rounded-(--c-radius)"
        style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}
      >
        <Image
          src={product.image || "/images/product-placeholder.png"}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            soldOut && "opacity-60 grayscale-[35%]",
          )}
        />

        {/* Badges — at most two, top start corner */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-(--c-radius-sm) bg-foreground px-2 py-1 text-[0.6875rem] font-semibold leading-none text-background">
              نفد المخزون
            </span>
          ) : discount > 0 ? (
            <span className="rounded-(--c-radius-sm) bg-(--c-sale-solid) px-2 py-1 text-[0.6875rem] font-bold leading-none text-white tabular-nums">
              خصم {discount}%
            </span>
          ) : product.isFeatured ? (
            <span className="rounded-(--c-radius-sm) bg-background/95 px-2 py-1 text-[0.6875rem] font-semibold leading-none text-foreground shadow-sm">
              مميز
            </span>
          ) : null}
        </div>

        {!soldOut && (
          <QuickAddButton
            storeSlug={storeSlug}
            productId={product.id}
            productName={product.name}
            productHref={href}
            hasOptions={product.hasOptions}
            className="absolute bottom-2 end-2"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[0.875rem] font-medium leading-5 sm:text-[0.9375rem] sm:leading-[1.375rem] sm:min-h-[2.75rem]">
          {/* Stretched link: the whole card is one target, one tab stop */}
          <Link
            href={href}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:rounded-(--c-radius) focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-primary"
          >
            {product.name}
          </Link>
        </h3>

        {product.rating && product.rating.count > 0 && (
          <Stars value={product.rating.average} count={product.rating.count} className="mt-1.5" />
        )}

        <Price price={product.price} compareAt={product.compareAtPrice} className="mt-auto pt-1.5" />
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  storeSlug,
  priorityCount = 0,
  cols,
  className,
}: {
  products: ProductCardData[];
  storeSlug: string;
  priorityCount?: number;
  /** Cap desktop columns (e.g. 3 next to a filter sidebar). */
  cols?: 3;
  className?: string;
}) {
  return (
    <ul className={cn("c-product-grid", className)} data-cols={cols}>
      {products.map((product, i) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} storeSlug={storeSlug} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
