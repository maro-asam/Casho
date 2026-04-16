import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, Eye } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image: string;
    isFeatured?: boolean;
    category?: {
      name: string;
      slug: string;
    } | null;
  };
  storeSlug: string;
};

const ProductCard = ({ product, storeSlug }: ProductCardProps) => {
  const hasDiscount =
    !!product.compareAtPrice && product.compareAtPrice > product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : 0;
  return (
    <Card
      dir="rtl"
      className="group overflow-hidden border border-border/60 bg-background py-0 gap-5"
    >
      <div className="relative">
        <Link
          href={`/store/${storeSlug}/products/${product.slug}`}
          className="block"
        >
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={product.image || "/images/product-placeholder.png"}
              alt={product.name}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:blur-[2px]"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-xl bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-md">
                <Eye className="size-4" />
                عرض المنتج
              </div>

              {hasDiscount && (
                <Badge className="rounded-xl px-3 py-1">
                  خصم {discountPercentage}%
                </Badge>
              )}
            </div>
          </div>
        </Link>

        <button
          type="button"
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-background/95 shadow-sm"
        >
          <Heart className="size-4" />
        </button>

        {/* 🔥 SALE Badge */}
        {hasDiscount && (
          <Badge className="z-100 absolute left-3 top-3 bg-red-500 text-white">
            -{discountPercentage}%
          </Badge>
        )}

        {product.isFeatured && (
          <Badge className="absolute right-3 top-3 z-10 flex items-center gap-1 p-3">
            <Sparkles className="size-3" />
            مميز
          </Badge>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        <Link
          href={`/store/${storeSlug}/products/${product.slug}`}
          className="line-clamp-1 text-base font-semibold text-foreground hover:text-primary"
        >
          {product.name}
        </Link>

        {product.category?.name && (
          <p className="text-xs text-muted-foreground">
            {product.category.name}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </p>

          <AddToCartButton
            size="sm"
            variant="outline"
            storeSlug={storeSlug}
            productId={product.id}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
