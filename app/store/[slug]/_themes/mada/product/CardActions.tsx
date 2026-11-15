"use client";

import { Eye, Heart, Loader2, Plus, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { useLocalList, wishlistKey } from "../lib/local-list";
import { mdToast } from "../toast";
import { st } from "@/lib/i18n/storefront";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

export function WishlistButton({ storeSlug, product, className }: { storeSlug: string; product: { id: string; name: string }; className?: string }) {
  const { list, toggle } = useLocalList(wishlistKey(storeSlug));
  const saved = list.includes(product.id);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(product.id);
        mdToast.success(saved ? st("اتشال من المفضلة") : st("اتحفظ في المفضلة"), { description: product.name });
      }}
      aria-pressed={saved}
      aria-label={saved ? st("إزالة {0} من المفضلة", product.name) : st("حفظ {0} في المفضلة", product.name)}
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
          {st("نظرة سريعة")}
        </button>
        {!soldOut && (
          <button
            type="button"
            onClick={quickAdd}
            disabled={pending}
            aria-label={product.hasOptions ? st("اختار المقاس أو اللون لـ {0}", product.name) : st("أضف {0} للسلة", product.name)}
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
          aria-label={product.hasOptions ? st("اختار المقاس أو اللون لـ {0}", product.name) : st("أضف {0} للسلة", product.name)}
          className="md-fab md-touch-only absolute bottom-2.5 end-2.5 z-[2]"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
        </button>
      )}
    </>
  );
}
