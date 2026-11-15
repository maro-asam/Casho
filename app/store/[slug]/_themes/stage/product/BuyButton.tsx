"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCart } from "../../shared/cart-events";
import { useCartLine } from "../lib/cart-lines";
import { openQuickView } from "../lib/events";
import { sgToast } from "../toast";
import { btn } from "../ui";
import { st } from "@/lib/i18n/storefront";

type BuyProduct = { id: string; name: string; slug: string; price: number; stock: number; hasOptions: boolean };

const fail = (message: string) => sgToast.error(message);

/** The card's one action. A plain product goes straight into the bag (the
 *  label turns into a check for a moment); one with sizes or colors opens its
 *  sheet so the shopper picks first. */
export default function BuyButton({ storeSlug, product, variant = "solid", className }: { storeSlug: string; product: BuyProduct; variant?: "solid" | "white" | "gray"; className?: string }) {
  const { add } = useCartLine(storeSlug, product, fail);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onAdd = useCallback(() => {
    add();
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
    sgToast.success(st("اتضاف للحقيبة: {0}", product.name), { action: { label: st("الحقيبة"), onClick: openCart } });
  }, [add, product.name]);

  if (product.stock <= 0) return null;

  if (product.hasOptions) {
    return (
      <button type="button" onClick={() => openQuickView(product.slug)} aria-label={st("اختار المقاس أو اللون لـ {0}", product.name)} className={cn(btn({ variant, size: "sm" }), "sg-buy", className)}>
        {st("اختار")}
      </button>
    );
  }

  return (
    <button type="button" onClick={onAdd} aria-label={st("اشترِ {0}", product.name)} className={cn(btn({ variant, size: "sm" }), "sg-buy", className)} data-done={done}>
      <span aria-hidden={done}>{st("اشترِ")}</span>
      <Check aria-hidden className="sg-buy-check" />
    </button>
  );
}
