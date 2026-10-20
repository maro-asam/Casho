"use client";

import { useEffect, useState, useTransition } from "react";
import { Pause, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GetHeldOrdersAction, ResumeHeldOrderAction, DeleteHeldOrderAction } from "@/actions/pos/pos.actions";
import type { HeldCartData } from "@/actions/pos/pos.actions";
import { egp } from "./pos-format";
import { Tile } from "./pos-ui";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

type HeldOrder = {
  id: string;
  label: string | null;
  itemCount: number;
  total: number;
  createdAt: Date;
  cashier: { name: string | null };
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onResume: (data: HeldCartData) => void;
  onCountChange: (count: number) => void;
};

export default function HeldOrdersDialog({ open, onOpenChange, onResume, onCountChange }: Props) {
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await GetHeldOrdersAction();
        if (!cancelled) {
          setOrders(data as HeldOrder[]);
          onCountChange(data.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleResume = (id: string) => {
    start(async () => {
      const data = await ResumeHeldOrderAction(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      onCountChange(orders.length - 1);
      onResume(data);
    });
  };

  const handleDelete = (id: string) => {
    start(async () => {
      await DeleteHeldOrderAction(id);
      const updated = orders.filter((o) => o.id !== id);
      setOrders(updated);
      onCountChange(updated.length);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-ui max-w-md gap-0 bg-background p-0 text-foreground" dir={tdir()}>
        <DialogHeader className="items-center gap-1.5 px-6 pt-7 pb-4 text-center sm:text-center">
          <Tile icon={Pause} tint="bg-(--sys-orange)" size="md" />
          <DialogTitle className="pt-1">{tr("الطلبات المعلقة ({0})", orders.length)}</DialogTitle>
          <DialogDescription className="text-[13px]">{tr("F2 يفتح القائمة دي في أي وقت.")}</DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-5">
          {loading ? (
            <div className="space-y-px overflow-hidden rounded-[14px]">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-card" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-[14px] bg-card py-10 text-center">
              <Pause className="mb-1 size-9 text-(--label-3)" strokeWidth={1.5} />
              <p className="text-[17px] font-semibold">{tr("لا توجد طلبات معلقة")}</p>
              <p className="text-[13px] text-muted-foreground">{tr("علّق فاتورة من زرار «تعليق» وارجعلها بعدين.")}</p>
            </div>
          ) : (
            <ul className="apple-rows max-h-96 overflow-y-auto rounded-[14px] bg-card [--row-inset:16px]">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{order.label ?? tr("طلب معلق")}</p>
                    <p className="text-[13px] text-muted-foreground tabular-nums">
                      {tr("{0} قطعة", order.itemCount)} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums">{egp(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => handleResume(order.id)}
                    disabled={isPending}
                    className="apple-press h-8 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {tr("استكمال")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(order.id)}
                    disabled={isPending}
                    aria-label={tr("حذف")}
                    className="apple-press grid size-8 place-items-center rounded-full text-(--sys-red) hover:bg-(--sys-red)/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
