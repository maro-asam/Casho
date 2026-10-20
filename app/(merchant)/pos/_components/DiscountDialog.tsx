"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SegmentedButtons } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import type { InvoiceDiscount } from "./PosTerminal";
import { egp } from "./pos-format";
import { Tile } from "./pos-ui";
import { tdir, tr } from "@/lib/i18n/dashboard";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentDiscount: InvoiceDiscount;
  subtotal: number;
  onApply: (discount: InvoiceDiscount) => void;
};

const QUICK = [5, 10, 15, 20, 25, 30, 50];

export default function DiscountDialog({ open, onOpenChange, currentDiscount, subtotal, onApply }: Props) {
  const [type, setType] = useState<"percentage" | "fixed">(currentDiscount?.type ?? "percentage");
  const [value, setValue] = useState(currentDiscount?.value?.toString() ?? "");

  const numVal = parseFloat(value || "0");
  const discountAmount = type === "percentage" ? Math.round(subtotal * (numVal / 100)) : Math.min(Math.round(numVal * 100), subtotal);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const invalid = type === "percentage" && numVal > 100;

  const handleApply = () => {
    if (numVal <= 0) {
      onApply(null);
      return;
    }
    if (invalid) return;
    onApply({ type, value: numVal });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-ui max-w-sm gap-0 bg-background p-0 text-foreground" dir={tdir()}>
        <DialogHeader className="items-center gap-1.5 px-6 pt-7 pb-4 text-center sm:text-center">
          <Tile icon={Tag} tint="bg-(--sys-green)" size="md" />
          <DialogTitle className="pt-1">{tr("خصم الفاتورة")}</DialogTitle>
          <DialogDescription className="text-[13px]">{tr("قبل الخصم:")} {egp(subtotal)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5">
          <SegmentedButtons
            label={tr("خصم الفاتورة")}
            value={type}
            onChange={setType}
            options={[
              ["percentage", tr("نسبة مئوية %")],
              ["fixed", tr("مبلغ ثابت ج")],
            ]}
            className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
          />

          <div className="relative rounded-[16px] bg-card">
            <input
              type="number"
              min="0"
              max={type === "percentage" ? 100 : subtotal / 100}
              step={type === "percentage" ? "1" : "0.5"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              aria-label={tr("خصم الفاتورة")}
              aria-invalid={invalid || undefined}
              className="h-20 w-full bg-transparent px-14 text-center text-[40px] font-bold tabular-nums outline-none placeholder:text-(--label-3)"
              autoFocus
            />
            <span className="pointer-events-none absolute inset-e-5 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">
              {type === "percentage" ? "%" : tr("ج")}
            </span>
          </div>

          {type === "percentage" && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {QUICK.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue(p.toString())}
                  className={cn(
                    "apple-press h-8 rounded-full px-3.5 text-[13px] font-semibold tabular-nums",
                    value === p.toString() ? "bg-primary text-primary-foreground" : "bg-card text-foreground/80 hover:text-foreground",
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          )}

          {numVal > 0 && !invalid && (
            <dl className="apple-rows overflow-hidden rounded-[14px] bg-card text-[15px] [--row-inset:16px]">
              <div className="flex min-h-11 items-center justify-between px-4">
                <dt>{tr("الخصم:")}</dt>
                <dd className="text-(--sys-green) tabular-nums">−{egp(discountAmount)}</dd>
              </div>
              <div className="flex min-h-11 items-center justify-between px-4">
                <dt className="font-semibold">{tr("بعد الخصم:")}</dt>
                <dd className="font-bold tabular-nums">{egp(afterDiscount)}</dd>
              </div>
            </dl>
          )}

          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={handleApply}
              disabled={invalid}
              className="apple-press h-[50px] w-full rounded-full bg-primary text-[17px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {tr("تطبيق الخصم")}
            </button>
            {currentDiscount && (
              <button type="button" onClick={() => onApply(null)} className="h-11 w-full rounded-full text-[15px] text-(--sys-red) hover:bg-(--sys-red)/8">
                {tr("إزالة الخصم")}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
