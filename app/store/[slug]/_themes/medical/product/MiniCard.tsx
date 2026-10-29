import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { PlateImage, Price } from "../ui";
import { CardAddFab } from "./CardActions";
import { CardBadges } from "./ProductCard";

/** Horizontal card: image, name and price with a round add button. */
export default function MiniCard({ product, storeSlug }: { product: ProductCardData; storeSlug: string }) {
  return (
    <article className="group relative flex h-full items-center gap-3 rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card) p-2.5 transition-shadow hover:shadow-(--rx-shadow-sm) sm:gap-4 sm:p-3">
      <span className="rx-media relative block size-24 shrink-0 sm:size-28">
        <PlateImage src={product.image} sizes="112px" className="rx-zoom-img" />
        <CardBadges product={product} className="pointer-events-none absolute start-1.5 top-1.5 z-[2] [&_.rx-badge]:min-h-5 [&_.rx-badge]:px-2 [&_.rx-badge]:text-[0.6875rem]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col self-stretch py-1">
        {(product.brand || product.categoryName) && <span className="truncate text-xs text-(--rx-quiet)">{product.brand || product.categoryName}</span>}
        <Link
          href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
          className="mt-0.5 line-clamp-2 text-sm leading-snug font-semibold text-(--rx-ink) after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-(--rx-btn)"
        >
          {product.name}
        </Link>
        <span className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price price={product.price} compareAt={product.compareAtPrice} size="sm" />
          <CardAddFab storeSlug={storeSlug} product={product} className="size-9" />
        </span>
      </span>
    </article>
  );
}
