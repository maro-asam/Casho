"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClockIcon } from "lucide-react";
import { OpenShiftAction, CloseShiftAction } from "@/actions/pos/shift.actions";

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
        setError(e instanceof Error ? e.message : "حدث خطأ");
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
        setError(e instanceof Error ? e.message : "حدث خطأ");
      }
    });
  };

  const openedAt = activeShift ? new Date(activeShift.openedAt) : null;
  const duration = openedAt ? Math.floor((now - openedAt.getTime()) / 60000) : 0;
  const expectedCash = activeShift
    ? activeShift.openingBalance + activeShift.totalSales
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClockIcon className="size-4" />
            {activeShift ? "إدارة الوردية" : "فتح وردية جديدة"}
          </DialogTitle>
        </DialogHeader>

        {!activeShift ? (
          /* Open Shift */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              الكاشير: <span className="font-medium text-foreground">{cashierName}</span>
            </p>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">رصيد الدرج الافتتاحي (ج)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">اتركه فارغاً إذا لم يكن هناك رصيد ابتدائي</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full" onClick={handleOpen} disabled={isPending}>
              {isPending ? "جاري الفتح..." : "فتح الوردية"}
            </Button>
          </div>
        ) : !confirmClose ? (
          /* Shift Info */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block ml-1.5" />
                وردية مفتوحة
              </Badge>
              <span className="text-xs text-muted-foreground">
                {openedAt?.toLocaleTimeString("ar-EG")} ({duration} دقيقة)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">رصيد الافتتاح</p>
                <p className="text-sm font-bold">{(activeShift.openingBalance / 100).toFixed(0)} ج</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-sm font-bold text-primary">{(activeShift.totalSales / 100).toFixed(0)} ج</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">الفواتير</p>
                <p className="text-sm font-bold">{activeShift.transactionCount}</p>
              </div>
            </div>

            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
              <span className="text-amber-700">النقدية المتوقعة: </span>
              <span className="font-bold text-amber-800">{(expectedCash / 100).toFixed(0)} ج</span>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                إغلاق النافذة
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setConfirmClose(true)}
              >
                إغلاق الوردية
              </Button>
            </div>
          </div>
        ) : (
          /* Close Shift */
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي المبيعات:</span>
                <span className="font-bold">{(activeShift.totalSales / 100).toFixed(0)} ج</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">النقدية المتوقعة في الدرج:</span>
                <span className="font-bold">{(expectedCash / 100).toFixed(0)} ج</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">النقدية الفعلية في الدرج (ج)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder={`${(expectedCash / 100).toFixed(0)}`}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {closingBalance && (
                <p className={`text-xs font-medium ${
                  parseFloat(closingBalance) * 100 >= expectedCash ? "text-emerald-600" : "text-destructive"
                }`}>
                  {parseFloat(closingBalance) * 100 >= expectedCash
                    ? `زيادة: +${((parseFloat(closingBalance) * 100 - expectedCash) / 100).toFixed(0)} ج`
                    : `عجز: −${((expectedCash - parseFloat(closingBalance) * 100) / 100).toFixed(0)} ج`
                  }
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmClose(false)}>
                رجوع
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleClose} disabled={isPending}>
                {isPending ? "جاري الإغلاق..." : "تأكيد إغلاق الوردية"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
