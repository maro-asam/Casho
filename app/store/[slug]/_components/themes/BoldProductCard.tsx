import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/utils";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import AddToCartButton from "../../cart/_components/AddToCartButton";

type BoldProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
    isFeatured?: boolean;
    category?: { name: string; slug: string } | null;
  };
  storeSlug: string;
};

export default function BoldProductCard({ product, storeSlug }: BoldProductCardProps) {
  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);

  return (
    <div className="group flex flex-col" dir="rtl">
      {/* Image — aspect ratio from merchant layout setting */}
      <Link href={href} className="relative block overflow-hidden" style={{ aspectRatio: "var(--store-img-ratio, 4 / 5)" }}>
        <Image
          src={product.image || "/images/product-placeholder.png"}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          style={{ transitionDuration: "var(--store-motion, 250ms)" }}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Dark hover overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />

        {/* Top badges */}
        <div className="absolute start-0 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="bg-black px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
              -{discountPct}%
            </span>
          )}
          {product.isFeatured && !hasDiscount && (
            <span
              className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ background: "var(--store-primary)", color: "var(--store-primary-foreground)" }}
            >
              مميز
            </span>
          )}
        </div>

        {/* Quick add — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <AddToCartButton
            size="sm"
            storeSlug={storeSlug}
            productId={product.id}
            className="w-full border-0 bg-black/90 text-xs font-semibold uppercase tracking-widest text-white hover:bg-black"
            style={{ borderRadius: "var(--store-btn-radius, 0px)" }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <Link
          href={href}
          className="line-clamp-1 text-sm font-medium text-foreground transition-colors hover:text-[--store-primary]"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--store-primary)" }}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
