import Image from "next/image";
import Link from "next/link";
import { Eye, Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AddToCartButton from "../../cart/_components/AddToCartButton";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";

import type { StoreThemeData } from "../types";

type ThemeProduct = StoreThemeData["products"][number];

type ThemeProductCardProps = {
  product: ThemeProduct;
  storeSlug: string;
  variant?: "classic" | "boutique" | "bold" | "magazine";
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

  if (variant === "bold") {
    return (
      <Card className="group overflow-hidden rounded-none border-0 bg-card p-0 text-card-foreground shadow-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <Link href={productHref} aria-label={product.name}>
            <Image
              src={product.image || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </Link>

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="flex flex-col gap-2">
              {product.isFeatured && (
                <Badge className="w-fit rounded-none bg-[var(--store-primary)] px-3 py-1 text-[var(--store-primary-foreground)] shadow-none">
                  <Sparkles className="me-1 size-3" />
                  مميز
                </Badge>
              )}

              {hasDiscount && (
                <Badge className="w-fit rounded-none bg-[var(--store-secondary)] px-3 py-1 text-[var(--store-secondary-foreground)] shadow-none">
                  خصم {discountPercentage}%
                </Badge>
              )}
            </div>

            <Link
              href={productHref}
              className="flex size-10 items-center justify-center border bg-background/90 text-foreground opacity-0 backdrop-blur transition group-hover:opacity-100"
              aria-label="عرض المنتج"
            >
              <Eye className="size-4" />
            </Link>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-white">
            {product.category?.name && (
              <p className="mb-1 line-clamp-1 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                {product.category.name}
              </p>
            )}

            <Link href={productHref}>
              <h3 className="line-clamp-2 text-xl font-bold leading-tight transition hover:text-[var(--store-secondary)]">
                {product.name}
              </h3>
            </Link>
          </div>
        </div>

        <CardContent className="grid gap-px bg-border p-0">
          <div className="grid grid-cols-[1fr_auto] bg-card">
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                السعر
              </p>

              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-bold text-[var(--store-primary)]">
                  {formatPrice(product.price)}
                </p>

                {hasDiscount && (
                  <p className="text-sm font-bold text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={productHref}
              className="flex min-w-14 items-center justify-center border-s bg-muted transition hover:bg-[var(--store-primary)] hover:text-[var(--store-primary-foreground)]"
              aria-label="عرض المنتج"
            >
              <Plus className="size-5" />
            </Link>
          </div>

          <div className="bg-card p-3">
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

  if (variant === "magazine") {
    return (
      <Card className="group overflow-hidden rounded-none border-0 bg-card p-0 shadow-none">
        <div className="grid min-h-full md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted md:aspect-auto">
            <Link href={productHref} aria-label={product.name}>
              <Image
                src={product.image || "/images/product-placeholder.png"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </Link>

            <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent opacity-80" />

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              {product.isFeatured && (
                <Badge className="w-fit rounded-none bg-white px-3 py-1 text-black shadow-none">
                  <Sparkles className="me-1 size-3" />
                  مميز
                </Badge>
              )}

              {hasDiscount && (
                <Badge className="w-fit rounded-none bg-[var(--store-primary)] px-3 py-1 text-[var(--store-primary-foreground)] shadow-none">
                  خصم {discountPercentage}%
                </Badge>
              )}
            </div>

            <Link
              href={productHref}
              className="absolute left-3 top-3 flex size-10 items-center justify-center border border-white/30 bg-black/25 text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100"
              aria-label="عرض المنتج"
            >
              <Eye className="size-4" />
            </Link>
          </div>

          <CardContent className="flex flex-col justify-between border-s p-5">
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
                  Product Story
                </p>

                <span className="h-px flex-1 bg-border" />
              </div>

              {product.category?.name && (
                <p className="mb-3 line-clamp-1 text-xs font-bold uppercase tracking-[0.25em] text-[var(--store-primary)]">
                  {product.category.name}
                </p>
              )}

              <Link href={productHref}>
                <h3 className="line-clamp-3 text-2xl font-bold uppercase leading-[0.95] tracking-[-0.04em] transition hover:text-[var(--store-primary)]">
                  {product.name}
                </h3>
              </Link>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                  السعر
                </p>

                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <p className="text-2xl font-bold text-[var(--store-primary)]">
                    {formatPrice(product.price)}
                  </p>

                  {hasDiscount && (
                    <p className="text-sm font-bold text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <AddToCartButton
                  storeSlug={storeSlug}
                  productId={product.id}
                  size="sm"
                  variant="default"
                />

                <Link
                  href={productHref}
                  className="flex size-9 items-center justify-center border bg-background transition hover:bg-[var(--store-primary)] hover:text-[var(--store-primary-foreground)]"
                  aria-label="عرض المنتج"
                >
                  <Plus className="size-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden border p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        variant === "classic" && "",
        variant === "boutique" && "",
      )}
    >
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
          className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition group-hover:opacity-100"
          aria-label="عرض المنتج"
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
