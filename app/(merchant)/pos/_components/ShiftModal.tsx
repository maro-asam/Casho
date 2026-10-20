"use client";

import { useState, useTransition } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { egpNumber } from "./pos-format";
import { Tile } from "./pos-ui";
import { OpenShiftAction, CloseShiftAction } from "@/actions/pos/shift.actions";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

type ActiveShift = {
  id: string;
  openingBalance: number;
  totalSales: number;
  transactionCount: number;
  openedAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeShift: ActiveShift | null;
  cashierName: string;
  onShiftOpened: (shift: ActiveShift) => void;
  onShiftClosed: () => void;
};

export default function ShiftModal({ open, onOpenChange, activeShift, cashierName, onShiftOpened, onShiftClosed }: Props) {
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const [confirmClose, setConfirmClose] = useState(false);
  const [now] = useState(() => Date.now());

  const handleOpen = () => {
    setError(null);
    start(async () => {
      try {
        const val = parseFloat(openingBalance || "0");
        const shift = await OpenShiftAction(val);
        onShiftOpened({
          id: shift.id,
          openingBalance: shift.openingBalance,
          totalSales: shift.totalSales,
          transactionCount: shift.transactionCount,
          openedAt: shift.openedAt.toISOString(),
        });
        setOpeningBalance("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : tr("حدث خطأ"));
      }
    });
  };

  const handleClose = () => {
    if (!activeShift) return;
    setError(null);
    start(async () => {
      try {
        await CloseShiftAction({
          shiftId: activeShift.id,
          closingBalance: parseFloat(closingBalance || "0"),
          notes: notes || undefined,
        });
        onShiftClosed();
        setClosingBalance("");
        setNotes("");
        setConfirmClose(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : tr("حدث خطأ"));
      }
    });
  };

  const openedAt = activeShift ? new Date(activeShift.openedAt) : null;
  const duration = openedAt ? Math.floor((now - openedAt.getTime()) / 60000) : 0;
  const expectedCash = activeShift ? activeShift.openingBalance + activeShift.totalSales : 0;
  const counted = closingBalance ? parseFloat(closingBalance) * 100 : null;
  const diff = counted === null ? null : counted - expectedCash;

  const money = (p: number) => tr("{0} ج", egpNumber(p));
  const amountRow = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string, autoFocus?: boolean) => (
    <label htmlFor={id} className="flex items-center gap-3 rounded-[14px] bg-card px-4">
      <span className="shrink-0 text-[15px]">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.5"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="h-14 min-w-0 flex-1 bg-transparent text-end text-[22px] font-semibold tabular-nums outline-none placeholder:text-(--label-3)"
      />
      <span className="text-[15px] text-muted-foreground">{tr("ج.م")}</span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-ui max-w-md gap-0 bg-background p-0 text-foreground" dir={tdir()}>
        <DialogHeader className="items-center gap-1.5 px-6 pt-7 pb-4 text-center sm:text-center">
          <Tile icon={Clock} tint={activeShift ? "bg-(--sys-green)" : "bg-primary"} size="md" />
          <DialogTitle className="pt-1">{activeShift ? tr("إدارة الوردية") : tr("فتح وردية جديدة")}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {activeShift ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-(--sys-green)" />
                {tr("وردية مفتوحة")} · {tr("{0} ({1} دقيقة)", openedAt?.toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" }), duration)}
              </span>
            ) : (
              <>
                {tr("الكاشير:")} <span className="font-medium text-foreground">{cashierName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-5">
          {!activeShift ? (
            /* Open shift */
            <>
              <div className="space-y-2">
                {amountRow("opening-balance", tr("رصيد الدرج الافتتاحي (ج)"), openingBalance, setOpeningBalance, "0", true)}
                <p className="px-4 text-[13px] text-muted-foreground">{tr("اتركه فارغاً إذا لم يكن هناك رصيد ابتدائي")}</p>
              </div>
              {error && <p className="px-1 text-[13px] text-(--sys-red)">{error}</p>}
              <button
                type="button"
                onClick={handleOpen}
                disabled={isPending}
                className="apple-press flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary text-[17px] font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? tr("جاري الفتح...") : tr("فتح الوردية")}
              </button>
            </>
          ) : !confirmClose ? (
            /* Shift info */
            <>
              <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[14px] bg-border/60">
                {[
                  { label: tr("رصيد الافتتاح"), value: money(activeShift.openingBalance) },
                  { label: tr("إجمالي المبيعات"), value: money(activeShift.totalSales) },
                  { label: tr("الفواتير"), value: String(activeShift.transactionCount) },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col-reverse bg-card px-3 py-3 text-center">
                    <dt className="text-[12px] text-muted-foreground">{m.label}</dt>
                    <dd className="text-[20px] leading-7 font-bold tabular-nums">{m.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between rounded-[14px] bg-card px-4 py-3">
                <span className="text-[15px]">{tr("النقدية المتوقعة:")}</span>
                <span className="text-[20px] font-bold tabular-nums">{money(expectedCash)}</span>
              </div>
              {error && <p className="px-1 text-[13px] text-(--sys-red)">{error}</p>}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="apple-press h-[50px] w-full rounded-full bg-primary text-[17px] font-semibold text-primary-foreground"
                >
                  {tr("كمّل البيع")}
                </button>
                <button type="button" onClick={() => setConfirmClose(true)} className="h-11 w-full rounded-full text-[15px] text-(--sys-red) hover:bg-(--sys-red)/8">
                  {tr("إغلاق الوردية")}
                </button>
              </div>
            </>
          ) : (
            /* Close shift: count the drawer */
            <>
              <dl className="apple-rows overflow-hidden rounded-[14px] bg-card text-[15px] [--row-inset:16px]">
                <div className="flex min-h-11 items-center justify-between px-4">
                  <dt>{tr("إجمالي المبيعات:")}</dt>
                  <dd className="tabular-nums">{money(activeShift.totalSales)}</dd>
                </div>
                <div className="flex min-h-11 items-center justify-between px-4">
                  <dt>{tr("النقدية المتوقعة في الدرج:")}</dt>
                  <dd className="font-semibold tabular-nums">{money(expectedCash)}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                {amountRow("closing-balance", tr("النقدية الفعلية في الدرج (ج)"), closingBalance, setClosingBalance, egpNumber(expectedCash), true)}
                {diff !== null && (
                  <p className={cn("px-4 text-[13px] font-semibold tabular-nums", diff >= 0 ? "text-(--sys-green)" : "text-(--sys-red)")}>
                    {diff >= 0 ? tr("زيادة: +{0} ج", egpNumber(diff)) : tr("عجز: −{0} ج", egpNumber(-diff))}
                  </p>
                )}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={tr("ملاحظات (اختياري)")}
                aria-label={tr("ملاحظات (اختياري)")}
                className="w-full resize-none rounded-[14px] bg-card px-4 py-3 text-[15px] outline-none placeholder:text-(--label-3) focus-visible:ring-2 focus-visible:ring-ring"
              />

              {error && <p className="px-1 text-[13px] text-(--sys-red)">{error}</p>}

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="apple-press flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-(--sys-red) text-[17px] font-semibold text-white disabled:opacity-60"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? tr("جاري الإغلاق...") : tr("تأكيد إغلاق الوردية")}
                </button>
                <button type="button" onClick={() => setConfirmClose(false)} className="h-11 w-full rounded-full text-[15px] text-primary hover:bg-primary/8">
                  {tr("رجوع")}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
