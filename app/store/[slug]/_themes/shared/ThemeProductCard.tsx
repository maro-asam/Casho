import Image from "next/image";
import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AddToCartButton from "../../cart/_components/AddToCartButton";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";

import type { StoreThemeData } from "../types";

type ThemeProduct = StoreThemeData["products"][number];

type ThemeProductCardProps = {
  product: ThemeProduct;
  storeSlug: string;
  variant?: "classic" | "modern";
};

export default function ThemeProductCard({
  product,
  storeSlug,
  variant = "classic",
}: ThemeProductCardProps) {
  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : 0;

  const productHref = buildStoreUrl(storeSlug, `/products/${product.slug}`);

  /* ── Modern variant — portrait (3:4), hover overlay ── */
  if (variant === "modern") {
    return (
      <Card className="group overflow-hidden border bg-card p-0 shadow-sm transition duration-300 hover:shadow-xl">
        {/* Portrait image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-(--store-muted)">
          <Link href={productHref} aria-label={product.name}>
            <Image
              src={product.image || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Subtle bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Badges */}
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
            {product.isFeatured && (
              <Badge className="gap-1 rounded-full bg-(--store-primary) px-2.5 py-0.5 text-[10px] text-(--store-primary-foreground)">
                <Sparkles className="size-2.5" />
                مميز
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="rounded-full bg-(--store-secondary) px-2.5 py-0.5 text-[10px] text-(--store-secondary-foreground)">
                {discountPercentage}% خصم
              </Badge>
            )}
          </div>

          {/* Quick view button */}
          <Link
            href={productHref}
            aria-label="عرض المنتج"
            className="absolute left-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition duration-200 group-hover:opacity-100"
          >
            <Eye className="size-3.5" />
          </Link>
        </div>

        {/* Card content */}
        <CardContent className="p-3">
          {product.category?.name && (
            <p className="mb-0.5 truncate text-xs font-medium text-(--store-primary)">
              {product.category.name}
            </p>
          )}

          <Link href={productHref}>
            <h3 className="line-clamp-1 text-sm font-semibold leading-5 transition hover:text-(--store-primary)">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-(--store-primary)">
                {formatPrice(product.price)}
              </p>
              {hasDiscount && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice!)}
                </p>
              )}
            </div>

            <AddToCartButton
              storeSlug={storeSlug}
              productId={product.id}
              size="sm"
              variant="default"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Classic variant (default) ── */
  return (
    <Card className="group overflow-hidden border p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={productHref} aria-label={product.name}>
          <Image
            src={product.image || "/images/product-placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {product.isFeatured && (
            <Badge className="gap-1 rounded-full text-(--store-primary-foreground)">
              <Sparkles className="size-3" />
              مميز
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="secondary" className="rounded-full">
              خصم {discountPercentage}%
            </Badge>
          )}
        </div>

        <Link
          href={productHref}
          aria-label="عرض المنتج"
          className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition group-hover:opacity-100"
        >
          <Eye className="size-4" />
        </Link>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          {product.category?.name && (
            <p className="text-xs font-medium text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <Link href={productHref}>
            <h3 className="line-clamp-2 min-h-11 font-semibold leading-6 transition hover:text-(--store-primary)">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-bold text-(--store-primary)">
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
          <AddToCartButton
            storeSlug={storeSlug}
            productId={product.id}
            size="sm"
            variant="default"
          />
        </div>
      </CardContent>
    </Card>
  );
}
