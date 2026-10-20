"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { tr } from "@/lib/i18n/dashboard";

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
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-background px-4 py-2">
        <span className="text-[15px]">{tr("تفعيل أسعار الجملة")}</span>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </label>

      {enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_2.25rem] gap-2 px-1 text-[12px] text-muted-foreground">
            <span>{tr("الحد الأدنى للكمية")}</span>
            <span>{tr("الحد الأقصى (اختياري)")}</span>
            <span>{tr("السعر للقطعة (ج.م)")}</span>
            <span />
          </div>

          {tiers.map((tier, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2.25rem] items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={tier.minQty}
                  onChange={(e) => updateTier(i, "minQty", e.target.value)}
                  placeholder="10"
                  className="pe-12 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                  {tr("قطعة")}
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
                  className="pe-12 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                  {tr("قطعة")}
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
                  className="pe-12 tabular-nums"
                  required={enabled}
                />
                <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                  {tr("ج.م")}
                </span>
              </div>

              <button
                type="button"
                aria-label={tr("حذف")}
                className="apple-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-(--sys-red)/10 hover:text-(--sys-red)"
                onClick={() => removeTier(i)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <button type="button" onClick={addTier} className={cn(appleButton.plain, "mx-0 -ms-2")}>
            <Plus className="size-4" strokeWidth={2.4} />
            {tr("إضافة شريحة سعرية")}
          </button>

          <p className="px-1 text-[12px] text-muted-foreground">
            {tr("مثال: 10-49 قطعة بسعر 45 ج.م، و50+ قطعة بسعر 38 ج.م")}
          </p>
        </div>
      )}

      <input type="hidden" name="wholesaleOptions" value={serialized} />
    </div>
  );
}
