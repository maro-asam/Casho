"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type WholesaleTier = {
  minQty: number;
  maxQty?: number;
  price: number;
};

type Props = {
  initialTiers?: WholesaleTier[];
};

export default function WholesaleInput({ initialTiers = [] }: Props) {
  const [enabled, setEnabled] = useState(initialTiers.length > 0);
  const [tiers, setTiers] = useState<WholesaleTier[]>(
    initialTiers.length > 0
      ? initialTiers
      : [{ minQty: 10, price: 0 }],
  );

  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier ? (lastTier.maxQty ? lastTier.maxQty + 1 : lastTier.minQty + 10) : 10;
    setTiers((prev) => [...prev, { minQty: nextMin, price: 0 }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof WholesaleTier, value: string) {
    setTiers((prev) =>
      prev.map((tier, i) => {
        if (i !== index) return tier;
        const num = Number(value);
        if (field === "maxQty") {
          return { ...tier, maxQty: value === "" ? undefined : isNaN(num) ? undefined : num };
        }
        return { ...tier, [field]: isNaN(num) ? 0 : num };
      }),
    );
  }

  const serialized = enabled && tiers.length > 0 ? JSON.stringify(tiers) : "[]";

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3">
        <div
          role="checkbox"
          aria-checked={enabled}
          tabIndex={0}
          onClick={() => setEnabled((v) => !v)}
          onKeyDown={(e) => e.key === " " && setEnabled((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0.5 rtl:-translate-x-0.5"
            }`}
          />
        </div>
        <span className="text-sm font-medium">تفعيل أسعار الجملة</span>
      </label>

      {enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
            <span>الحد الأدنى للكمية</span>
            <span>الحد الأقصى (اختياري)</span>
            <span>السعر للقطعة (ج.م)</span>
            <span />
          </div>

          {tiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={tier.minQty}
                  onChange={(e) => updateTier(i, "minQty", e.target.value)}
                  placeholder="10"
                  className="rounded-xl pe-8 text-sm"
                />
                <span className="pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  قطعة
                </span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min={tier.minQty + 1}
                  step={1}
                  value={tier.maxQty ?? ""}
                  onChange={(e) => updateTier(i, "maxQty", e.target.value)}
                  placeholder="∞"
                  className="rounded-xl pe-8 text-sm"
                />
                <span className="pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  قطعة
                </span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={tier.price || ""}
                  onChange={(e) => updateTier(i, "price", e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl pe-10 text-sm"
                  required={enabled}
                />
                <span className="pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ج.م
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => removeTier(i)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTier}
            className="w-full rounded-xl gap-1.5"
          >
            <Plus className="size-3.5" />
            إضافة شريحة سعرية
          </Button>

          <p className="text-xs text-muted-foreground">
            مثال: 10-49 قطعة بسعر 45 ج.م، و50+ قطعة بسعر 38 ج.م
          </p>
        </div>
      )}

      <input type="hidden" name="wholesaleOptions" value={serialized} />
    </div>
  );
}
