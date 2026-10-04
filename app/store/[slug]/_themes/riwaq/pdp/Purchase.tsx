"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

import { AddToCartAction } from "@/actions/store/cart.actions";
import { cn, formatPrice } from "@/lib/utils";
import type { WholesaleTier } from "../../types";
import { notifyCartUpdated } from "../../shared/cart-events";
import { tierFor } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";
import { rqToast } from "../toast";
import { btn, num } from "../ui";

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

const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

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
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="font-semibold">{label}</span>
          {selected && <span className="text-(--rq-quiet)"> — {selected}</span>}
        </span>
        {!selected && (
          <span className={cn("text-xs", error ? "font-semibold text-(--rq-sale)" : "text-(--rq-quiet)")} role={error ? "alert" : undefined}>
            {error ? `اختار ${label} الأول` : "اختار واحد"}
          </span>
        )}
      </legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected === v}
            data-error={error || undefined}
            onClick={() => onSelect(v)}
            className="rq-opt"
            aria-label={HEX.test(v) ? `${label} ${v}` : undefined}
          >
            {HEX.test(v) ? <span className="rq-swatch" style={{ background: v }} /> : v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Purchase({ storeSlug, product }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<OptionKey, string | null>>({ size: null, color: null });
  const [missing, setMissing] = useState<OptionKey[]>([]);
  const [adding, startAdd] = useTransition();
  const [buying, startBuy] = useTransition();

  const inStock = product.stock > 0;
  const busy = adding || buying;
  const tier = tierFor(product.wholesaleOptions, qty);
  const unitPrice = tier?.price ?? product.price;
  const total = unitPrice * qty;

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
        const res = await AddToCartAction(storeSlug, product.id, Object.keys(features).length ? features : undefined, qty);
        if (!res?.success) {
          rqToast.error(res && "message" in res && res.message ? res.message : "حصلت مشكلة، حاول تاني");
          return;
        }
        notifyCartUpdated();
        if (then) {
          then();
        } else {
          rqToast.success(qty > 1 ? `اتضاف ${num(qty)} قطع للسلة` : "اتضاف للسلة", {
            description: product.name,
            action: { label: "السلة", onClick: () => router.push(storeHref(storeSlug, "/cart")) },
          });
        }
      } catch {
        rqToast.error("حصلت مشكلة، حاول تاني");
      }
    });
  };

  // Checkout is dynamic (reads the cart cookie), so a plain push is enough.
  const buyNow = () => add(() => router.push(storeHref(storeSlug, "/checkout")));

  const choose = (key: OptionKey, value: string) => {
    setSelected((s) => ({ ...s, [key]: s[key] === value ? null : value }));
    setMissing((m) => m.filter((k) => k !== key));
  };

  if (!inStock) {
    return (
      <div className="border border-(--rq-ink) p-5">
        <p className="rq-h3">الكمية خلصت حاليًا</p>
        <p className="rq-small mt-1 text-(--rq-quiet)">شوف منتجات قريبة منه تحت، أو كلّم المتجر يعرّفك أول ما يرجع.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
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

      {product.wholesaleOptions && product.wholesaleOptions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">اشتري كمية ووفّر</p>
          <ul className="border-t border-(--rq-ink)">
            {product.wholesaleOptions.map((t) => {
              const on = tier === t;
              return (
                <li key={t.minQty} className="border-b border-(--rq-rule)">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setQty(Math.min(product.stock, t.minQty))}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between gap-3 px-1 text-sm transition-colors",
                      on ? "font-semibold text-(--rq-accent)" : "hover:text-(--rq-accent)",
                    )}
                  >
                    <span>{t.maxQty ? `${num(t.minQty)}–${num(t.maxQty)} قطعة` : `${num(t.minQty)}+ قطعة`}</span>
                    <span className="rq-price">{formatPrice(t.price)} للقطعة</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">الكمية</span>
        <div className="flex items-center border border-(--rq-rule-strong)">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || busy}
            aria-label="تقليل الكمية"
            className="grid size-12 place-items-center transition-colors hover:bg-(--rq-sheet) disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <output aria-live="polite" aria-label="الكمية" className="rq-face w-12 text-center text-lg font-semibold tabular-nums">
            {num(qty)}
          </output>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={qty >= product.stock || busy}
            aria-label="زيادة الكمية"
            className="grid size-12 place-items-center transition-colors hover:bg-(--rq-sheet) disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={() => add()} disabled={busy} className={btn({ size: "lg", full: true, className: "hidden justify-between lg:flex" })}>
          <span className="flex items-center gap-2.5">
            {adding && <Loader2 className="animate-spin" />}
            أضف للسلة
          </span>
          <span className="rq-price">{formatPrice(total)}</span>
        </button>
        <button type="button" onClick={buyNow} disabled={busy} className={btn({ variant: "line", size: "lg", full: true })}>
          {buying && <Loader2 className="animate-spin" />}
          اشتري الآن
        </button>
      </div>

      {/* Purchase bar — always within thumb reach on phones/tablets */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-(--rq-ink) bg-(--rq-paper) lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="rq-wrap flex items-center gap-3 py-2.5">
          <span className="rq-plate relative size-12 shrink-0 overflow-hidden">
            <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-(--rq-quiet)">
              {qty > 1 ? `${num(qty)} × ` : ""}
              {product.name}
            </p>
            <p className="rq-price text-lg">{formatPrice(total)}</p>
          </div>
          <button type="button" onClick={() => add()} disabled={busy} className={btn({ size: "lg", className: "px-5" })}>
            {adding ? <Loader2 className="animate-spin" /> : <Plus />}
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
