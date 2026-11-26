"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

import type { ProductAttribute } from "@/lib/products/attributes";
import { useOptionalStoreTheme } from "../../../_context/StoreThemeContext";
import type { WholesaleTier } from "../../types";
import { openCart } from "../../shared/cart-events";
import { swatchColor } from "../../shared/colors";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { useAddToCart } from "../../shared/use-add-to-cart";
import { GrindIcon } from "../icons";
import { GRIND_IDS, ROAST_COLORS, grindHint, grindLabel, needsGrind, optionKind, readProfile, roastOf, suggestedGrind, type GrindId } from "../lib/coffee";
import { bnToast } from "../toast";
import { PlateImage, btn, num, optionLabel } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

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
  categoryName?: string | null;
  attributes: ProductAttribute[];
  description?: string | null;
  wholesaleOptions?: WholesaleTier[] | null;
};

type OptionKey = "size" | "color" | "grind";

/** One of the product's own options: roasts as bean-colored chips, colors as
 *  swatches, everything else (weights, grinds, sizes) as boxes. */
function OptionGroup({
  id,
  kind,
  values,
  selected,
  onSelect,
  error,
}: {
  id: string;
  kind: "size" | "color";
  values: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  error: boolean;
}) {
  const what = optionKind(values);
  const label = optionLabel(kind, values);
  const swatches = kind === "color" && what === "plain" && values.every((v) => swatchColor(v));
  return (
    <fieldset id={id} className="bn-opt-group scroll-mt-40">
      <legend className="bn-opt-legend">
        {label}
        {selected && <span className="bn-opt-chosen"> — {selected}</span>}
      </legend>
      <div role="radiogroup" aria-label={label} className={swatches ? "bn-swatch-row" : "bn-optgrid"}>
        {values.map((v) => {
          const on = selected === v;
          if (swatches)
            return (
              <button key={v} type="button" role="radio" aria-checked={on} aria-label={v} title={v} onClick={() => onSelect(v)} className="bn-swatch-btn" data-error={error || undefined}>
                <span className="bn-swatch" style={{ background: swatchColor(v)! }} />
              </button>
            );
          const level = what === "roast" ? roastOf(v) : null;
          return (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v)} className="bn-optbox" data-error={error || undefined}>
              {level && <span aria-hidden className="bn-optbean" style={{ background: ROAST_COLORS[level] }} />}
              {v}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-(--bn-error)">
          {st("اختار {0} الأول.", label)}
        </p>
      )}
    </fieldset>
  );
}

/** How to grind the beans: six tiles with the brew method's glyph and the
 *  grind's coarseness; the one for the coffee's brew method is marked. */
function GrindGroup({ id, selected, suggested, onSelect, error }: { id: string; selected: GrindId | null; suggested: GrindId | null; onSelect: (g: GrindId) => void; error: boolean }) {
  return (
    <fieldset id={id} className="bn-opt-group scroll-mt-40">
      <legend className="bn-opt-legend">
        {st("الطحنة")}
        {selected && <span className="bn-opt-chosen"> — {grindLabel(selected)}</span>}
      </legend>
      <div role="radiogroup" aria-label={st("الطحنة")} className="bn-grinds">
        {GRIND_IDS.map((g) => (
          <button key={g} type="button" role="radio" aria-checked={selected === g} onClick={() => onSelect(g)} className="bn-grind" data-error={error || undefined}>
            <GrindIcon id={g} className="bn-grind-icon" />
            <span className="bn-grind-name">{grindLabel(g)}</span>
            <span className="bn-grind-hint">{grindHint(g)}</span>
            {suggested === g && <span className="bn-grind-tag">{st("مقترح")}</span>}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-(--bn-error)">
          {st("اختار الطحنة الأول.")}
        </p>
      )}
    </fieldset>
  );
}

export function Qty({ value, max, onChange, disabled }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="bn-qty">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label={st("تقليل الكمية")}>
        <Minus />
      </button>
      <output aria-live="polite" aria-label={st("الكمية")} className="bn-num">
        {num(value)}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label={st("زيادة الكمية")}>
        <Plus />
      </button>
    </div>
  );
}

/** Options, the grind (for beans), quantity pricing, quantity and add to bag /
 *  buy now. Shared by the quick view and the product page. */
