"use client";

import { cn, formatPrice } from "@/lib/utils";
import { Package2 } from "lucide-react";

export type WholesaleTier = {
  minQty: number;
  maxQty?: number;
  price: number;
};

type Props = {
  tiers: WholesaleTier[];
  currentQty: number;
  regularPrice: number;
  boldStyle?: boolean;
};

function getActiveTierIndex(tiers: WholesaleTier[], qty: number): number {
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i];
    if (qty >= tier.minQty && (tier.maxQty === undefined || qty <= tier.maxQty)) {
      return i;
    }
  }
  return -1;
}

function formatRange(tier: WholesaleTier): string {
  if (tier.maxQty !== undefined) {
    return `${tier.minQty} – ${tier.maxQty} قطعة`;
  }
  return `${tier.minQty}+ قطعة`;
}

export default function WholesalePricingTable({ tiers, currentQty, regularPrice, boldStyle }: Props) {
  if (!tiers || tiers.length === 0) return null;

  const activeTierIdx = getActiveTierIndex(tiers, currentQty);
  const activeTier = activeTierIdx >= 0 ? tiers[activeTierIdx] : null;
  const savings = activeTier ? regularPrice - activeTier.price : 0;

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-2xl border p-4",
        boldStyle && "rounded-none border-x-0 border-b-0",
      )}
      style={{ borderColor: "var(--store-border)" }}
    >
      <div className="flex items-center gap-2">
        <Package2
          className="size-4 shrink-0"
          style={{ color: "var(--store-primary)" }}
        />
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            boldStyle && "text-[10px] font-black tracking-[0.25em]",
          )}
          style={{ color: "var(--store-primary)" }}
        >
          أسعار الجملة
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--store-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-xs text-muted-foreground"
              style={{ borderColor: "var(--store-border)", background: "var(--store-background)" }}
            >
              <th className="px-3 py-2 text-start font-medium">الكمية</th>
              <th className="px-3 py-2 text-start font-medium">السعر للقطعة</th>
              <th className="px-3 py-2 text-start font-medium">الوفر</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => {
              const isActive = i === activeTierIdx;
              const tierSavings = regularPrice - tier.price;
              const savingsPct = Math.round((tierSavings / regularPrice) * 100);

              return (
                <tr
                  key={i}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isActive && "font-semibold",
                  )}
                  style={{
                    borderColor: "var(--store-border)",
                    background: isActive ? "color-mix(in srgb, var(--store-primary) 10%, transparent)" : undefined,
                  }}
                >
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {isActive && (
                        <span
                          className="inline-block size-1.5 rounded-full"
                          style={{ background: "var(--store-primary)" }}
                        />
                      )}
                      {formatRange(tier)}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2.5 font-bold"
                    style={isActive ? { color: "var(--store-primary)" } : undefined}
                  >
                    {formatPrice(tier.price)}
                  </td>
                  <td className="px-3 py-2.5">
                    {tierSavings > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        وفّر {savingsPct}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeTier && savings > 0 && (
        <p className="text-xs font-medium" style={{ color: "var(--store-primary)" }}>
          ✓ أنت توفّر {formatPrice(savings)} لكل قطعة بالكمية الحالية
        </p>
      )}

      {!activeTier && tiers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          أضف {tiers[0].minQty} قطعة أو أكثر للحصول على سعر الجملة
        </p>
      )}
    </div>
  );
}
