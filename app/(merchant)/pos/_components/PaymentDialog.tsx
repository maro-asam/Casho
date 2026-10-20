"use client";

import { useState } from "react";
import { Check, Loader2, Minus, Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { egp, egpNumber } from "./pos-format";
import { PAYMENT_META, Tile } from "./pos-ui";
import { tdir, tr } from "@/lib/i18n/dashboard";

export type PaymentEntry = { paymentMethod: string; amount: number; reference?: string };

const METHOD_KEYS = ["cash", "card", "vodafone_cash", "instapay", "bank_transfer"] as const;

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
  const METHODS = METHOD_KEYS.map((key) => ({ key, label: PAYMENT_META[key].label() }));
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
        setError(tr("ناقص {0}", egp(short)));
        return;
      }
      onConfirm([{ paymentMethod: method, amount: total, reference: reference.trim() || undefined }]);
      return;
    }

    const payments = entries
      .map((e) => ({ paymentMethod: e.paymentMethod, amount: toPiasters(e.amount), reference: e.reference.trim() || undefined }))
      .filter((p) => p.amount > 0);

    if (splitRemaining > 0) {
      setError(tr("لسه ناقص {0}", egp(splitRemaining)));
      return;
    }
    if (splitChange > 0) {
      // Extra can only be cash change — take it off a cash line.
      const cash = payments.find((p) => p.paymentMethod === "cash" && p.amount >= splitChange);
      if (!cash) {
        setError(tr("المبلغ الزيادة لازم يكون من الكاش عشان يرجع فكة."));
        return;
      }
      cash.amount -= splitChange;
    }
    onConfirm(payments.filter((p) => p.amount > 0));
  }

  const setEntry = (i: number, patch: Partial<(typeof entries)[number]>) =>
    setEntries((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const field = "h-11 rounded-[10px] bg-(--fill-3) px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-ui max-h-[94vh] max-w-md gap-0 overflow-y-auto bg-background p-0 text-foreground" dir={tdir()}>
        <DialogHeader className="items-center gap-0 px-6 pt-7 pb-5 text-center sm:text-center">
          <DialogTitle className="text-[13px] font-semibold text-muted-foreground">{tr("الدفع")}</DialogTitle>
          <DialogDescription className="sr-only">{tr("اختار طريقة الدفع وأكّد البيع")}</DialogDescription>
          <p className="pt-1 text-[44px] leading-[52px] font-bold tabular-nums ltr:tracking-[-0.02em]">{egp(total)}</p>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-5 px-4 pb-5"
        >
          {!split ? (
            <>
              <div role="radiogroup" aria-label={tr("طريقة الدفع")} className="grid grid-cols-3 gap-2">
                {METHODS.map(({ key, label }) => {
                  const meta = PAYMENT_META[key];
                  const active = method === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setMethod(key);
                        setError(undefined);
                      }}
                      className={cn(
                        "apple-press relative flex flex-col items-center gap-2 rounded-[14px] bg-card px-2 pt-3.5 pb-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active && "ring-2 ring-primary",
                      )}
                    >
                      <Tile icon={meta.icon} tint={meta.tint} />
                      {label}
                      {active && (
                        <span className="absolute inset-e-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSplit(true)}
                  className="apple-press flex flex-col items-center gap-2 rounded-[14px] bg-card px-2 pt-3.5 pb-3 text-[13px] font-medium text-primary"
                >
                  <Tile icon={PAYMENT_META.split.icon} tint={PAYMENT_META.split.tint} />
                  {tr("تقسيم الدفع")}
                </button>
              </div>

              {method === "cash" ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-[14px] bg-card">
                    <label htmlFor="pos-received" className="flex items-center gap-3 px-4">
                      <span className="shrink-0 text-[15px]">{tr("المبلغ اللي استلمته")}</span>
                      <input
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
                        className="h-14 min-w-0 flex-1 bg-transparent text-end text-[22px] font-semibold tabular-nums outline-none placeholder:text-(--label-3)"
                      />
                      <span className="text-[15px] text-muted-foreground">{tr("ج.م")}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickCashAmounts(total).map((amount, i) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setReceived(String(amount))}
                        className={cn(
                          "apple-press h-9 rounded-full px-4 text-[15px] font-medium tabular-nums",
                          receivedPiasters === Math.round(amount * 100) && received ? "bg-primary text-primary-foreground" : "bg-card",
                        )}
                      >
                        {i === 0 ? tr("المبلغ بالظبط") : egpNumber(amount * 100)}
                      </button>
                    ))}
                  </div>
                  <div
                    className={cn("flex items-center justify-between rounded-[14px] px-4 py-3", short > 0 ? "bg-(--sys-red)/10" : "bg-(--sys-green)/12")}
                    aria-live="polite"
                  >
                    <span className="text-[15px] font-medium">{short > 0 ? tr("ناقص") : tr("الباقي للعميل")}</span>
                    <span className={cn("text-[28px] font-bold tabular-nums", short > 0 ? "text-(--sys-red)" : "text-(--sys-green)")}>
                      {egp(short > 0 ? short : change)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[14px] bg-card">
                  <label htmlFor="pos-reference" className="flex items-center gap-3 px-4">
                    <span className="shrink-0 text-[15px]">{tr("رقم العملية")}</span>
                    <input
                      id="pos-reference"
                      autoFocus
                      dir="ltr"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={tr("آخر ٤ أرقام أو رقم التحويل")}
                      className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-(--label-3) rtl:text-left"
                    />
                  </label>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end justify-between px-4">
                <p className="text-[13px] font-semibold text-muted-foreground">{tr("تقسيم على أكتر من طريقة")}</p>
                <button type="button" onClick={() => setSplit(false)} className="text-[13px] font-semibold text-primary">
                  {tr("رجوع لطريقة واحدة")}
                </button>
              </div>
              <ul className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
                {entries.map((entry, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2">
                    <select
                      value={entry.paymentMethod}
                      onChange={(e) => setEntry(i, { paymentMethod: e.target.value })}
                      aria-label={tr("طريقة الدفع")}
                      className={cn(field, "w-36 shrink-0")}
                    >
                      {METHODS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <input
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
                      aria-label={tr("المبلغ")}
                      className={cn(field, "min-w-0 flex-1 text-end tabular-nums")}
                    />
                    {entries.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setEntries((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={tr("شيل")}
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-(--sys-red) text-white"
                      >
                        <Minus className="size-3.5" strokeWidth={3} />
                      </button>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setEntries((prev) => [...prev, { paymentMethod: "cash", amount: "", reference: "" }])}
                    className="flex h-11 w-full items-center gap-2 px-4 text-[15px] text-primary hover:bg-(--fill-3)/50"
                  >
                    <span className="grid size-5 place-items-center rounded-full bg-(--sys-green) text-white">
                      <Plus className="size-3.5" strokeWidth={3} />
                    </span>
                    {tr("طريقة كمان")}
                  </button>
                </li>
              </ul>
              <dl className="apple-rows overflow-hidden rounded-[14px] bg-card text-[15px] [--row-inset:16px]" aria-live="polite">
                <div className="flex min-h-11 items-center justify-between px-4">
                  <dt>{tr("المدفوع")}</dt>
                  <dd className="font-medium tabular-nums">{egp(splitPaid)}</dd>
                </div>
                <div className="flex min-h-11 items-center justify-between px-4">
                  <dt>{splitChange > 0 ? tr("الباقي للعميل") : tr("المتبقي")}</dt>
                  <dd className={cn("font-bold tabular-nums", splitRemaining > 0 ? "text-(--sys-red)" : "text-(--sys-green)")}>
                    {egp(splitChange > 0 ? splitChange : splitRemaining)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {error && (
            <p role="alert" className="px-1 text-[13px] font-medium text-(--sys-red)">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="apple-press flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-primary text-[17px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-5 animate-spin" />}
            {loading ? tr("جاري الحفظ...") : tr("تأكيد البيع")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
