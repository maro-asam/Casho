import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { PlateImage, Price, Swatches, delay, discountPercent, num } from "../ui";
import CardActions from "./CardActions";

function Tags({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0) return <span className="dn-tag dn-tag--ink">نفدت الكمية</span>;
  return (
    <>
      {discount > 0 && <span className="dn-tag dn-tag--sale">خصم {num(discount)}٪</span>}
      {product.isNew && <span className="dn-tag">جديد</span>}
    </>
  );
}

/** Editorial product tile: square-cornered image with a second-image
 *  crossfade, corner tags and hover actions; centered details below. */
export default function ProductCard({
  product,
  storeSlug,
  priority,
  index = 0,
  sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw",
  align = "center",
}: {
  product: ProductCardData;
  storeSlug: string;
  priority?: boolean;
  /** Position in its grid — staggers the reveal. */
  index?: number;
  sizes?: string;
  align?: "center" | "start";
}) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 3;

  return (
    <article className="dn-card dn-fade group relative flex h-full flex-col" style={delay(index)}>
      <div className="dn-media" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage
          src={product.image}
          priority={priority}
          sizes={sizes}
          className={cn("dn-card-img-1", product.hoverImage && "has-swap", soldOut && "opacity-55 grayscale")}
        />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="dn-card-img-2 object-cover" />}
        <div className="pointer-events-none absolute start-0 top-0 z-[2] flex flex-col items-start">
          <Tags product={product} />
        </div>
        <CardActions storeSlug={storeSlug} product={product} />
      </div>

      <div className={cn("flex flex-1 flex-col pt-3.5", align === "center" ? "items-center text-center" : "items-start text-start")}>
        <h3 className="line-clamp-2 text-[0.9375rem] leading-6">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none focus-visible:after:outline-1 focus-visible:after:outline-offset-4 focus-visible:after:outline-(--dn-ink)"
          >
            {product.name}
          </Link>
        </h3>
        {(product.brand || product.categoryName) && <p className="mt-0.5 truncate text-[0.8125rem] text-(--dn-quiet)">{product.brand || product.categoryName}</p>}
        <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className={cn("mt-1.5", align === "center" && "justify-center")} />
        {low && <p className="mt-1 text-xs text-(--dn-warn)">فاضل {num(product.stock)} بس</p>}
        {product.colors.length > 0 && <Swatches colors={product.colors} className="mt-2.5" />}
      </div>
    </article>
  );
}

/** Responsive product grid: 2 → 3 → merchant columns (or a fixed count).
 *  Phones can switch to a swipeable rail (`railOnMobile`). */
export function ProductGrid({
  products,
  storeSlug,
  priorityCount = 0,
  cols,
  railOnMobile,
  className,
  children,
}: {
  products: ProductCardData[];
  storeSlug: string;
  priorityCount?: number;
  cols?: 3 | 4 | 5;
  railOnMobile?: boolean;
  className?: string;
  /** Extra tiles appended to the grid (e.g. a promo). */
  children?: React.ReactNode;
}) {
  return (
    <ul
      data-reveal
      className={cn(
        railOnMobile
          ? "dn-rail dn-bleed gap-(--dn-gap) md:mx-0 md:grid md:grid-cols-3 md:gap-y-12 md:overflow-visible md:px-0"
          : "grid grid-cols-2 gap-x-(--dn-gap) gap-y-9 md:grid-cols-3 md:gap-y-12",
        !cols && "xl:grid-cols-[repeat(var(--store-grid-cols,4),minmax(0,1fr))]",
        cols === 3 && "xl:grid-cols-3",
        cols === 4 && "xl:grid-cols-4",
        cols === 5 && "xl:grid-cols-5",
        className,
      )}
    >
      {products.map((p, i) => (
        <li key={p.id} className={cn("min-w-0", railOnMobile && "w-[68%] shrink-0 sm:w-[42%] md:w-auto")}>
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
      {children}
    </ul>
  );
}
