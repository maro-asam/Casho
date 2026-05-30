"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AddToCartAction } from "@/actions/store/cart.actions";

type StickyMobilePurchaseBarProps = {
  storeSlug: string;
  productId: string;
  price: string;
  inStock: boolean;
};

export default function StickyMobilePurchaseBar({
  storeSlug,
  productId,
  price,
  inStock,
}: StickyMobilePurchaseBarProps) {
  const [cartPending, startCart] = useTransition();
  const [buyPending, startBuy] = useTransition();
  const router = useRouter();
  const isPending = cartPending || buyPending;

  if (!inStock) return null;

  const addToCart = () =>
    startCart(async () => {
      const res = await AddToCartAction(storeSlug, productId);
      if (res?.success) toast.success("تم إضافة المنتج إلى العربة");
      else toast.error("حدث خطأ أثناء الإضافة");
    });

  const buyNow = () =>
    startBuy(async () => {
      const res = await AddToCartAction(storeSlug, productId);
      if (res?.success) {
        router.push(`/store/${storeSlug}/checkout`);
        router.refresh();
      } else {
        toast.error("حدث خطأ أثناء التنفيذ");
      }
    });

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Gradient fade above bar */}
      <div className="pointer-events-none h-8 bg-gradient-to-t from-background/80 to-transparent" />

      <div className="border-t bg-background/95 px-4 pb-4 pt-3 shadow-2xl backdrop-blur-md">
        <div className="mb-2 text-center text-xs font-medium text-muted-foreground">
          {price}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={addToCart}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
            style={{
              borderColor: "var(--store-primary)",
              color: "var(--store-primary)",
            }}
          >
            {cartPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}
            أضف للعربة
          </button>

          <button
            onClick={buyNow}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "var(--store-primary)",
              color: "var(--store-primary-foreground)",
            }}
          >
            {buyPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Zap className="size-4" />
            )}
            اشتري الآن
          </button>
        </div>
      </div>
    </div>
  );
}
