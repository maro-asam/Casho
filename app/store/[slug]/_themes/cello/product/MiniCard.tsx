import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { PlateImage, Price } from "../ui";
import { CardBadge } from "./ProductCard";

/** Horizontal white card (thumbnail, category, title, price) used in Cello's
 *  "Top tech deals" and "Recommended for you" panels. */
export default function MiniCard({ product, storeSlug }: { product: ProductCardData; storeSlug: string }) {
  return (
    <article className="ce-card group relative flex h-full items-center gap-4 p-4 sm:gap-5 sm:p-6">
      <div className="relative size-20 shrink-0 sm:size-24">
        <PlateImage src={product.image} sizes="96px" className="ce-zoom-img" />
        <CardBadge product={product} className="absolute -start-1 top-0 z-[2] [&>*]:!min-h-5 [&>*]:!px-1.5 [&>*]:!text-[0.6875rem]" />
      </div>
      <div className="min-w-0 flex-1">
        {(product.brand || product.categoryName) && <p className="truncate text-xs text-(--ce-quiet)">{product.brand || product.categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 text-[0.9375rem] leading-snug font-medium text-(--ce-ink) sm:text-base">
          <Link href={buildStoreUrl(storeSlug, `/products/${product.slug}`)} className="after:absolute after:inset-0 after:content-[''] hover:text-(--ce-btn)">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAt={product.compareAtPrice} className="mt-1.5" />
      </div>
    </article>
  );
}
