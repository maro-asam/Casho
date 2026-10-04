import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price } from "../ui";

/** Row card for drawers, search results and lists: thumb + name + price,
 *  with an optional trailing slot (add / remove buttons). */
export default function HorizontalCard({
  product,
  storeSlug,
  trailing,
  onNavigate,
  className,
}: {
  product: Pick<ProductCardData, "slug" | "name" | "image" | "price" | "compareAtPrice" | "categoryName" | "brand">;
  storeSlug: string;
  trailing?: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center gap-3.5", className)}>
      <span className="md-media aspect-[4/5] w-[4.5rem] shrink-0 rounded-(--md-radius-sm)">
        <PlateImage src={product.image} sizes="72px" />
      </span>
      <div className="min-w-0 flex-1">
        {(product.brand || product.categoryName) && (
          <p className="truncate text-xs text-(--md-quiet)">{product.brand || product.categoryName}</p>
        )}
        <Link
          href={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
          onClick={onNavigate}
          className="line-clamp-2 text-sm font-medium leading-6 after:absolute after:inset-0 after:content-[''] hover:text-(--md-brand)"
        >
          {product.name}
        </Link>
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className="mt-1" />
      </div>
      {trailing && <div className="relative z-[1] shrink-0">{trailing}</div>}
    </div>
  );
}
