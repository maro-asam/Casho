"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, ShoppingBag, Trash2 } from "lucide-react";
import { GetHeldOrdersAction, ResumeHeldOrderAction, DeleteHeldOrderAction } from "@/actions/pos/pos.actions";
import type { HeldCartData } from "@/actions/pos/pos.actions";

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
    return () => { cancelled = true; };
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
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            الطلبات المعلقة ({orders.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <ShoppingBag className="size-8 opacity-30" />
            <p className="text-sm">لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{order.label ?? "طلب معلق"}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.itemCount} قطعة ·{" "}
                    {(order.total / 100).toLocaleString("ar-EG")} ج ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1.5 mr-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleResume(order.id)}
                    disabled={isPending}
                  >
                    استكمال
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(order.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
