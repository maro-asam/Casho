import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { coffeeLine, needsGrind, readProfile, type CoffeeProfile } from "../lib/coffee";
import { Notes, PlateImage, Price, Rating, RoastMeter, delay, discountPercent, num, num1 } from "../ui";
import QuickAdd from "./QuickAdd";
import { st } from "@/lib/i18n/storefront";

/** "٢٥٠ جم" / "١ كجم". */
export function gramsLabel(g: number) {
  return g >= 1000 ? st("{0} كجم", num1(g / 1000)) : st("{0} جم", num(g));
}

/** The coffee profile of a card (cheap — pure parsing of its own fields). */
export function cardProfile(p: ProductCardData): CoffeeProfile {
  return readProfile({ name: p.name, categoryName: p.categoryName, attributes: p.attributes, sizes: p.sizes, colors: p.colors });
}

/** Corner tags from real data only: sold out, a real saving, or new. */
export function CardTag({ product, className }: { product: Pick<ProductCardData, "stock" | "price" | "compareAtPrice" | "isNew">; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  if (product.stock <= 0)
    return (
      <span className={cn("bn-tag", className)} data-tone="out">
        {st("خلص")}
      </span>
    );
  if (off > 0)
    return (
      <span className={cn("bn-tag", className)} data-tone="sale">
        {st("خصم {0}٪", num(off))}
      </span>
    );
  if (product.isNew)
    return (
      <span className={cn("bn-tag", className)} data-tone="new">
        {st("جديد")}
      </span>
    );
  return null;
}

/** Casho Bunn's bag-label card: the photo on a warm plate, then the label —
 *  origin and process, the name, the tasting notes in their flavor colors,
 *  the price with the bag's weight and the roast meter. Gear and cups get the
 *  same label without the coffee lines. The look follows the Studio "product
 *  card" setting through `[data-card]` on the store root. */
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
  index?: number;
  sizes?: string;
  className?: string;
}) {
  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const profile = cardProfile(product);
  const coffee = profile.isCoffee;
  const kicker = (coffee && coffeeLine(profile)) || product.brand || product.categoryName;
  const beans = needsGrind({ name: product.name, categoryName: product.categoryName, attributes: product.attributes, sizes: product.sizes, colors: product.colors }, true, profile);

  return (
    <article className={cn("bn-card bn-reveal group", className)} style={delay(Math.min(index, 5))} data-soldout={soldOut || undefined} data-coffee={coffee || undefined}>
      <div className="bn-card-media" style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}>
        <PlateImage src={product.image} priority={priority} sizes={sizes} className={cn("bn-card-img", product.hoverImage && "has-swap")} />
        {product.hoverImage && <Image src={product.hoverImage} alt="" fill sizes={sizes} loading="lazy" className="bn-card-img2 object-cover" />}
        <CardTag product={product} className="bn-card-tag" />
        <QuickAdd storeSlug={storeSlug} product={product} beans={beans} className="bn-card-quick" />
      </div>

      <div className="bn-card-body">
        {kicker && <p className="bn-card-kicker">{kicker}</p>}
        <h3 className="bn-card-title">
          <Link href={href} title={product.name} className="bn-cover-link">
            {product.name}
          </Link>
        </h3>
        {coffee && <Notes notes={profile.notes} className="bn-card-notes" />}
        <div className="bn-card-foot">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <Price price={product.price} compareAt={product.compareAtPrice} size="sm" className="bn-card-price" />
            {coffee && profile.grams && <span className="bn-card-weight">/ {gramsLabel(profile.grams)}</span>}
          </div>
          {profile.roast && <RoastMeter level={profile.roast.level} className="bn-card-roast" />}
        </div>
        {!profile.roast && product.rating && <Rating value={product.rating.average} count={product.rating.count} className="bn-card-rating" />}
      </div>
    </article>
  );
}

/** Product grid (2 → 3 → the merchant's columns). */
export function ProductGrid({ products, storeSlug, priorityCount = 0, className }: { products: ProductCardData[]; storeSlug: string; priorityCount?: number; className?: string }) {
  return (
    <ul className={cn("bn-pgrid", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} storeSlug={storeSlug} priority={i < priorityCount} index={i} />
        </li>
      ))}
    </ul>
  );
}
