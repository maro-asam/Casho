"use client";

import { Loader2, Plus } from "lucide-react";

import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { dnToast } from "../toast";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

/** Quick view + quick add over a product image. Pointer devices get a pill
 *  that rises on hover; touch devices get a small round add button. Products
 *  with sizes/colors open the quick view to choose before adding. */
export default function CardActions({ storeSlug, product }: { storeSlug: string; product: CardProduct }) {
  const { add, pending } = useAddToCart(storeSlug);
  const soldOut = product.stock <= 0;
  const addLabel = product.hasOptions ? `اختار المقاس أو اللون لـ ${product.name}` : `أضف ${product.name} للسلة`;

  const quickAdd = async () => {
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id);
    if (res.ok) openCart();
    else dnToast.error(res.message);
  };

  return (
    <>
      <div className="dn-card-quick dn-pointer-only absolute inset-x-3 bottom-3 z-[2] justify-center gap-2">
        <button type="button" onClick={() => openQuickView(product.slug)} className="dn-btn dn-btn--light dn-btn--sm shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
          نظرة سريعة
        </button>
        {!soldOut && (
          <button type="button" onClick={quickAdd} disabled={pending} aria-label={addLabel} className="dn-btn dn-btn--solid dn-btn--sm dn-btn--icon">
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          </button>
        )}
      </div>
      {!soldOut && (
        <button type="button" onClick={quickAdd} disabled={pending} aria-label={addLabel} className="dn-fab dn-touch-only absolute bottom-2 end-2 z-[2] size-9">
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
        </button>
      )}
    </>
  );
}
