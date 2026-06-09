"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banknote, CreditCard, Plus, Smartphone, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentEntry = { paymentMethod: string; amount: number; reference?: string };

type PaymentMethodDef = { key: string; label: string; icon: React.ComponentType<{ className?: string }> };

const METHODS: PaymentMethodDef[] = [
  { key: "cash", label: "نقداً", icon: Banknote },
  { key: "card", label: "بطاقة", icon: CreditCard },
  { key: "vodafone_cash", label: "فودافون كاش", icon: Smartphone },
  { key: "instapay", label: "انستاباي", icon: Wallet },
  { key: "bank_transfer", label: "تحويل بنكي", icon: Banknote },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  loading?: boolean;
};

function egp(p: number) {
  return (p / 100).toFixed(2);
}

export default function SplitPaymentDialog({ open, onOpenChange, total, onConfirm, loading }: Props) {
  const [entries, setEntries] = useState<PaymentEntry[]>([{ paymentMethod: "cash", amount: total }]);
  const [error, setError] = useState<string | null>(null);

  const totalPaid = entries.reduce((s, e) => s + e.amount, 0);
  const remaining = total - totalPaid;
  const change = Math.max(0, totalPaid - total);
  const isComplete = totalPaid >= total;

  const updateEntry = (idx: number, key: keyof PaymentEntry, val: string | number) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [key]: val } : e)));
    setError(null);
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { paymentMethod: "card", amount: Math.max(0, remaining) },
    ]);
  };

  const removeEntry = (idx: number) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFullCash = () => {
    setEntries([{ paymentMethod: "cash", amount: total }]);
  };

  const handleConfirm = () => {
    setError(null);
    if (!isComplete) {
      setError(`يتبقى ${egp(remaining)} ج لم يتم تغطيتها`);
      return;
    }
    onConfirm(entries);
  };

  // Reset when reopened
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setEntries([{ paymentMethod: "cash", amount: total }]);
      setError(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحصيل الدفعة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-lg bg-primary/10 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">الإجمالي المطلوب</p>
            <p className="text-3xl font-bold text-primary">{egp(total)} ج</p>
          </div>

          {/* Quick cash button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleFullCash}
          >
            <Banknote className="size-4" />
            دفع نقداً كامل ({egp(total)} ج)
          </Button>

          {/* Payment entries */}
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const Method = METHODS.find((m) => m.key === entry.paymentMethod)!;
              return (
                <div key={idx} className="flex items-center gap-2">
                  {/* Method select */}
                  <select
                    value={entry.paymentMethod}
                    onChange={(e) => updateEntry(idx, "paymentMethod", e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {METHODS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>

                  {/* Amount */}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={entry.amount / 100}
                    onChange={(e) =>
                      updateEntry(idx, "amount", Math.round(parseFloat(e.target.value || "0") * 100))
                    }
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">ج</span>

                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(idx)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add split */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground"
            onClick={addEntry}
          >
            <Plus className="size-3" />
            إضافة طريقة دفع أخرى (تقسيم)
          </Button>

          {/* Summary */}
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي مدفوع:</span>
              <span className={cn("font-medium", isComplete ? "text-emerald-600" : "text-destructive")}>
                {egp(totalPaid)} ج
              </span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">متبقي:</span>
                <span className="font-bold text-destructive">{egp(remaining)} ج</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الباقي (فكة):</span>
                <span className="font-bold text-emerald-600">{egp(change)} ج</span>
              </div>
            )}
          </div>

          {change > 0 && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
              <p className="text-xs text-emerald-700">أعد للعميل</p>
              <p className="text-2xl font-bold text-emerald-600">{egp(change)} ج</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            className="w-full h-11 text-base font-bold gap-2"
            onClick={handleConfirm}
            disabled={!isComplete || loading}
          >
            {loading ? "جاري الحفظ..." : "تأكيد البيع ✓"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
