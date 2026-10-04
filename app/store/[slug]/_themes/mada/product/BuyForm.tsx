"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { openCart } from "../../shared/cart-events";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { swatchColor } from "../lib/colors";
import { mdToast } from "../toast";
import { PlateImage, btn, num } from "../ui";

export type BuyProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image: string | null;
  wholesaleOptions?: WholesaleTier[] | null;
};

type OptionKey = "size" | "color";

function ColorPicker({ id, values, selected, onSelect, error }: { id: string; values: string[]; selected: string | null; onSelect: (v: string) => void; error: boolean }) {
  return (
    <fieldset id={id} className="scroll-mt-32">
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="font-semibold">اللون</span>
          {selected && <span className="text-(--md-quiet)">: {selected}</span>}
        </span>
        {!selected && (
          <span role={error ? "alert" : undefined} className={cn("text-xs", error ? "font-semibold text-(--md-sale)" : "text-(--md-quiet)")}>
            {error ? "اختار اللون الأول" : "اختار لون"}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label="اللون" className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const color = swatchColor(v);
          const on = selected === v;
          return color ? (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="md-swatch-btn" data-error={error || undefined}>
              <span className="md-swatch size-8" style={{ background: color }} />
            </button>
          ) : (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="md-chip" data-error={error || undefined}>
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SizePicker({ id, values, selected, onSelect, error }: { id: string; values: string[]; selected: string | null; onSelect: (v: string) => void; error: boolean }) {
  return (
    <fieldset id={id} className="scroll-mt-32">
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="font-semibold">المقاس</span>
          {selected && <span className="text-(--md-quiet)">: {selected}</span>}
        </span>
        {!selected && (
          <span role={error ? "alert" : undefined} className={cn("text-xs", error ? "font-semibold text-(--md-sale)" : "text-(--md-quiet)")}>
            {error ? "اختار المقاس الأول" : "اختار مقاس"}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label="المقاس" className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={selected === v} onClick={() => onSelect(v)} className="md-chip min-w-14" data-error={error || undefined}>
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex h-12 items-center rounded-full border border-(--md-line) bg-(--md-surface)">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="تقليل الكمية" className="grid size-12 place-items-center rounded-full transition-colors hover:bg-(--md-studio) disabled:opacity-30">
        <Minus className="size-4" />
      </button>
      <output aria-live="polite" aria-label="الكمية" className="md-price w-8 text-center text-base">
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="زيادة الكمية" className="grid size-12 place-items-center rounded-full transition-colors hover:bg-(--md-studio) disabled:opacity-30">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Variant selection + quantity + add / buy. Shared by quick view and the PDP. */
export default function BuyForm({
  storeSlug,
  product,
  stickyBar,
  onAdded,
}: {
  storeSlug: string;
  product: BuyProduct;
  /** Show a fixed purchase bar on phones once the main button scrolls away. */
  stickyBar?: boolean;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const { add, pending } = useAddToCart(storeSlug);
  const [buying, setBuying] = useState(false);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<OptionKey, string | null>>({ size: null, color: null });
  const [missing, setMissing] = useState<OptionKey[]>([]);
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const inStock = product.stock > 0;
  const tier = tierFor(product.wholesaleOptions ?? null, qty);
  const unit = tier?.price ?? product.price;
  const required: OptionKey[] = [...(product.sizes.length ? (["size"] as const) : []), ...(product.colors.length ? (["color"] as const) : [])];
  const summary = [selected.color, selected.size].filter(Boolean).join(" · ");

  useEffect(() => {
    if (!stickyBar || !inStock) return;
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [stickyBar, inStock]);

  const validate = () => {
    const miss = required.filter((k) => !selected[k]);
    setMissing(miss);
    if (miss.length) {
      document.getElementById(`buy-${product.id}-${miss[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    const f: Record<string, string> = {};
    for (const k of required) f[k] = selected[k]!;
    return f;
  };

  const addToCart = async () => {
    const f = validate();
    if (!f) return;
    const res = await add(product.id, f, qty);
    if (!res.ok) return mdToast.error(res.message);
    onAdded?.();
    openCart();
  };

  const buyNow = async () => {
    const f = validate();
    if (!f) return;
    setBuying(true);
    const res = await add(product.id, f, qty);
    if (!res.ok) {
      setBuying(false);
      return mdToast.error(res.message);
    }
    router.push(storeHref(storeSlug, "/checkout"));
  };

  const choose = (k: OptionKey, v: string) => {
    setSelected((s) => ({ ...s, [k]: s[k] === v ? null : v }));
    setMissing((m) => m.filter((x) => x !== k));
  };

  if (!inStock) {
    return (
      <div className="md-panel border border-(--md-line) p-5">
        <p className="font-semibold">الكمية خلصت حاليًا</p>
        <p className="mt-1 text-sm text-(--md-quiet)">احفظ المنتج في المفضلة وارجعله، أو شوف منتجات قريبة منه تحت.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {product.colors.length > 0 && (
        <ColorPicker id={`buy-${product.id}-color`} values={product.colors} selected={selected.color} onSelect={(v) => choose("color", v)} error={missing.includes("color")} />
      )}
      {product.sizes.length > 0 && (
        <SizePicker id={`buy-${product.id}-size`} values={product.sizes} selected={selected.size} onSelect={(v) => choose("size", v)} error={missing.includes("size")} />
      )}

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <div className="rounded-(--md-radius) border border-(--md-line) bg-(--md-surface) p-1.5">
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-(--md-quiet)">اشتري كمية ووفّر</p>
          <div className="grid gap-1">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              return (
                <button
                  key={t.minQty}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setQty(Math.min(product.stock, t.minQty))}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-[0.6rem] px-3 text-sm transition-colors",
                    on ? "bg-(--md-signal) font-semibold text-(--md-signal-ink)" : "hover:bg-(--md-studio)",
                  )}
                >
                  <span>{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)}+ قطعة`}</span>
                  <span className="md-price">{formatPrice(t.price)} للقطعة</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div ref={ctaRef} className="space-y-3">
        <div className="flex gap-3">
          <Qty value={qty} max={product.stock} onChange={setQty} disabled={pending} />
          <button type="button" onClick={addToCart} disabled={pending} className={btn({ size: "lg", className: "min-w-0 flex-1 px-5" })}>
            {pending && !buying ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
            <span className="truncate">أضف للسلة</span>
            <span className="md-price opacity-80">· {formatPrice(unit * qty)}</span>
          </button>
        </div>
        <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "outline", size: "lg", full: true })}>
          {buying ? <Loader2 className="animate-spin" /> : <Check />}
          اشتري الآن
        </button>
      </div>

      {stickyBar && (
        <div
          aria-hidden={!showBar}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-(--md-line) bg-(--md-surface)/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="md-wrap flex items-center gap-3 py-2.5">
            <span className="md-media size-12 shrink-0 rounded-[0.6rem]">
              <PlateImage src={product.image} sizes="48px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-(--md-quiet)">{summary || product.name}</p>
              <p className="md-price text-base">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" tabIndex={showBar ? 0 : -1} onClick={addToCart} disabled={pending} className={btn({ className: "px-5" })}>
              {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              أضف للسلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
