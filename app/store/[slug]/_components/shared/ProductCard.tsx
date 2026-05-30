import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "../../cart/_components/AddToCartButton";
import { formatPrice } from "@/lib/utils";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

type ProductCardProps = {
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

export default function ProductCard({ product, storeSlug }: ProductCardProps) {
  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : 0;

  const href = buildStoreUrl(storeSlug, `/products/${product.slug}`);

  return (
    <div className="group flex flex-col" dir="rtl">
      {/* Image */}
      <Link
        href={href}
        className="block overflow-hidden rounded-2xl bg-[--store-card] relative"
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }}
        >
          <Image
            src={product.image || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            style={{ transitionDuration: "var(--store-motion, 250ms)" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute start-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            -{discountPct}%
          </span>
        )}

        {/* Featured badge */}
        {product.isFeatured && !hasDiscount && (
          <span
            className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow"
            style={{
              background: "var(--store-primary)",
              color: "var(--store-primary-foreground)",
            }}
          >
            مميز
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="mt-3 flex flex-1 flex-col gap-2">
        <Link
          href={href}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-[--store-primary] transition-colors"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span
              className="text-base font-bold"
              style={{ color: "var(--store-primary)" }}
            >
              {formatPrice(product.price)}
            </span>
            {hasDiscount && product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <AddToCartButton
            size="sm"
            variant="outline"
            storeSlug={storeSlug}
            productId={product.id}
            style={{ borderRadius: "var(--store-btn-radius, 0.5rem)" }}
          />
        </div>
      </div>
    </div>
  );
}
