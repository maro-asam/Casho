"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Loader2, Plus, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { gyToast } from "../toast";
import { btn } from "../ui";

type CardProduct = { id: string; name: string; slug: string; hasOptions: boolean; stock: number };

/** Adds one piece (or opens the quick view when a size/color must be chosen
 *  first). Shoppers often add several items in a row, so a card add shows a
 *  toast with "view cart" instead of throwing the cart drawer open. */
function useQuickAdd(storeSlug: string, product: CardProduct) {
  const { add, pending } = useAddToCart(storeSlug);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);

  const run = async () => {
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id);
    if (!res.ok) return gyToast.error(res.message);
    setDone(true);
    gyToast.success("اتضاف للسلة", { description: product.name, action: { label: "عرض السلة", onClick: openCart } });
  };

  return { run, pending, done };
}

/** Full-width add button under the card copy. */
export function CardAddButton({ storeSlug, product, className, size = "sm" }: { storeSlug: string; product: CardProduct; className?: string; size?: "sm" | "md" }) {
  const { run, pending, done } = useQuickAdd(storeSlug, product);
  if (product.stock <= 0) {
    return (
      <button type="button" disabled className={btn({ variant: "soft", size, full: true, className })}>
        غير متوفر
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      aria-label={product.hasOptions ? `اختار الخيارات لـ ${product.name}` : `أضف ${product.name} للسلة`}
      className={btn({ variant: done ? "tint" : "solid", size, full: true, className: cn("relative z-[2]", className) })}
    >
      {pending ? <Loader2 className="animate-spin" /> : done ? <Check /> : product.hasOptions ? <Plus /> : <ShoppingBag />}
      {done ? "اتضاف" : product.hasOptions ? "اختار" : "أضف للسلة"}
    </button>
  );
}

/** Small add button on the image (minimal cards and mini cards). */
export function CardAddFab({ storeSlug, product, className }: { storeSlug: string; product: CardProduct; className?: string }) {
  const { run, pending, done } = useQuickAdd(storeSlug, product);
  if (product.stock <= 0) return null;
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      aria-label={product.hasOptions ? `اختار الخيارات لـ ${product.name}` : `أضف ${product.name} للسلة`}
      title={product.hasOptions ? "اختار الخيارات" : "أضف للسلة"}
      className={cn("gy-add-fab relative z-[2]", className)}
    >
      {pending ? <Loader2 className="animate-spin" /> : done ? <Check /> : <Plus />}
    </button>
  );
}

/** "Quick look" button that appears over the image on hover. */
export function QuickLook({ slug, name, className }: { slug: string; name: string; className?: string }) {
  return (
    <button type="button" onClick={() => openQuickView(slug)} aria-label={`نظرة سريعة على ${name}`} title="نظرة سريعة" className={cn("gy-fab relative z-[2] size-9", className)}>
      <Eye />
    </button>
  );
}
