"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { qrToast } from "../toast";
import { st } from "@/lib/i18n/storefront";

type Product = { id: string; name: string; slug: string; stock: number; hasOptions: boolean };

/** The card's one action. A plain piece goes straight into the bag; one with
 *  sizes or metals opens its quick view so the shopper picks first. On a
 *  mouse it rises over the photo as a bar; on touch it's a small round button. */
export default function QuickAdd({ storeSlug, product, className }: { storeSlug: string; product: Product; className?: string }) {
  const { add, pending } = useAddToCart(storeSlug);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (product.stock <= 0) return null;

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasOptions) return openQuickView(product.slug);
    const res = await add(product.id, undefined, 1);
    if (!res.ok) return qrToast.error(res.message);
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
    qrToast.success(st("اتضافت للحقيبة: {0}", product.name), { action: { label: st("الحقيبة"), onClick: openCart } });
  };

  const label = product.hasOptions ? st("اختار المقاس") : st("أضف للحقيبة");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={product.hasOptions ? st("اختار المقاس أو المعدن لـ {0}", product.name) : st("أضف {0} للحقيبة", product.name)}
      className={cn("qr-quick", className)}
      data-done={done}
    >
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : done ? <Check aria-hidden /> : <Plus aria-hidden />}
      <span className="qr-quick-label">{done ? st("اتضافت") : label}</span>
    </button>
  );
}
