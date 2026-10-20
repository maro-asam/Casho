"use client";

import Image from "next/image";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem } from "./PosTerminal";
import { egp } from "./pos-format";
import { tr } from "@/lib/i18n/dashboard";

type Product = Omit<CartItem, "quantity" | "discountAmount">;

type Props = {
  products: Product[];
  loading: boolean;
  onAdd: (item: CartItem) => void;
  cartItems: CartItem[];
  /** Shown in the empty state so the cashier knows why nothing matched. */
  query: string;
};

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] content-start gap-3 px-1 pb-3";

export default function ProductGrid({ products, loading, onAdd, cartItems, query }: Props) {
  const inCart = new Map(cartItems.map((i) => [i.productId, i.quantity]));

  if (loading && products.length === 0) {
    return (
      <div className={cn(GRID, "flex-1 overflow-y-auto")} aria-busy="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[18px] bg-card p-2">
            <div className="aspect-square animate-pulse rounded-[12px] bg-(--fill-3)" />
            <div className="space-y-2 px-1 pt-2.5 pb-1">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-(--fill-3)" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-(--fill-3)" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <PackageSearch className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
        <p className="text-[20px] leading-[25px] font-semibold">{query ? tr("مفيش منتجات بـ \"{0}\"", query) : tr("مفيش منتجات في التصنيف ده")}</p>
        <p className="text-[15px] text-muted-foreground">{tr("جرّب اسم تاني، أو امسح الباركود مباشرة.")}</p>
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
            aria-label={tr("{0}، {1}{2}", product.name, egp(product.price), qty ? tr("، في الفاتورة {0}", qty) : "")}
            className={cn(
              "group relative flex flex-col rounded-[18px] bg-card p-2 text-start transition-[transform,box-shadow] duration-200 ease-(--ease-apple)",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              soldOut || maxed ? "cursor-not-allowed opacity-50" : "hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] active:scale-[0.97]",
              qty > 0 && "ring-2 ring-primary",
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-(--fill-3)">
              <Image src={product.image || "/images/product-placeholder.png"} alt="" fill sizes="180px" className="object-cover" />
              {qty > 0 && (
                <span className="absolute inset-e-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[13px] font-bold text-primary-foreground tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
                  {qty}
                </span>
              )}
              {soldOut && (
                <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-black/65 py-0.5 text-center text-[12px] font-medium text-white backdrop-blur">
                  {tr("نفد المخزون")}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-0.5 px-1 pt-2 pb-0.5">
              <p className="line-clamp-2 text-[13px] leading-[17px] font-medium">{product.name}</p>
              <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                <span className="text-[15px] font-semibold tabular-nums">{egp(product.price)}</span>
                {!soldOut && (
                  <span className={cn("text-[11px] tabular-nums", low ? "font-semibold text-(--sys-orange)" : "text-muted-foreground")}>
                    {maxed ? tr("كل الكمية") : tr("{0} متاح", product.stock)}
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
