"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";

import type { StorefrontOffer } from "@/lib/offers/storefront-offers";
import { cn, formatPrice } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
//  Offer UI shared by the post-add modal (OfferHost) and the cart strip
//  (CartOffers). Theme-agnostic: colors come from the store theme vars, with
//  neutral fallbacks, like the popups.
// ─────────────────────────────────────────────────────────────────────────────

export const OFFER_VARS = {
  "--of-bg": "var(--store-card, #ffffff)",
  "--of-fg": "var(--store-card-foreground, #0a0a0a)",
  "--of-muted": "var(--store-muted-foreground, #6b7280)",
  "--of-soft": "var(--store-muted, #f4f4f5)",
  "--of-border": "var(--store-border, #e4e4e7)",
  "--of-accent": "var(--store-primary, #111827)",
  "--of-accent-fg": "var(--store-primary-foreground, #ffffff)",
} as CSSProperties;

export function OfferPrice({ offer, className }: { offer: StorefrontOffer; className?: string }) {
  const { price, offerPrice } = offer.product;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span className="text-base font-bold">{formatPrice(offerPrice)}</span>
      {offerPrice < price && <span className="text-xs font-normal text-(--of-muted) line-through">{formatPrice(price)}</span>}
      {offer.discountLabel && (
        <span className="rounded-full bg-(--of-accent) px-2 py-0.5 text-[11px] font-semibold text-(--of-accent-fg)">{offer.discountLabel}</span>
      )}
    </p>
  );
}

function Chips({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "min-h-8 rounded-full border px-3 text-xs font-medium transition-colors",
            value === v ? "border-(--of-accent) bg-(--of-accent) text-(--of-accent-fg)" : "border-(--of-border) hover:border-(--of-fg)",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

type OfferRowProps = {
  offer: StorefrontOffer;
  href: string;
  ctaLabel: string;
  pending?: boolean;
  done?: boolean;
  error?: string | null;
  /** Bigger image + full-width button (single-offer stages). */
  featured?: boolean;
  onAccept: (features: Record<string, string>) => void;
};

/** Product + price + (sizes/colors) + accept button. */
export function OfferRow({ offer, href, ctaLabel, pending, done, error, featured, onAccept }: OfferRowProps) {
  const { product } = offer;
  const [size, setSize] = useState<string | undefined>(product.sizes.length === 1 ? product.sizes[0] : undefined);
  const [color, setColor] = useState<string | undefined>(product.colors.length === 1 ? product.colors[0] : undefined);
  const missing = (product.sizes.length > 0 && !size) || (product.colors.length > 0 && !color);

  const accept = () => {
    if (missing || pending || done) return;
    onAccept({ ...(size && { size }), ...(color && { color }) });
  };

  const button = (
    <button
      type="button"
      onClick={accept}
      disabled={pending || done || missing}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-[0.6rem] px-4 text-sm font-semibold transition",
        done ? "bg-(--of-soft) text-(--of-fg)" : "bg-(--of-accent) text-(--of-accent-fg) hover:opacity-90",
        "disabled:cursor-not-allowed",
        missing && !done && "opacity-50",
        featured && "w-full min-h-11",
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" /> : null}
      <span className="font-semibold">{done ? "اتضاف" : ctaLabel}</span>
    </button>
  );

  return (
    <div className={cn("flex gap-3", featured && "flex-col sm:flex-row sm:items-start")}>
      <a
        href={href}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[0.6rem] bg-(--of-soft)",
          featured ? "aspect-square w-full sm:w-36" : "size-20",
        )}
      >
        <Image src={product.image} alt={product.name} fill sizes={featured ? "(max-width: 640px) 90vw, 144px" : "80px"} className="object-cover" />
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          <a href={href} className="line-clamp-2 text-sm font-semibold leading-snug hover:underline">
            {product.name}
          </a>
          <OfferPrice offer={offer} className="mt-1" />
        </div>
        {!done && product.sizes.length > 1 && <Chips label="المقاس" values={product.sizes} value={size} onChange={setSize} />}
        {!done && product.colors.length > 1 && <Chips label="اللون" values={product.colors} value={color} onChange={setColor} />}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className={cn(!featured && "mt-auto")}>{button}</div>
      </div>
    </div>
  );
}

/** Previews inside the dashboard (iframes) must not inflate the merchant's stats. */
export function isPreviewFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** sessionStorage flag (once per visit), tolerant of blocked storage. */
export function sessionOnce(key: string) {
  try {
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // blocked storage — show it anyway
  }
  return true;
}
