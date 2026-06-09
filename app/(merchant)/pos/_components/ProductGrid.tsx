"use client";

import Image from "next/image";
import { Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem } from "./PosTerminal";

type Product = Omit<CartItem, "quantity" | "discountAmount">;

type Props = {
  products: Product[];
  loading: boolean;
  onAdd: (item: CartItem) => void;
  cartItems: CartItem[];
};

export default function ProductGrid({ products, loading, onAdd, cartItems }: Props) {
  const cartMap = new Map(cartItems.map((i) => [i.productId, i.quantity]));

  if (loading) {
    return (
      <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-3 content-start xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        لا توجد منتجات
      </div>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-3 content-start xl:grid-cols-4">
      {products.map((product) => {
        const inCart = cartMap.get(product.productId) ?? 0;
        const outOfStock = product.stock === 0;
        const lowStock = !outOfStock && product.stock <= 5;

        return (
          <button
            key={product.productId}
            onClick={() => !outOfStock && onAdd({ ...product, quantity: 1, discountAmount: 0 })}
            disabled={outOfStock}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-right transition-all",
              outOfStock
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-primary hover:shadow-sm active:scale-95",
              inCart > 0 && "border-primary bg-primary/5",
            )}
          >
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              <Image
                src={product.image || "/images/product-placeholder.png"}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="120px"
              />
              {inCart > 0 && (
                <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {inCart}
                </span>
              )}
              {lowStock && (
                <span className="absolute bottom-0 right-0 rounded-tl bg-amber-500 px-1 text-[9px] text-white font-medium">
                  {product.stock} متبقي
                </span>
              )}
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                    نفد
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-1.5 gap-0.5">
              <p className="line-clamp-2 text-[11px] font-medium leading-tight">{product.name}</p>
              {product.sku && (
                <p className="text-[9px] text-muted-foreground">{product.sku}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  {(product.price / 100).toFixed(0)} ج
                </span>
                {!outOfStock && (
                  <Plus className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
