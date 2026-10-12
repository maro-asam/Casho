"use client";

import { Eye, Loader2, ShoppingCart } from "lucide-react";

import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { mxToast } from "../toast";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

/** Hover actions on a product image (pointer devices): a quick-view button on
 *  the side and a full-width "add to cart" bar rising from the bottom. Touch
 *  devices get one round cart button. Products with sizes/colors open the
 *  quick view so the shopper picks them first. */
export default function CardActions({ storeSlug, product }: { storeSlug: string; product: CardProduct }) {
  const { add, pending } = useAddToCart(storeSlug);
  const soldOut = product.stock <= 0;
  const addLabel = product.hasOptions ? `اختار المقاس أو اللون لـ ${product.name}` : `أضف ${product.name} للسلة`;

  const quickAdd = async () => {
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id);
    if (res.ok) openCart();
    else mxToast.error(res.message);
  };

  return (
    <>
      <div className="mx-card-side mx-pointer-only absolute end-2.5 top-2.5 z-[2] flex-col gap-2">
        <button type="button" onClick={() => openQuickView(product.slug)} aria-label={`نظرة سريعة على ${product.name}`} title="نظرة سريعة" className="mx-fab">
          <Eye />
        </button>
      </div>
      {!soldOut && (
        <div className="mx-card-quick mx-pointer-only absolute inset-x-2.5 bottom-2.5 z-[2]">
          <button type="button" onClick={quickAdd} disabled={pending} aria-label={addLabel} className="mx-btn mx-btn--solid mx-btn--sm mx-btn--full shadow-(--mx-shadow-sm)">
            {pending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
            {product.hasOptions ? "اختار الخيارات" : "أضف للسلة"}
          </button>
        </div>
      )}
      {!soldOut && (
        <button type="button" onClick={quickAdd} disabled={pending} aria-label={addLabel} className="mx-fab mx-touch-only absolute bottom-2 end-2 z-[2] size-9">
          {pending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
        </button>
      )}
    </>
  );
}
