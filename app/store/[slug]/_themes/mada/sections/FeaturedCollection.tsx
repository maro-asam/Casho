import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "../../types";
import { WishlistButton } from "../product/CardActions";
import ProductCard from "../product/ProductCard";
import { Arrow, PlateImage, Price, Rating, SectionHeader, Swatches, Wrap, btn, discountPercent, num } from "../ui";
import QuickViewButton from "./QuickViewButton";

/** Featured products: one spotlight told large, the next four as a grid. */
export default function FeaturedCollection({ products, storeSlug }: { products: ProductCardData[]; storeSlug: string }) {
  const [lead, ...rest] = products;
  const grid = rest.slice(0, 4);
  const href = buildStoreUrl(storeSlug, `/products/${lead.slug}`);
  const discount = discountPercent(lead.price, lead.compareAtPrice);

  return (
    <Wrap className="md-section md-reveal">
      <SectionHeader eyebrow="مختارات" title="اختيارات المتجر" subtitle="منتجات المتجر بيرشحها ليك" href={buildStoreUrl(storeSlug, "/products?featured=true")} />
      <div className={cn("grid grid-cols-1 gap-6 lg:gap-8", grid.length > 0 && "lg:grid-cols-2")}>
        <article className={cn("md-card group relative overflow-hidden rounded-[1.75rem] bg-(--md-surface)", grid.length === 0 && "lg:grid lg:grid-cols-2 lg:items-center")}>
          <div className={cn("relative bg-(--md-studio)", grid.length > 0 ? "aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto lg:h-[calc(100%-9.5rem)] lg:min-h-[24rem]" : "aspect-[4/5] sm:aspect-[4/3]")}>
            <PlateImage src={lead.image} sizes="(max-width: 1024px) 100vw, 50vw" className={cn("md-card-img-1", lead.hoverImage && "has-swap")} />
            {lead.hoverImage && <Image src={lead.hoverImage} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="md-card-img-2 object-cover" />}
            <div className="absolute start-4 top-4 flex gap-1.5">
              <span className="md-badge md-badge--new">الأبرز</span>
              {discount > 0 && <span className="md-badge md-badge--sale">−{num(discount)}٪</span>}
            </div>
            <WishlistButton storeSlug={storeSlug} product={lead} className="absolute end-4 top-4" />
          </div>
          <div className={cn("flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6", grid.length === 0 && "lg:flex-col lg:items-start lg:p-12")}>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm text-(--md-quiet)">{lead.brand || lead.categoryName}</p>
                <Swatches colors={lead.colors} />
              </div>
              <h3 className="md-h3 mt-1">
                <Link href={href} className="after:absolute after:inset-0 after:content-['']">
                  {lead.name}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Price price={lead.price} compareAt={lead.compareAtPrice} size="lg" />
                {lead.rating && lead.rating.count > 0 && <Rating value={lead.rating.average} count={lead.rating.count} />}
              </div>
            </div>
            <div className="relative z-[2] flex gap-2">
              <QuickViewButton slug={lead.slug} />
              <Link href={href} className={btn({ size: "md" })}>
                التفاصيل
                <Arrow />
              </Link>
            </div>
          </div>
        </article>

        {grid.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5">
            {grid.map((p) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={storeSlug} variant="compact" sizes="(max-width: 1024px) 46vw, 23vw" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Wrap>
  );
}
