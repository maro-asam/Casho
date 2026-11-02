import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductCardData } from "../../types";
import { PlateImage, Price } from "../ui";
import Stepper from "./Stepper";

/** A list row: picture, name, price and the stepper, as in a chart or a deal. */
export default function MiniCard({ product, storeSlug, note, rank }: { product: ProductCardData; storeSlug: string; /** Extra line (e.g. real units left). */ note?: string; /** Chart position. */ rank?: string }) {
  return (
    <article className="relative isolate flex h-full items-center gap-3">
      {rank && <span className="mk-rank">{rank}</span>}
      <span className="mk-media relative block size-16 shrink-0">
        <PlateImage src={product.image} sizes="64px" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
          className="line-clamp-2 text-[0.9375rem] leading-snug font-medium text-(--mk-ink) after:absolute after:inset-0 after:z-[1] after:content-['']"
        >
          {product.name}
        </Link>
        {note && <span className="text-xs font-medium text-(--mk-low)">{note}</span>}
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" />
      </span>
      <Stepper storeSlug={storeSlug} product={product} className="mk-step--row relative z-[2] shrink-0" />
    </article>
  );
}
