"use client";

import { Eye, Heart, Loader2, Plus, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { useLocalList, wishlistKey } from "../lib/local-list";
import { mdToast } from "../toast";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

export function WishlistButton({ storeSlug, product, className }: { storeSlug: string; product: { id: string; name: string }; className?: string }) {
  const { list, toggle } = useLocalList(wishlistKey(storeSlug));
  const saved = list.includes(product.id);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(product.id);
        mdToast.success(saved ? "اتشال من المفضلة" : "اتحفظ في المفضلة", { description: product.name });
      }}
      aria-pressed={saved}
      aria-label={saved ? `إزالة ${product.name} من المفضلة` : `حفظ ${product.name} في المفضلة`}
      className={cn("md-fab relative z-[2]", className)}
    >
      <Heart />
    </button>
  );
}

/** Hover actions (pointer devices) + a single add button on touch. */
export default function CardActions({ storeSlug, product }: { storeSlug: string; product: CardProduct }) {
  const { add, pending } = useAddToCart(storeSlug);
  const soldOut = product.stock <= 0;

  const quickAdd = async () => {
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id);
    if (res.ok) openCart();
    else mdToast.error(res.message);
  };

  return (
    <>
      <div className="md-card-actions md-pointer-only absolute inset-x-3 bottom-3 z-[2] gap-2">
        <button type="button" onClick={() => openQuickView(product.slug)} className="md-btn md-btn--light md-btn--sm flex-1 shadow-sm">
          <Eye />
          نظرة سريعة
        </button>
        {!soldOut && (
          <button
            type="button"
            onClick={quickAdd}
            disabled={pending}
            aria-label={product.hasOptions ? `اختار المقاس أو اللون لـ ${product.name}` : `أضف ${product.name} للسلة`}
            className="md-btn md-btn--brand md-btn--sm md-btn--icon shadow-sm"
          >
            {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          </button>
        )}
      </div>
      {!soldOut && (
        <button
          type="button"
          onClick={quickAdd}
          disabled={pending}
          aria-label={product.hasOptions ? `اختار المقاس أو اللون لـ ${product.name}` : `أضف ${product.name} للسلة`}
          className="md-fab md-touch-only absolute bottom-2.5 end-2.5 z-[2]"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
        </button>
      )}
    </>
  );
}
