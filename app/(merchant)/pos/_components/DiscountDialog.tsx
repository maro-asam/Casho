"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceDiscount } from "./PosTerminal";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentDiscount: InvoiceDiscount;
  subtotal: number;
  onApply: (discount: InvoiceDiscount) => void;
};

export default function DiscountDialog({ open, onOpenChange, currentDiscount, subtotal, onApply }: Props) {
  const [type, setType] = useState<"percentage" | "fixed">(currentDiscount?.type ?? "percentage");
  const [value, setValue] = useState(currentDiscount?.value?.toString() ?? "");

  const numVal = parseFloat(value || "0");

  const discountAmount =
    type === "percentage"
      ? Math.round(subtotal * (numVal / 100))
      : Math.min(Math.round(numVal * 100), subtotal);

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const handleApply = () => {
    if (numVal <= 0) {
      onApply(null);
      return;
    }
    if (type === "percentage" && numVal > 100) return;
    onApply({ type, value: numVal });
  };

  const quickPercentages = [5, 10, 15, 20, 25, 30, 50];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-4" />
            خصم الفاتورة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setType("percentage")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                type === "percentage" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              نسبة مئوية %
            </button>
            <button
              onClick={() => setType("fixed")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                type === "fixed" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              مبلغ ثابت ج
            </button>
          </div>

          {/* Quick percentages */}
          {type === "percentage" && (
            <div className="flex flex-wrap gap-1.5">
              {quickPercentages.map((p) => (
                <button
                  key={p}
                  onClick={() => setValue(p.toString())}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    value === p.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary hover:text-primary",
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          )}

          {/* Value input */}
          <div className="relative">
            <input
              type="number"
              min="0"
              max={type === "percentage" ? 100 : subtotal / 100}
              step={type === "percentage" ? "1" : "0.5"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "0" : "0.00"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              {type === "percentage" ? "%" : "ج"}
            </span>
          </div>

          {/* Preview */}
          {numVal > 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>قبل الخصم:</span>
                <span>{(subtotal / 100).toFixed(0)} ج</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>الخصم:</span>
                <span>−{(discountAmount / 100).toFixed(0)} ج</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>بعد الخصم:</span>
                <span className="text-primary">{(afterDiscount / 100).toFixed(0)} ج</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {currentDiscount && (
              <Button variant="outline" className="gap-1.5" onClick={() => onApply(null)}>
                <X className="size-3.5" />
                إزالة الخصم
              </Button>
            )}
            <Button className="flex-1" onClick={handleApply}>
              تطبيق الخصم
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
