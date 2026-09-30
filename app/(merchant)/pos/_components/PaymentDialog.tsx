"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, Loader2, Plus, Smartphone, Split, Trash2, Wallet, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { egp, egpNumber } from "./pos-format";

export type PaymentEntry = { paymentMethod: string; amount: number; reference?: string };

const METHODS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "cash", label: "كاش", icon: Banknote },
  { key: "card", label: "فيزا / بطاقة", icon: CreditCard },
  { key: "vodafone_cash", label: "فودافون كاش", icon: Smartphone },
  { key: "instapay", label: "إنستاباي", icon: Wallet },
  { key: "bank_transfer", label: "تحويل بنكي", icon: Landmark },
];

const toPiasters = (value: string) => {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? 0 : Math.round(n * 100);
};

/** Exact amount + the bills a customer is likely to hand over. */
function quickCashAmounts(total: number) {
  const pounds = total / 100;
  const options = new Set<number>([pounds]);
  for (const step of [50, 100, 200, 500]) {
    const rounded = Math.ceil(pounds / step) * step;
    if (rounded > pounds) options.add(rounded);
  }
  return [...options].slice(0, 5);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Piasters. */
  total: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  loading?: boolean;
};

/**
 * Collects payment. Change handed back is never recorded as revenue: cash is
 * saved as the amount due, so the shift's expected cash stays correct.
 */
export default function PaymentDialog(props: Props) {
  // Remount on every open so each sale starts clean.
  return props.open ? <PaymentDialogBody key={props.total} {...props} /> : null;
}

function PaymentDialogBody({ open, onOpenChange, total, onConfirm, loading }: Props) {
  const [split, setSplit] = useState(false);
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [reference, setReference] = useState("");
  const [entries, setEntries] = useState<{ paymentMethod: string; amount: string; reference: string }[]>([
    { paymentMethod: "cash", amount: "", reference: "" },
    { paymentMethod: "card", amount: "", reference: "" },
  ]);
  const [error, setError] = useState<string>();

  // ── Single method ─────────────────────────────────────────────
  const receivedPiasters = received ? toPiasters(received) : total;
  const change = method === "cash" ? Math.max(0, receivedPiasters - total) : 0;
  const short = method === "cash" ? Math.max(0, total - receivedPiasters) : 0;

  // ── Split ─────────────────────────────────────────────────────
  const splitPaid = entries.reduce((sum, e) => sum + toPiasters(e.amount), 0);
  const splitRemaining = Math.max(0, total - splitPaid);
  const splitChange = Math.max(0, splitPaid - total);

  function confirm() {
    setError(undefined);

    if (!split) {
      if (short > 0) {
        setError(`ناقص ${egp(short)}`);
        return;
      }
      onConfirm([{ paymentMethod: method, amount: total, reference: reference.trim() || undefined }]);
      return;
    }

    const payments = entries
      .map((e) => ({ paymentMethod: e.paymentMethod, amount: toPiasters(e.amount), reference: e.reference.trim() || undefined }))
      .filter((p) => p.amount > 0);

    if (splitRemaining > 0) {
      setError(`لسه ناقص ${egp(splitRemaining)}`);
      return;
    }
    if (splitChange > 0) {
      // Extra can only be cash change — take it off a cash line.
      const cash = payments.find((p) => p.paymentMethod === "cash" && p.amount >= splitChange);
      if (!cash) {
        setError("المبلغ الزيادة لازم يكون من الكاش عشان يرجع فكة.");
        return;
      }
      cash.amount -= splitChange;
    }
    onConfirm(payments.filter((p) => p.amount > 0));
  }

  const setEntry = (i: number, patch: Partial<(typeof entries)[number]>) =>
    setEntries((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0" dir="rtl">
        <DialogHeader className="border-b border-border p-5 text-start">
          <DialogTitle>الدفع</DialogTitle>
          <DialogDescription className="sr-only">اختار طريقة الدفع وأكّد البيع</DialogDescription>
          <p className="pt-2 text-3xl font-bold tracking-tight tabular-nums">{egp(total)}</p>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-5 p-5"
        >
          {!split ? (
            <>
              <div role="radiogroup" aria-label="طريقة الدفع" className="grid grid-cols-3 gap-2">
                {METHODS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={method === key}
                    onClick={() => {
                      setMethod(key);
                      setError(undefined);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      method === key ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className={cn("size-5", method === key && "text-primary")} />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSplit(true)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Split className="size-5" />
                  تقسيم الدفع
                </button>
              </div>

              {method === "cash" ? (
                <div className="space-y-3">
                  <label htmlFor="pos-received" className="text-sm font-medium">
                    المبلغ اللي استلمته
                  </label>
                  <div className="relative">
                    <Input
                      id="pos-received"
                      autoFocus
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={received}
                      onChange={(e) => {
                        setReceived(e.target.value);
                        setError(undefined);
                      }}
                      placeholder={egpNumber(total)}
                      className="h-12 pe-12 text-lg font-semibold tabular-nums"
                    />
                    <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ج.م
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickCashAmounts(total).map((amount, i) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 tabular-nums"
                        onClick={() => setReceived(String(amount))}
                      >
                        {i === 0 ? "المبلغ بالظبط" : egpNumber(amount * 100)}
                      </Button>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-4 py-3",
                      short > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    )}
                    aria-live="polite"
                  >
                    <span className="text-sm font-medium">{short > 0 ? "ناقص" : "الباقي للعميل"}</span>
                    <span className="text-2xl font-bold tabular-nums">{egp(short > 0 ? short : change)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="pos-reference" className="text-sm font-medium">
                    رقم العملية <span className="text-xs font-normal text-muted-foreground">(اختياري)</span>
                  </label>
                  <Input
                    id="pos-reference"
                    autoFocus
                    dir="ltr"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="آخر ٤ أرقام أو رقم التحويل"
                    className="h-10"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">تقسيم على أكتر من طريقة</p>
                <button type="button" onClick={() => setSplit(false)} className="text-xs text-primary hover:underline">
                  رجوع لطريقة واحدة
                </button>
              </div>
              {entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={entry.paymentMethod}
                    onChange={(e) => setEntry(i, { paymentMethod: e.target.value })}
                    aria-label="طريقة الدفع"
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {METHODS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={entry.amount}
                    onChange={(e) => setEntry(i, { amount: e.target.value })}
                    onFocus={() => {
                      if (!entry.amount && splitRemaining > 0) setEntry(i, { amount: String(splitRemaining / 100) });
                    }}
                    placeholder="0"
                    aria-label="المبلغ"
                    className="h-10 flex-1 tabular-nums"
                  />
                  {entries.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground"
                      onClick={() => setEntries((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="شيل"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setEntries((prev) => [...prev, { paymentMethod: "cash", amount: "", reference: "" }])}
              >
                <Plus className="size-4" />
                طريقة كمان
              </Button>
              <dl className="space-y-1 rounded-lg bg-muted/50 px-4 py-3 text-sm" aria-live="polite">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">المدفوع</dt>
                  <dd className="font-medium tabular-nums">{egp(splitPaid)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{splitChange > 0 ? "الباقي للعميل" : "المتبقي"}</dt>
                  <dd className={cn("font-bold tabular-nums", splitRemaining > 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400")}>
                    {egp(splitChange > 0 ? splitChange : splitRemaining)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base font-semibold" disabled={loading}>
            {loading && <Loader2 className="size-5 animate-spin" />}
            {loading ? "جاري الحفظ..." : "تأكيد البيع"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
