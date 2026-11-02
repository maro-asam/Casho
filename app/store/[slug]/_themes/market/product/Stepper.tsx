"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartLine } from "../lib/cart-lines";
import { openQuickView } from "../lib/events";
import { mkToast } from "../toast";
import { num } from "../ui";

type StepProduct = { id: string; name: string; slug: string; price: number; stock: number; hasOptions: boolean };

const fail = (message: string) => mkToast.error(message);

/** The heart of the theme: a round + that grows into − qty + in place, so a
 *  shopper fills a basket from the shelf without opening a single page. A
 *  product with options opens its sheet instead. `block` is the full-width
 *  capsule used by the bold card and list rows. */
export default function Stepper({ storeSlug, product, block, className }: { storeSlug: string; product: StepProduct; block?: boolean; className?: string }) {
  const { qty, add, remove } = useCartLine(storeSlug, product, fail);
  const label = block ? (product.hasOptions ? "اختار" : "أضف") : null;

  if (product.stock <= 0) return null;

  if (product.hasOptions) {
    return (
      <div className={cn("mk-step", block && "mk-step--block", className)} data-on="false">
        <button type="button" onClick={() => openQuickView(product.slug)} aria-label={`اختار الخيارات لـ ${product.name}`} className="mk-step-btn mk-step-plus">
          <Plus />
          {label && <span>{label}</span>}
        </button>
      </div>
    );
  }

  const on = qty > 0;
  return (
    <div role="group" aria-label={`كمية ${product.name}`} className={cn("mk-step", block && "mk-step--block", className)} data-on={on}>
      <button type="button" onClick={remove} tabIndex={on ? 0 : -1} aria-hidden={!on} aria-label={qty === 1 ? `شيل ${product.name} من السلة` : "قلّل الكمية"} className="mk-step-btn mk-step-minus">
        {qty <= 1 ? <Trash2 /> : <Minus />}
      </button>
      <span key={qty} aria-live="polite" className="mk-step-num mk-bump">
        {on ? num(qty) : ""}
      </span>
      <button type="button" onClick={add} disabled={qty >= product.stock} aria-label={on ? "زوّد الكمية" : `أضف ${product.name} للسلة`} className="mk-step-btn mk-step-plus">
        <Plus />
        {label && !on && <span>{label}</span>}
      </button>
    </div>
  );
}
