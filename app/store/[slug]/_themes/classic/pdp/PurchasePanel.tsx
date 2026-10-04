"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { AddToCartAction } from "@/actions/store/cart.actions";
import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { notifyCartUpdated } from "../cart-events";
import { storeHref } from "../header/use-store-path";
import { btn } from "../ui";

type Props = {
  storeSlug: string;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    sizes: string[];
    colors: string[];
    image: string;
    wholesaleOptions: WholesaleTier[] | null;
  };
};

type OptionKey = "size" | "color";

function tierFor(tiers: WholesaleTier[] | null, qty: number) {
  if (!tiers?.length) return null;
  return [...tiers].reverse().find((t) => qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty)) ?? null;
}

function OptionGroup({
  id,
  label,
  values,
  selected,
  onSelect,
  error,
}: {
  id: string;
  label: string;
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  error: boolean;
}) {
  return (
    <fieldset id={id} className="scroll-mt-32">
      <legend className="mb-2.5 text-sm">
        <span className="font-semibold">{label}</span>
        {selected ? (
          <span className="text-muted-foreground">: {selected}</span>
        ) : (
          <span className={cn("ms-1.5 text-xs", error ? "font-semibold text-(--c-danger)" : "text-muted-foreground")}>
            {error ? `اختار ${label} الأول` : "(اختار واحد)"}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {values.map((v) => {
          const on = selected === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(v)}
              className={cn(
                "min-h-11 min-w-12 rounded-(--c-radius-sm) border px-4 text-sm font-medium transition-colors duration-(--c-motion)",
                on
                  ? "border-foreground bg-foreground text-background"
                  : error
                    ? "border-(--c-danger)/50 hover:border-foreground"
                    : "border-border hover:border-foreground/50",
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function PurchasePanel({ storeSlug, product }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<OptionKey, string | null>>({ size: null, color: null });
  const [missing, setMissing] = useState<OptionKey[]>([]);
  const [adding, startAdd] = useTransition();
  const [buying, startBuy] = useTransition();
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const inStock = product.stock > 0;
  const busy = adding || buying;
  const tier = tierFor(product.wholesaleOptions, qty);
  const unitPrice = tier?.price ?? product.price;

  // Sticky bar on phones once the main buttons scroll out of view
  useEffect(() => {
    if (!inStock) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ctaRef.current;
        if (el) setShowBar(el.getBoundingClientRect().bottom < 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [inStock]);

  const required: OptionKey[] = [
    ...(product.sizes.length ? (["size"] as const) : []),
    ...(product.colors.length ? (["color"] as const) : []),
  ];

  const validate = () => {
    const miss = required.filter((k) => !selected[k]);
    setMissing(miss);
    if (miss.length) {
      document.getElementById(`opt-${miss[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    const features: Record<string, string> = {};
    for (const k of required) features[k] = selected[k]!;
    return features;
  };

  const add = (then?: () => void) => {
    const features = validate();
    if (!features) return;
    const run = then ? startBuy : startAdd;
    run(async () => {
      try {
        const res = await AddToCartAction(
          storeSlug,
          product.id,
          Object.keys(features).length ? features : undefined,
          qty,
        );
        if (!res?.success) {
          toast.error(res && "message" in res && res.message ? res.message : "حصلت مشكلة، حاول تاني");
          return;
        }
        notifyCartUpdated();
        if (then) {
          then();
        } else {
          toast.success(qty > 1 ? `اتضاف ${qty} قطع للسلة` : "اتضاف للسلة", {
            icon: <Check className="size-4" />,
            action: { label: "عرض السلة", onClick: () => router.push(storeHref(storeSlug, "/cart")) },
          });
        }
      } catch {
        toast.error("حصلت مشكلة، حاول تاني");
      }
    });
  };

  const buyNow = () =>
    // Checkout is dynamic (reads the cart cookie), so a plain push is enough —
    // a refresh() here would re-render this page and cancel the navigation.
    add(() => router.push(storeHref(storeSlug, "/checkout")));

  const choose = (key: OptionKey, value: string) => {
    setSelected((s) => ({ ...s, [key]: s[key] === value ? null : value }));
    setMissing((m) => m.filter((k) => k !== key));
  };

  return (
    <div className="space-y-6">
      {(product.sizes.length > 0 || product.colors.length > 0) && (
        <div className="space-y-5">
          {product.sizes.length > 0 && (
            <OptionGroup
              id="opt-size"
              label="المقاس"
              values={product.sizes}
              selected={selected.size}
              onSelect={(v) => choose("size", v)}
              error={missing.includes("size")}
            />
          )}
          {product.colors.length > 0 && (
            <OptionGroup
              id="opt-color"
              label="اللون"
              values={product.colors}
              selected={selected.color}
              onSelect={(v) => choose("color", v)}
              error={missing.includes("color")}
            />
          )}
        </div>
      )}

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <div className="rounded-(--c-radius) border border-border">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">اشتري كمية ووفّر</p>
          <ul className="divide-y divide-border">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              return (
                <li key={t.minQty}>
                  <button
                    type="button"
                    onClick={() => inStock && setQty(Math.min(product.stock, t.minQty))}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-3 px-4 text-sm transition-colors",
                      on ? "bg-(--c-success-soft) font-semibold text-(--c-success)" : "hover:bg-(--c-subtle)",
                    )}
                  >
                    <span>
                      {t.maxQty ? `${t.minQty}–${t.maxQty} قطعة` : `${t.minQty}+ قطعة`}
                    </span>
                    <span className="tabular-nums">{formatPrice(t.price)} للقطعة</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {inStock ? (
        <div ref={ctaRef} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-(--c-control-lg) shrink-0 items-center rounded-(--c-btn-radius) border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1 || busy}
                aria-label="تقليل الكمية"
                className="grid h-full w-11 place-items-center text-foreground transition-opacity disabled:opacity-30"
              >
                <Minus className="size-4" />
              </button>
              <output aria-live="polite" aria-label="الكمية" className="w-8 text-center text-base font-semibold tabular-nums">
                {qty}
              </output>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock || busy}
                aria-label="زيادة الكمية"
                className="grid h-full w-11 place-items-center text-foreground transition-opacity disabled:opacity-30"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button type="button" onClick={() => add()} disabled={busy} className={btn({ size: "lg", className: "flex-1" })}>
              {adding ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              أضف للسلة
            </button>
          </div>
          <button type="button" onClick={buyNow} disabled={busy} className={btn({ variant: "outline", size: "lg", full: true })}>
            {buying && <Loader2 className="animate-spin" />}
            اشتري الآن
          </button>
          {qty > 1 && (
            <p className="text-center text-sm text-muted-foreground">
              الإجمالي: <span className="font-semibold text-foreground tabular-nums">{formatPrice(unitPrice * qty)}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-(--c-radius) bg-(--c-subtle) p-4 text-center">
          <p className="font-semibold">المنتج ده خلص حاليًا</p>
          <p className="mt-1 text-sm text-muted-foreground">تقدر تتصفح منتجات مشابهة تحت.</p>
        </div>
      )}

      {/* Sticky purchase bar — phones/tablets */}
      {inStock && (
        <div
          aria-hidden={!showBar}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-transform duration-(--c-motion) lg:hidden",
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="c-container flex items-center gap-3 py-2.5">
            <div className="c-img-bg relative size-11 shrink-0 overflow-hidden rounded-(--c-radius-sm)">
              <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] text-muted-foreground">{product.name}</p>
              <p className="text-base font-bold tabular-nums">{formatPrice(unitPrice)}</p>
            </div>
            <button
              type="button"
              tabIndex={showBar ? 0 : -1}
              onClick={() => add()}
              disabled={busy}
              className={btn({ size: "lg", className: "px-5" })}
            >
              {adding ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              أضف للسلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
