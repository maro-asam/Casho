"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Send, X } from "lucide-react";
import {
  UpdatePOStatusAction,
  ReceivePOItemsAction,
} from "@/actions/inventory/purchase-orders.actions";
import { PurchaseOrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type POItem = {
  id: string;
  quantity: number;
  receivedQuantity: number;
  product: { name: string; image: string };
  variant: { name: string } | null;
};

type PO = {
  id: string;
  status: PurchaseOrderStatus;
  items: POItem[];
};

export function POActions({ po }: { po: PO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [received, setReceived] = useState<Record<string, number>>({});

  function initReceive() {
    const init: Record<string, number> = {};
    for (const item of po.items) {
      init[item.id] = item.quantity - item.receivedQuantity;
    }
    setReceived(init);
    setReceiveOpen(true);
  }

  function updateStatus(status: PurchaseOrderStatus) {
    startTransition(async () => {
      try {
        await UpdatePOStatusAction(po.id, status);
        toast.success("تم تحديث حالة الطلب");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  function handleReceive() {
    startTransition(async () => {
      try {
        await ReceivePOItemsAction({
          poId: po.id,
          receivedItems: Object.entries(received)
            .filter(([, qty]) => qty > 0)
            .map(([itemId, receivedQuantity]) => ({ itemId, receivedQuantity })),
        });
        toast.success("تم تحديث المخزون بنجاح");
        setReceiveOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  const canSend = po.status === PurchaseOrderStatus.DRAFT;
  const canReceive = po.status === PurchaseOrderStatus.SENT || po.status === PurchaseOrderStatus.PARTIAL;
  const canCancel = po.status !== PurchaseOrderStatus.RECEIVED && po.status !== PurchaseOrderStatus.CANCELLED;

  const pendingItems = po.items.filter((i) => i.receivedQuantity < i.quantity);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canSend && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => updateStatus(PurchaseOrderStatus.SENT)}
            disabled={isPending}
          >
            <Send className="size-4" />
            تحديد كـ"مُرسل"
          </Button>
        )}
        {canReceive && (
          <Button size="sm" className="gap-2" onClick={initReceive} disabled={isPending}>
            <Check className="size-4" />
            استلام بضاعة
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            onClick={() => updateStatus(PurchaseOrderStatus.CANCELLED)}
            disabled={isPending}
          >
            <X className="size-4" />
            إلغاء
          </Button>
        )}
      </div>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>استلام بضاعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              أدخل الكميات المُستلمة لكل منتج
            </p>
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {pendingItems.map((item) => {
                const remaining = item.quantity - item.receivedQuantity;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.product.image} alt={item.product.name} className="size-9 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product.name}</p>
                      {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                      <p className="text-xs text-muted-foreground">متبقي: {remaining}</p>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        className="h-8 text-center"
                        value={received[item.id] ?? 0}
                        onChange={(e) =>
                          setReceived((prev) => ({
                            ...prev,
                            [item.id]: Math.min(parseInt(e.target.value) || 0, remaining),
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleReceive}
                disabled={isPending || Object.values(received).every((v) => v === 0)}
                className="flex-1"
              >
                {isPending ? "جاري التحديث..." : "تأكيد الاستلام وتحديث المخزون"}
              </Button>
              <Button variant="outline" onClick={() => setReceiveOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
