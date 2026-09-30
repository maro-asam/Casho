"use client";

import Image from "next/image";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem } from "./PosTerminal";
import { egp } from "./pos-format";

type Product = Omit<CartItem, "quantity" | "discountAmount">;

type Props = {
  products: Product[];
  loading: boolean;
  onAdd: (item: CartItem) => void;
  cartItems: CartItem[];
  /** Shown in the empty state so the cashier knows why nothing matched. */
  query: string;
};

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] content-start gap-3 p-4";

export default function ProductGrid({ products, loading, onAdd, cartItems, query }: Props) {
  const inCart = new Map(cartItems.map((i) => [i.productId, i.quantity]));

  if (loading && products.length === 0) {
    return (
      <div className={cn(GRID, "flex-1 overflow-y-auto")} aria-busy="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-4/3 animate-pulse bg-muted" />
            <div className="space-y-2 p-2.5">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
          <PackageSearch className="size-5" />
        </span>
        <p className="text-sm font-medium">{query ? `مفيش منتجات بـ "${query}"` : "مفيش منتجات في التصنيف ده"}</p>
        <p className="text-xs text-muted-foreground">جرّب اسم تاني، أو امسح الباركود مباشرة.</p>
      </div>
    );
  }

  return (
    <div className={cn(GRID, "flex-1 overflow-y-auto", loading && "opacity-60 transition-opacity")}>
      {products.map((product) => {
        const qty = inCart.get(product.productId) ?? 0;
        const soldOut = product.stock <= 0;
        const maxed = !soldOut && qty >= product.stock;
        const low = !soldOut && product.stock <= (product.lowStockThreshold ?? 5);

        return (
          <button
            key={product.productId}
            type="button"
            onClick={() => onAdd({ ...product, quantity: 1, discountAmount: 0 })}
            disabled={soldOut || maxed}
            aria-label={`${product.name}، ${egp(product.price)}${qty ? `، في الفاتورة ${qty}` : ""}`}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-start transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              soldOut || maxed
                ? "cursor-not-allowed opacity-55"
                : "hover:border-primary/60 hover:shadow-sm active:scale-[0.98]",
              qty > 0 ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
              <Image
                src={product.image || "/images/product-placeholder.png"}
                alt=""
                fill
                sizes="180px"
                className="object-cover"
              />
              {qty > 0 && (
                <span className="absolute inset-e-2 top-2 grid min-w-6 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground shadow">
                  {qty}
                </span>
              )}
              {soldOut && (
                <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-medium text-white">
                  نفد المخزون
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-2.5">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug">{product.name}</p>
              <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                <span className="text-sm font-bold tabular-nums">{egp(product.price)}</span>
                {!soldOut && (
                  <span className={cn("text-[11px] tabular-nums", low ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    {maxed ? "كل الكمية" : `${product.stock} متاح`}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
