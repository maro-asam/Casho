"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgePercent, Loader2, Minus, Plus, ShoppingBag, Zap } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { openCart } from "../../shared/cart-events";
import { swatchColor } from "../../shared/colors";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { rxToast } from "../toast";
import { OPTION_LABEL, PlateImage, btn, num } from "../ui";

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
  const label = OPTION_LABEL[kind];
  return (
    <fieldset id={id} className="scroll-mt-40">
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-(--rx-ink)">
          {label}
          {selected && <span className="font-normal text-(--rx-text)">: {selected}</span>}
        </span>
        {!selected && (
          <span role={error ? "alert" : undefined} className={cn("text-xs", error ? "font-bold text-(--rx-error)" : "text-(--rx-quiet)")}>
            {error ? `اختار ${label} الأول` : `اختار ${label}`}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {values.map((v) => {
          const color = kind === "color" ? swatchColor(v) : null;
          const on = selected === v;
          return color ? (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="rx-swatch-btn" data-error={error || undefined}>
              <span className="rx-swatch size-7" style={{ background: color }} />
            </button>
          ) : (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="rx-opt min-h-10 px-4 text-[0.8125rem]" data-error={error || undefined}>
              {v}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled, size = "lg" }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean; size?: "sm" | "lg" }) {
  const cell = size === "lg" ? "size-11" : "size-9";
  return (
    <div className="flex w-fit shrink-0 items-center rounded-full border border-(--rx-line) bg-(--rx-card)">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="تقليل الكمية" className={cn(cell, "grid place-items-center rounded-full transition-opacity hover:bg-(--rx-band) disabled:opacity-30 [&_svg]:size-4")}>
        <Minus />
      </button>
      <output aria-live="polite" aria-label="الكمية" className={cn("rx-num grid place-items-center text-center font-bold text-(--rx-ink)", size === "lg" ? "w-10" : "w-8")}>
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="زيادة الكمية" className={cn(cell, "grid place-items-center rounded-full transition-opacity hover:bg-(--rx-band) disabled:opacity-30 [&_svg]:size-4")}>
        <Plus />
      </button>
    </div>
  );
}

/** Option pickers + quantity pricing + quantity + add / buy now.
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
  const required: OptionKey[] = [...(product.sizes.length ? (["size"] as const) : []), ...(product.colors.length ? (["color"] as const) : [])];
  const summary = [selected.size, selected.color].filter(Boolean).join(" · ");

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
    if (!res.ok) return rxToast.error(res.message);
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
      return rxToast.error(res.message);
    }
    router.push(storeHref(storeSlug, "/checkout"));
  };

  const choose = (k: OptionKey, v: string) => {
    setSelected((s) => ({ ...s, [k]: s[k] === v ? null : v }));
    setMissing((m) => m.filter((x) => x !== k));
  };

  if (!inStock) {
    return (
      <div className="space-y-3">
        <button type="button" disabled className={btn({ variant: "soft", size: "lg", full: true })}>
          غير متوفر حاليًا
        </button>
        <p className="text-sm text-(--rx-quiet)">المنتج ده خلص دلوقتي. شوف البدائل المتاحة تحت، أو اسأل المتجر عن ميعاد توفّره.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
          <p className="mb-2.5 text-sm font-semibold text-(--rx-ink)">اشتري كمية ووفّر</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              const save = product.price > t.price ? Math.round(((product.price - t.price) / product.price) * 100) : 0;
              return (
                <li key={t.minQty}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setQty(Math.min(product.stock, t.minQty))}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-(--rx-r) border px-3.5 py-2.5 text-start text-sm transition-colors",
                      on ? "border-(--rx-btn) bg-(--rx-tint) shadow-[inset_0_0_0_1px_var(--rx-btn)]" : "border-(--rx-line) bg-(--rx-card) hover:border-(--rx-btn)",
                    )}
                  >
                    <BadgePercent aria-hidden className="size-5 shrink-0 text-(--rx-btn)" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-(--rx-ink)">{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)} قطع أو أكتر`}</span>
                      <span className="text-xs text-(--rx-text)">{formatPrice(t.price)} للقطعة</span>
                    </span>
                    {save > 0 && <span className="rx-chip-off shrink-0">وفّر {num(save)}٪</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div ref={ctaRef} className="flex flex-wrap items-center gap-3">
        <Qty value={qty} max={product.stock} onChange={setQty} disabled={pending} />
        <button type="button" onClick={addToCart} disabled={pending} className={btn({ size: "lg", className: "min-w-0 flex-1 px-4" })}>
          {pending && !buying ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          <span className="truncate">أضف للسلة</span>
          {qty > 1 && <span className="rx-num opacity-85">· {formatPrice(unit * qty)}</span>}
        </button>
        <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "tint", size: "lg", full: true })}>
          {buying ? <Loader2 className="animate-spin" /> : <Zap />}
          اشتري دلوقتي
        </button>
      </div>

      {stickyBar && (
        <div
          aria-hidden={!showBar}
          inert={!showBar}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t border-(--rx-line) bg-(--rx-surface)/95 backdrop-blur-md transition-transform duration-300 ease-(--rx-ease) lg:hidden",
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="rx-wrap flex items-center gap-3 py-2.5">
            <span className="rx-media size-12 shrink-0 rounded-(--rx-r-sm)">
              <PlateImage src={product.image} sizes="48px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-(--rx-quiet)">{summary || product.name}</p>
              <p className="rx-price text-base">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" onClick={addToCart} disabled={pending} className={btn({ className: "px-5" })}>
              {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              أضف للسلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
