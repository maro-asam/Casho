"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { openCart } from "../../shared/cart-events";
import { swatchColor } from "../../shared/colors";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { dnToast } from "../toast";
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
const LABEL: Record<OptionKey, string> = { size: "المقاس", color: "اللون" };

function OptionGroup({
  id,
  kind,
  values,
  selected,
  onSelect,
  error,
}: {
  id: string;
  kind: OptionKey;
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  error: boolean;
}) {
  return (
    <fieldset id={id} className="scroll-mt-32">
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="dn-label">{LABEL[kind]}</span>
          {selected && <span className="text-(--dn-quiet)"> — {selected}</span>}
        </span>
        {!selected && (
          <span role={error ? "alert" : undefined} className={cn("text-xs", error ? "font-semibold text-(--dn-error)" : "text-(--dn-quiet)")}>
            {error ? `اختار ${LABEL[kind]} الأول` : `اختار ${LABEL[kind]}`}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label={LABEL[kind]} className="flex flex-wrap gap-2">
        {values.map((v) => {
          const color = kind === "color" ? swatchColor(v) : null;
          const on = selected === v;
          return color ? (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="dn-swatch-btn" data-error={error || undefined}>
              <span className="dn-swatch size-8" style={{ background: color }} />
            </button>
          ) : (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="dn-opt" data-error={error || undefined}>
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled, size = "lg" }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean; size?: "sm" | "lg" }) {
  const cell = size === "lg" ? "size-[3.25rem]" : "size-10";
  return (
    <div className="flex items-center rounded-full border border-(--dn-line-ink)">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="تقليل الكمية" className={cn(cell, "grid place-items-center rounded-full transition-opacity disabled:opacity-30 [&_svg]:size-3.5")}>
        <Minus />
      </button>
      <output aria-live="polite" aria-label="الكمية" className="dn-num w-7 text-center text-lg">
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="زيادة الكمية" className={cn(cell, "grid place-items-center rounded-full transition-opacity disabled:opacity-30 [&_svg]:size-3.5")}>
        <Plus />
      </button>
    </div>
  );
}

/** Option pickers + wholesale tiers + quantity + add / buy now.
 *  Shared by the quick view and the product page. */
export default function BuyForm({
  storeSlug,
  product,
  stickyBar,
  onAdded,
}: {
  storeSlug: string;
  product: BuyProduct;
  /** Fixed purchase bar on phones once the main button scrolls away. */
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
  const required: OptionKey[] = [...(product.colors.length ? (["color"] as const) : []), ...(product.sizes.length ? (["size"] as const) : [])];
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
    if (!res.ok) return dnToast.error(res.message);
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
      return dnToast.error(res.message);
    }
    router.push(storeHref(storeSlug, "/checkout"));
  };

  const choose = (k: OptionKey, v: string) => {
    setSelected((s) => ({ ...s, [k]: s[k] === v ? null : v }));
    setMissing((m) => m.filter((x) => x !== k));
  };

  if (!inStock) {
    return (
      <div className="border border-(--dn-line) p-5">
        <p className="dn-h4">الكمية خلصت حاليًا</p>
        <p className="mt-1 text-sm text-(--dn-quiet)">ارجع للمنتج ده قريب، أو شوف منتجات قريبة منه تحت.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {required.map((k) => (
        <OptionGroup
          key={k}
          id={`buy-${product.id}-${k}`}
          kind={k}
          values={k === "color" ? product.colors : product.sizes}
          selected={selected[k]}
          onSelect={(v) => choose(k, v)}
          error={missing.includes(k)}
        />
      ))}

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <div>
          <p className="dn-label mb-3">اشتري كمية ووفّر</p>
          <div className="divide-y divide-(--dn-line) border border-(--dn-line)">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              return (
                <button
                  key={t.minQty}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setQty(Math.min(product.stock, t.minQty))}
                  className={cn("flex min-h-12 w-full items-center justify-between gap-3 px-4 text-sm transition-colors", on ? "bg-(--dn-ink) text-(--dn-bg)" : "hover:bg-(--dn-plate)")}
                >
                  <span>{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)}+ قطعة`}</span>
                  <span className="dn-num text-base">{formatPrice(t.price)} للقطعة</span>
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
            {pending && !buying ? <Loader2 className="animate-spin" /> : null}
            <span className="truncate">أضف للسلة</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span className="dn-num text-[1.0625rem] font-normal normal-case tracking-normal">{formatPrice(unit * qty)}</span>
          </button>
        </div>
        <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "outline", size: "lg", full: true })}>
          {buying ? <Loader2 className="animate-spin" /> : null}
          اشتري الآن
        </button>
      </div>

      {stickyBar && (
        <div
          aria-hidden={!showBar}
          inert={!showBar}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-(--dn-line) bg-(--dn-drawer)/95 backdrop-blur-md transition-transform duration-500 ease-(--dn-ease) lg:hidden",
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="dn-wrap flex items-center gap-3 py-2.5">
            <span className="dn-media size-12 shrink-0">
              <PlateImage src={product.image} sizes="48px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-(--dn-quiet)">{summary || product.name}</p>
              <p className="dn-price text-base">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" onClick={addToCart} disabled={pending} className={btn({ className: "px-5" })}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              أضف للسلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
