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
import { sgToast } from "../toast";
import { OPTION_LABEL, PlateImage, btn, isVariety, num } from "../ui";

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

/** apple.com's buy-page step: "اللون. اختار لونك المفضّل." over round
 *  swatches, or large boxes for sizes and types. */
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
  const flavor = kind === "color" && isVariety(values);
  const swatches = kind === "color" && !flavor;
  const label = flavor ? "النوع" : OPTION_LABEL[kind];
  const hint = flavor ? "اختار اللي يعجبك." : kind === "color" ? "اختار لونك المفضّل." : "إيه المقاس المناسب ليك؟";
  return (
    <fieldset id={id} className="sg-step-group scroll-mt-40">
      <legend className="sg-step-legend">
        <span className="text-(--sg-ink)">{label}.</span> {hint}
      </legend>
      <div role="radiogroup" aria-label={label} className={swatches ? "flex flex-wrap gap-3.5" : "sg-optgrid"}>
        {values.map((v) => {
          const color = swatches ? swatchColor(v) : null;
          const on = selected === v;
          return color ? (
            <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="sg-swatch-btn" data-error={error || undefined}>
              <span className="sg-swatch size-8" style={{ background: color }} />
            </button>
          ) : (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="sg-optbox" data-error={error || undefined}>
              {v}
            </button>
          );
        })}
      </div>
      {swatches && <p className="mt-3 min-h-5 text-sm text-(--sg-label-2)">{selected ? `اللون — ${selected}` : values.length === 1 ? "لون واحد" : values.length === 2 ? "لونين" : `${num(values.length)} ألوان`}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-(--sg-error)">
          اختار {label} الأول.
        </p>
      )}
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled, size = "lg" }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean; size?: "sm" | "lg" }) {
  const cell = size === "lg" ? "size-12" : "size-9";
  return (
    <div className="sg-qty">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="تقليل الكمية" className={cell}>
        <Minus />
      </button>
      <output aria-live="polite" aria-label="الكمية" className={cn("sg-num grid place-items-center text-center font-semibold text-(--sg-ink)", size === "lg" ? "w-9" : "w-7")}>
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="زيادة الكمية" className={cell}>
        <Plus />
      </button>
    </div>
  );
}

/** Option steps + quantity pricing + quantity + add to bag / buy now.
 *  Shared by the quick view and the product page. */
export default function BuyForm({
  storeSlug,
  product,
  stickyBar,
  onAdded,
}: {
  storeSlug: string;
  product: BuyProduct;
  /** Glass purchase bar on phones once the main button scrolls away. */
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
    // The root reaches far below the screen, so the button only "leaves" once
    // it's above the top — even when a fast scroll jumps right past it.
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
    if (!res.ok) return sgToast.error(res.message);
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
      return sgToast.error(res.message);
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
        <button type="button" disabled className={btn({ variant: "gray", size: "lg", full: true })}>
          غير متوفر حاليًا
        </button>
        <p className="text-sm leading-6 text-(--sg-label-2)">المنتج ده خلص دلوقتي. شوف البدائل تحت، أو اسأل المتجر عن ميعاد توفّره.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        <fieldset className="sg-step-group">
          <legend className="sg-step-legend">
            <span className="text-(--sg-ink)">الكمية.</span> اشتري أكتر ووفّر.
          </legend>
          <div className="sg-optgrid">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              const save = product.price > t.price ? Math.round(((product.price - t.price) / product.price) * 100) : 0;
              return (
                <button key={t.minQty} type="button" aria-pressed={on} onClick={() => setQty(Math.min(product.stock, t.minQty))} className="sg-optbox !items-start !justify-start !text-start" data-on={on}>
                  <span className="block font-semibold text-(--sg-ink)">{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)} قطع أو أكتر`}</span>
                  <span className="block text-[0.8125rem] font-normal text-(--sg-label-2)">
                    {formatPrice(t.price)} للقطعة{save > 0 && ` · وفّر ${num(save)}٪`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div ref={ctaRef} className="sg-bagbox">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-(--sg-label-2)">{summary || product.name}</p>
            <p className="sg-price mt-0.5 text-2xl">{formatPrice(unit * qty)}</p>
          </div>
          <Qty value={qty} max={product.stock} onChange={setQty} disabled={pending} />
        </div>
        <div className="mt-5 grid gap-3">
          <button type="button" onClick={addToCart} disabled={pending} className={btn({ size: "lg", full: true })}>
            {pending && !buying && <Loader2 className="animate-spin" />}
            أضف للحقيبة
          </button>
          <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "gray", size: "lg", full: true })}>
            {buying && <Loader2 className="animate-spin" />}
            اشترِ دلوقتي
          </button>
        </div>
      </div>

      {stickyBar && (
        <div aria-hidden={!showBar} inert={!showBar} className="sg-buybar lg:hidden" data-show={showBar}>
          <div className="sg-wrap flex items-center gap-3 py-2.5">
            <span className="sg-media relative size-11 shrink-0 rounded-(--sg-r-sm)">
              <PlateImage src={product.image} sizes="44px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-(--sg-label-2)">{summary || product.name}</p>
              <p className="sg-price text-base">{formatPrice(unit * qty)}</p>
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
