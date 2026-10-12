"use client";

import { Eye, Loader2, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { ceToast } from "../toast";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

/** Underlined "Quick look" text link (an eye icon on phones). */
export function QuickLook({ slug, name }: { slug: string; name: string }) {
  return (
    <button
      type="button"
      onClick={() => openQuickView(slug)}
      aria-label={`نظرة سريعة على ${name}`}
      className="-m-1.5 inline-flex min-h-8 shrink-0 items-center p-1.5 text-[0.8125rem] text-(--ce-ink) underline underline-offset-[3px] hover:text-(--ce-btn) max-sm:no-underline"
    >
      <span className="max-sm:hidden">نظرة سريعة</span>
      <Eye aria-hidden className="size-[1.125rem] sm:hidden" />
    </button>
  );
}

/** Square navy cart button on the card image. Products with sizes/colors
 *  open the quick view so the shopper picks them first. */
export function CardCartButton({ storeSlug, product, className }: { storeSlug: string; product: CardProduct; className?: string }) {
  const { add, pending } = useAddToCart(storeSlug);
  if (product.stock <= 0) return <span aria-hidden className={cn("block h-6 sm:h-7", className)} />;
  const label = product.hasOptions ? `اختار المقاس أو اللون لـ ${product.name}` : `أضف ${product.name} للسلة`;

  const quickAdd = async () => {
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id);
    if (res.ok) openCart();
    else ceToast.error(res.message);
  };

  return (
    <button type="button" onClick={quickAdd} disabled={pending} aria-label={label} title={product.hasOptions ? "اختار الخيارات" : "أضف للسلة"} className={cn("ce-cart-btn", className)}>
      {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
    </button>
  );
}
