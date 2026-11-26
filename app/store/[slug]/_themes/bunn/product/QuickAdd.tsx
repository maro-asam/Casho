"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOptionalStoreTheme } from "../../../_context/StoreThemeContext";
import { openCart } from "../../shared/cart-events";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { openQuickView } from "../lib/events";
import { bnToast } from "../toast";
import { st } from "@/lib/i18n/storefront";

type Product = { id: string; name: string; slug: string; stock: number; hasOptions: boolean };

/** The card's one action. A plain item goes straight into the bag; one with
 *  options — or beans that need a grind — opens its quick view first. */
export default function QuickAdd({ storeSlug, product, beans, className }: { storeSlug: string; product: Product; /** Coffee beans: the store asks for a grind. */ beans?: boolean; className?: string }) {
  const { add, pending } = useAddToCart(storeSlug);
  const grindOn = useOptionalStoreTheme()?.layout.grind !== false;
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (product.stock <= 0) return null;
  const choose = product.hasOptions || (beans && grindOn);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (choose) return openQuickView(product.slug);
    const res = await add(product.id, undefined, 1);
    if (!res.ok) return bnToast.error(res.message);
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
    bnToast.success(st("اتضاف للسلة: {0}", product.name), { action: { label: st("السلة"), onClick: openCart } });
  };

  const label = choose ? (beans && grindOn && !product.hasOptions ? st("اختار الطحنة") : st("اختار")) : st("أضف للسلة");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={choose ? st("اختار الطحنة أو النوع لـ {0}", product.name) : st("أضف {0} للسلة", product.name)}
      className={cn("bn-quick", className)}
      data-done={done}
    >
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : done ? <Check aria-hidden /> : <Plus aria-hidden />}
      <span className="bn-quick-label">{done ? st("اتضاف") : label}</span>
    </button>
  );
}