export default function BuyForm({
  storeSlug,
  product,
  stickyBar,
  onAdded,
}: {
  storeSlug: string;
  product: BuyProduct;
  /** Purchase bar on phones once the main button scrolls away. */
  stickyBar?: boolean;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const { add, pending } = useAddToCart(storeSlug);
  const grindOn = useOptionalStoreTheme()?.layout.grind !== false;
  const [buying, setBuying] = useState(false);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<{ size: string | null; color: string | null; grind: GrindId | null }>({ size: null, color: null, grind: null });
  const [missing, setMissing] = useState<OptionKey[]>([]);
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const input = { name: product.name, categoryName: product.categoryName, attributes: product.attributes, sizes: product.sizes, colors: product.colors, description: product.description };
  const profile = useMemo(() => readProfile(input), [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const askGrind = needsGrind(input, grindOn, profile);
  const suggested = askGrind ? suggestedGrind(profile) : null;

  const inStock = product.stock > 0;
  const tier = tierFor(product.wholesaleOptions ?? null, qty);
  const unit = tier?.price ?? product.price;
  const required: OptionKey[] = [...(product.colors.length ? (["color"] as const) : []), ...(product.sizes.length ? (["size"] as const) : []), ...(askGrind ? (["grind"] as const) : [])];
  const summary = [selected.color, selected.size, selected.grind && grindLabel(selected.grind)].filter(Boolean).join(" · ");

  useEffect(() => {
    if (!stickyBar || !inStock) return;
    const el = ctaRef.current;
    if (!el) return;
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
    if (selected.color) f.color = selected.color;
    if (selected.size) f.size = selected.size;
    if (askGrind && selected.grind) f.grind = grindLabel(selected.grind);
    return f;
  };

  const addToCart = async () => {
    const f = validate();
    if (!f) return;
    const res = await add(product.id, f, qty);
    if (!res.ok) return bnToast.error(res.message);
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
      return bnToast.error(res.message);
    }
    router.push(storeHref(storeSlug, "/checkout"));
  };

  const choose = <K extends OptionKey>(k: K, v: (typeof selected)[K]) => {
    setSelected((s) => ({ ...s, [k]: s[k] === v ? null : v }));
    setMissing((m) => m.filter((x) => x !== k));
  };

  if (!inStock) {
    return (
      <div className="space-y-4">
        <button type="button" disabled className={btn({ variant: "outline", size: "lg", full: true })}>
          {st("خلص من المخزن حاليًا")}
        </button>
        <p className="text-sm leading-6 text-(--bn-ink-2)">{st("خلص دلوقتي. اسأل المتجر على واتساب عن ميعاد رجوعه، أو شوف قهوة قريبة منه تحت.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {(["color", "size"] as const)
        .filter((k) => required.includes(k))
        .map((k) => (
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

      {askGrind && <GrindGroup id={`buy-${product.id}-grind`} selected={selected.grind} suggested={suggested} onSelect={(g) => choose("grind", g)} error={missing.includes("grind")} />}

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <fieldset className="bn-opt-group">
          <legend className="bn-opt-legend">{st("اشتري أكتر ووفّر")}</legend>
          <div className="bn-optgrid">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              const save = product.price > t.price ? Math.round(((product.price - t.price) / product.price) * 100) : 0;
              return (
                <button key={t.minQty} type="button" aria-pressed={on} onClick={() => setQty(Math.min(product.stock, t.minQty))} className="bn-optbox bn-optbox--tier" data-on={on}>
                  <span className="block font-semibold">{t.maxQty ? st("{0}–{1} كيس", num(t.minQty), num(t.maxQty)) : st("{0} أكياس أو أكتر", num(t.minQty))}</span>
                  <span className="block text-xs text-(--bn-ink-2)">
                    {st("{0} للواحدة", formatPrice(t.price))}
                    {save > 0 && st(" · وفّر {0}٪", num(save))}
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
            {st("أضف للسلة")}
            {qty > 1 || tier ? <span className="bn-btn-meta">· {formatPrice(unit * qty)}</span> : null}
          </button>
        </div>
        <button type="button" onClick={buyNow} disabled={pending} className={btn({ variant: "outline", size: "lg", full: true })}>
          {buying && <Loader2 className="animate-spin" />}
          {st("اطلب دلوقتي")}
        </button>
      </div>

      {stickyBar && (
        <div aria-hidden={!showBar} inert={!showBar} className="bn-buybar lg:hidden" data-show={showBar}>
          <div className="bn-wrap flex items-center gap-3 py-2.5">
            <span className="bn-plate relative size-12 shrink-0 overflow-hidden">
              <PlateImage src={product.image} sizes="48px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-(--bn-ink-2)">{summary || product.name}</p>
              <p className="bn-price text-base">{formatPrice(unit * qty)}</p>
            </div>
            <button type="button" onClick={addToCart} disabled={pending} className={btn({ className: "px-5" })}>
              {pending && <Loader2 className="animate-spin" />}
              {st("أضف للسلة")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
