"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, Send } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { openCart } from "../../shared/cart-events";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { hintMessage, isMetalOption, swatchFill, waShare } from "../lib/qirat";
import SizeGuide from "../pdp/SizeGuide";
import { qrToast } from "../toast";
import { PlateImage, btn, isVariety, num, optionLabel } from "../ui";
import WishButton from "./WishButton";

export type BuyProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image: string | null;
  wholesaleOptions?: WholesaleTier[] | null;
};

type OptionKey = "size" | "color";

/** One choice: metals as polished round swatches with their name, colors as
 *  flat ones, sizes and stones as boxes. */
function OptionGroup({
  id,
  kind,
  values,
  selected,
  onSelect,
  error,
  extra,
}: {
  id: string;
  kind: OptionKey;
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  error: boolean;
  extra?: React.ReactNode;
}) {
  const swatches = kind === "color" && !isVariety(values);
  const metal = kind === "color" && isMetalOption(values);
  const label = optionLabel(kind, values);
  return (
    <fieldset id={id} className="qr-opt-group scroll-mt-40">
      <div className="flex items-baseline justify-between gap-3">
        <legend className="qr-opt-legend">
          {label}
          {selected && <span className="qr-opt-chosen"> — {selected}</span>}
        </legend>
        {extra}
      </div>
      <div role="radiogroup" aria-label={label} className={swatches ? "qr-swatch-row" : "qr-optgrid"} data-metal={metal || undefined}>
        {values.map((v) => {
          const fill = swatches ? swatchFill(v) : null;
          const on = selected === v;
          return fill ? (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="qr-swatch-btn" data-error={error || undefined}>
              <span className="qr-swatch qr-swatch--lg" style={{ background: fill }} />
              {metal && <span className="qr-swatch-name">{v}</span>}
            </button>
          ) : (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="qr-optbox" data-error={error || undefined}>
              {v}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-(--qr-error)">
          اختار {label} الأول.
        </p>
      )}
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="qr-qty">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="تقليل الكمية">
        <Minus />
      </button>
      <output aria-live="polite" aria-label="الكمية" className="qr-num">
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="زيادة الكمية">
        <Plus />
      </button>
    </div>
  );
}

/** Options, quantity pricing, quantity, add to bag / buy now, the wishlist and
 *  "لمّح لحد" (send the piece to someone who might gift it). Shared by the
 *  quick view and the product page. */
export default function BuyForm({
  storeSlug,
  storeName,
  product,
  stickyBar,
  onAdded,
}: {
  storeSlug: string;
  storeName: string;
  product: BuyProduct;
  /** Purchase bar on phones once the main button scrolls away. */
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
    // The root reaches far below the screen, so the bar only shows once the
    // buttons are above the top — even when a fast scroll jumps past them.
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { rootMargin: "0px 0px 100000px 0px" });
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
    if (!res.ok) return qrToast.error(res.message);
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
      return qrToast.error(res.message);
    }
    router.push(storeHref(storeSlug, "/checkout"));
  };

  const hint = () => {
    const url = new URL(storeHref(storeSlug, `/products/${product.slug}`), window.location.origin).toString();
    window.open(waShare(hintMessage(product.name, url, storeName)), "_blank", "noopener");
  };

  const choose = (k: OptionKey, v: string) => {
    setSelected((s) => ({ ...s, [k]: s[k] === v ? null : v }));
    setMissing((m) => m.filter((x) => x !== k));
  };

  const keep = (
    <div className="qr-keep">
      <WishButton storeSlug={storeSlug} productId={product.id} name={product.name} label />
      <button type="button" onClick={hint} className="qr-hint">
        <Send aria-hidden />
        <span className="qr-underline">لمّح لحد يهاديك</span>
      </button>
    </div>
  );

  if (!inStock) {
    return (
      <div className="space-y-4">
        <button type="button" disabled className={btn({ variant: "outline", size: "lg", full: true })}>
          نفدت الكمية حاليًا
        </button>
        <p className="text-sm leading-6 text-(--qr-ink-2)">القطعة دي خلصت دلوقتي. احفظها في قايمة أمنياتك، أو اسأل المتجر عن ميعاد رجوعها.</p>
        {keep}
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
          extra={k === "size" ? <SizeGuide sizes={product.sizes} /> : undefined}
        />
      ))}

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <fieldset className="qr-opt-group">
          <legend className="qr-opt-legend">اشتري أكتر ووفّر</legend>
          <div className="qr-optgrid">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              const save = product.price > t.price ? Math.round(((product.price - t.price) / product.price) * 100) : 0;
              return (
                <button key={t.minQty} type="button" aria-pressed={on} onClick={() => setQty(Math.min(product.stock, t.minQty))} className="qr-optbox qr-optbox--tier" data-on={on}>
                  <span className="block font-semibold">{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)} قطع أو أكتر`}</span>
                  <span className="block text-xs text-(--qr-ink-2)">
                    {formatPrice(t.price)} للقطعة{save > 0 && ` · وفّر ${num(save)}٪`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div ref={ctaRef} className="space-y-3">
        <div className="flex items-stretch gap-3">
          <Qty value={qty} max={product.stock} onChange={setQty} disabled={pending} />
          <button type="button" onClick={addToCart} disabled={pending} className={btn({ size: "lg", className: "flex-1" })}>
            {pending && !buying && <Loader2 className="animate-spin" />}
            أضف للحقيبة
            {qty > 1 || tier ? <span className="qr-btn-meta">· {formatPrice(unit * qty)}</span> : null}
          </button>
        </div>
        <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "outline", size: "lg", full: true })}>
          {buying && <Loader2 className="animate-spin" />}
          اشتري دلوقتي
        </button>
      </div>

      {keep}

      {stickyBar && (
        <div aria-hidden={!showBar} inert={!showBar} className="qr-buybar lg:hidden" data-show={showBar}>
          <div className="qr-wrap flex items-center gap-3 py-2.5">
            <span className="qr-plate relative size-12 shrink-0 overflow-hidden">
              <PlateImage src={product.image} sizes="48px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-xs text-(--qr-ink-2)")}>{summary || product.name}</p>
              <p className="qr-price text-base">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" onClick={addToCart} disabled={pending} className={btn({ className: "px-5" })}>
              {pending && <Loader2 className="animate-spin" />}
              أضف للحقيبة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
