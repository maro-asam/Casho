"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Send, Truck, X } from "lucide-react";
import {
  ApproveTransferAction,
  ShipTransferAction,
  ReceiveTransferAction,
  CancelTransferAction,
} from "@/actions/inventory/transfers.actions";
import { TransferStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TransferItem = {
  id: string;
  requestedQuantity: number;
  shippedQuantity: number;
  receivedQuantity: number;
  product: { name: string; image: string };
  variant: { name: string } | null;
};

type Transfer = { id: string; status: TransferStatus; items: TransferItem[] };

export function TransferActions({ transfer }: { transfer: Transfer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shipOpen, setShipOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function initShip() {
    const init: Record<string, number> = {};
    for (const item of transfer.items) {
      init[item.id] = item.requestedQuantity;
    }
    setQuantities(init);
    setShipOpen(true);
  }

  function initReceive() {
    const init: Record<string, number> = {};
    for (const item of transfer.items) {
      init[item.id] = item.shippedQuantity - item.receivedQuantity;
    }
    setQuantities(init);
    setReceiveOpen(true);
  }

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transfer.status === TransferStatus.PENDING && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isPending}
              onClick={() => run(async () => { await ApproveTransferAction(transfer.id); toast.success("تمت الموافقة"); })}
            >
              <Check className="size-4" />
              موافقة
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              disabled={isPending}
              onClick={() => run(async () => { await CancelTransferAction(transfer.id); toast.success("تم الإلغاء"); })}
            >
              <X className="size-4" />
              إلغاء
            </Button>
          </>
        )}
        {transfer.status === TransferStatus.APPROVED && (
          <Button size="sm" className="gap-2" disabled={isPending} onClick={initShip}>
            <Truck className="size-4" />
            تسجيل الشحن
          </Button>
        )}
        {transfer.status === TransferStatus.SHIPPED && (
          <Button size="sm" className="gap-2" disabled={isPending} onClick={initReceive}>
            <Send className="size-4" />
            تأكيد الاستلام
          </Button>
        )}
      </div>

      {/* Ship Dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تسجيل الشحن</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {transfer.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.product.image} alt={item.product.name} className="size-9 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">مطلوب: {item.requestedQuantity}</p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={item.requestedQuantity}
                  className="w-20 h-8 text-center"
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => setQuantities((p) => ({ ...p, [item.id]: parseInt(e.target.value) || 0 }))}
                />
              </div>
            ))}
            <Button
              className="w-full mt-2"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  await ShipTransferAction({
                    transferId: transfer.id,
                    shippedItems: Object.entries(quantities).map(([itemId, shippedQuantity]) => ({ itemId, shippedQuantity })),
                  });
                  toast.success("تم تسجيل الشحن");
                  setShipOpen(false);
                })
              }
            >
              {isPending ? "جاري التسجيل..." : "تأكيد الشحن"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تأكيد الاستلام</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {transfer.items.filter((i) => i.shippedQuantity > i.receivedQuantity).map((item) => {
              const remaining = item.shippedQuantity - item.receivedQuantity;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.product.image} alt={item.product.name} className="size-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">مشحون: {remaining}</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={remaining}
                    className="w-20 h-8 text-center"
                    value={quantities[item.id] ?? 0}
                    onChange={(e) => setQuantities((p) => ({ ...p, [item.id]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              );
            })}
            <Button
              className="w-full mt-2"
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  await ReceiveTransferAction({
                    transferId: transfer.id,
                    receivedItems: Object.entries(quantities).map(([itemId, receivedQuantity]) => ({ itemId, receivedQuantity })),
                  });
                  toast.success("تم تحديث المخزون");
                  setReceiveOpen(false);
                })
              }
            >
              {isPending ? "جاري التأكيد..." : "تأكيد الاستلام وتحديث المخزون"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
