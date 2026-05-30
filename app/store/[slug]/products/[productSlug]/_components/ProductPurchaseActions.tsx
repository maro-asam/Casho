"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Loader2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddToCartAction } from "@/actions/store/cart.actions";
import { cn } from "@/lib/utils";

type ProductPurchaseActionsProps = {
  storeSlug: string;
  productId: string;
  inStock: boolean;
  stock: number;
  className?: string;
  boldStyle?: boolean;
  selectedFeatures?: Record<string, string>;
  requiresFeatureSelection?: boolean;
};

export default function ProductPurchaseActions({
  storeSlug,
  productId,
  inStock,
  stock,
  className,
  boldStyle,
  selectedFeatures,
  requiresFeatureSelection,
}: ProductPurchaseActionsProps) {
  const [qty, setQty] = useState(1);
  const [cartPending, startCartTransition] = useTransition();
  const [buyPending, startBuyTransition] = useTransition();
  const router = useRouter();

  const maxQty = Math.min(stock, 10);
  const isPending = cartPending || buyPending;

  if (!inStock) {
    return (
      <Button
        size="lg"
        disabled
        className={cn("w-full font-semibold", boldStyle ? "rounded-none" : "rounded-2xl")}
      >
        نفد المخزون
      </Button>
    );
  }

  const handleAddToCart = () => {
    if (requiresFeatureSelection) {
      toast.error("يرجى اختيار جميع الخيارات المطلوبة أولاً");
      return;
    }
    startCartTransition(async () => {
      try {
        let allOk = true;
        for (let i = 0; i < qty; i++) {
          const res = await AddToCartAction(storeSlug, productId, selectedFeatures);
          if (!res?.success) {
            allOk = false;
            break;
          }
        }
        if (allOk) {
          toast.success(qty > 1 ? `تم إضافة ${qty} قطع إلى العربة` : "تم إضافة المنتج إلى العربة");
        } else {
          toast.error("حدث خطأ أثناء الإضافة");
        }
      } catch {
        toast.error("حدث خطأ أثناء الإضافة");
      }
    });
  };

  const handleBuyNow = () => {
    if (requiresFeatureSelection) {
      toast.error("يرجى اختيار جميع الخيارات المطلوبة أولاً");
      return;
    }
    startBuyTransition(async () => {
      try {
        const res = await AddToCartAction(storeSlug, productId, selectedFeatures);
        if (res?.success) {
          router.push(`/store/${storeSlug}/checkout`);
          router.refresh();
        } else {
          toast.error("حدث خطأ أثناء التنفيذ");
        }
      } catch {
        toast.error("حدث خطأ أثناء التنفيذ");
      }
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">الكمية</span>
        <div
          className={cn(
            "flex items-center overflow-hidden border",
            boldStyle ? "rounded-none border-current" : "rounded-xl border-border",
          )}
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || isPending}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-[2.5rem] select-none py-2 text-center text-sm font-bold">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty || isPending}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        {stock <= 5 && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {stock} قطع فقط
          </span>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={isPending}
          className={cn(
            "flex-1 gap-2 font-semibold transition-all",
            boldStyle
              ? "rounded-none border-2 border-black bg-black text-white hover:bg-transparent hover:text-black uppercase tracking-widest font-bold dark:border-white dark:bg-white dark:text-black dark:hover:bg-transparent dark:hover:text-white"
              : "rounded-2xl",
          )}
          style={
            !boldStyle
              ? {
                  background: "var(--store-primary)",
                  color: "var(--store-primary-foreground)",
                }
              : undefined
          }
        >
          {cartPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          {cartPending ? "جاري الإضافة..." : "أضف للعربة"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleBuyNow}
          disabled={isPending}
          className={cn(
            "flex-1 gap-2 font-semibold transition-all",
            boldStyle
              ? "rounded-none border-2 uppercase tracking-widest font-bold"
              : "rounded-2xl",
          )}
        >
          {buyPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4" />
          )}
          {buyPending ? "جاري التنفيذ..." : "اشتري الآن"}
        </Button>
      </div>
    </div>
  );
}
