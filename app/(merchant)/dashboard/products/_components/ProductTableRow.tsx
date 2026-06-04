import Link from "next/link";
import { Edit, ImageIcon, Star, Package, ShieldCheck, ShieldX, Layers } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import ProductDeleteButton from "./ProductDeleteButton";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  type: string;
  category: { name: string };
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(price);
}

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="rounded-lg text-xs">
        نفاد المخزون
      </Badge>
    );
  }
  if (stock <= threshold) {
    return (
      <Badge
        variant="outline"
        className="rounded-lg border-orange-200 bg-orange-50 text-xs text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400"
      >
        {stock} قطعة · منخفض
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="rounded-lg border-emerald-200 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
    >
      {stock} قطعة
    </Badge>
  );
}

export default function ProductTableRow({ product }: { product: Product }) {
  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {product.image ? (
              <Image
                width={100}
                height={100}
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-semibold text-foreground">
                {product.name}
              </p>
              {product.isFeatured && (
                <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
              )}
              {product.type === "BUNDLE" && (
                <Layers className="size-3.5 shrink-0 text-violet-500" />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              /{product.slug}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className="gap-1 whitespace-nowrap rounded-lg text-xs"
        >
          <Package className="size-3" />
          {product.category.name}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="space-y-0.5">
          <p className="whitespace-nowrap font-semibold text-foreground">
            {formatPrice(product.price)}
          </p>
          {product.compareAtPrice && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <StockBadge stock={product.stock} threshold={product.lowStockThreshold ?? 5} />
      </TableCell>

      <TableCell>
        {product.isActive ? (
          <Badge className="gap-1 whitespace-nowrap rounded-lg bg-emerald-500 hover:bg-emerald-500/90">
            <ShieldCheck className="size-3.5" />
            نشط
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 whitespace-nowrap rounded-lg"
          >
            <ShieldX className="size-3.5" />
            غير نشط
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg"
          >
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Edit className="size-3.5" />
              تعديل
            </Link>
          </Button>
          <ProductDeleteButton
            productId={product.id}
            productName={product.name}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
