"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { GetOrderForReturnAction, ProcessReturnAction } from "@/actions/pos/returns.actions";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; image: string; sku: string | null };
};

type Order = {
  id: string;
  fullName: string;
  createdAt: Date;
  total: number;
  items: OrderItem[];
  posReturns: { items: { productId: string; quantity: number }[] }[];
};

export default function ReturnsClient({ storeId: _storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnType, setReturnType] = useState<"FULL_RETURN" | "PARTIAL_RETURN">("PARTIAL_RETURN");
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [isPending, start] = useTransition();
  const router = useRouter();

  const loadOrder = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await GetOrderForReturnAction(orderId.trim());
      setOrder(data as Order);
      // Initialize return quantities to 0
      const initial: Record<string, number> = {};
      data.items.forEach((item) => { initial[item.productId] = 0; });
      setReturnItems(initial);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "طلب غير موجود");
    } finally {
      setLoading(false);
    }
  };

  const getReturnableQty = (item: OrderItem) => {
    const alreadyReturned = order?.posReturns
      .flatMap((r) => r.items)
      .filter((i) => i.productId === item.productId)
      .reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    return item.quantity - alreadyReturned;
  };

  const refundAmount = order
    ? order.items.reduce((sum, item) => {
        const qty = returnItems[item.productId] ?? 0;
        return sum + item.price * qty;
      }, 0)
    : 0;

  const handleSubmit = () => {
    if (!order) return;
    const itemsToReturn = order.items
      .filter((item) => (returnItems[item.productId] ?? 0) > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: returnItems[item.productId]!,
        unitPrice: item.price,
        reason,
      }));

    if (itemsToReturn.length === 0) {
      setError("اختر على الأقل منتج واحد للإرجاع");
      return;
    }

    start(async () => {
      try {
        await ProcessReturnAction({
          originalOrderId: order.id,
          type: returnType,
          items: itemsToReturn,
          reason,
          refundMethod,
        });
        setOpen(false);
        setOrder(null);
        setOrderId("");
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        إرجاع جديد
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>معالجة مرتجع</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order search */}
            <div className="flex gap-2">
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadOrder()}
                placeholder="رقم الطلب..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={loadOrder} disabled={loading} size="sm" className="gap-1.5">
                <Search className="size-3.5" />
                بحث
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {order && (
              <>
                {/* Order info */}
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="font-medium">{order.fullName}</span>
                  <span className="text-muted-foreground mr-2">
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")} ·{" "}
                    {(order.total / 100).toFixed(0)} ج
                  </span>
                </div>

                {/* Return type */}
                <div className="flex gap-2">
                  {(["FULL_RETURN", "PARTIAL_RETURN"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setReturnType(t);
                        if (t === "FULL_RETURN") {
                          const full: Record<string, number> = {};
                          order.items.forEach((i) => { full[i.productId] = getReturnableQty(i); });
                          setReturnItems(full);
                        }
                      }}
                      className={`flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                        returnType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                      }`}
                    >
                      {t === "FULL_RETURN" ? "إرجاع كامل" : "إرجاع جزئي"}
                    </button>
                  ))}
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item) => {
                    const returnable = getReturnableQty(item);
                    return (
                      <div key={item.productId} className="flex items-center justify-between rounded-md border p-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            قابل للإرجاع: {returnable} من {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mr-2">
                          <button
                            onClick={() => setReturnItems((prev) => ({ ...prev, [item.productId]: Math.max(0, (prev[item.productId] ?? 0) - 1) }))}
                            className="flex size-6 items-center justify-center rounded border text-sm"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">
                            {returnItems[item.productId] ?? 0}
                          </span>
                          <button
                            onClick={() => setReturnItems((prev) => ({ ...prev, [item.productId]: Math.min(returnable, (prev[item.productId] ?? 0) + 1) }))}
                            disabled={returnable === 0}
                            className="flex size-6 items-center justify-center rounded border text-sm disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reason */}
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="سبب الإرجاع (اختياري)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                />

                {/* Refund method */}
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="cash">نقداً</option>
                  <option value="card">بطاقة</option>
                  <option value="store_credit">رصيد بالمتجر</option>
                </select>

                {refundAmount > 0 && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-center">
                    <p className="text-xs text-amber-700">مبلغ الاسترداد</p>
                    <p className="text-xl font-bold text-amber-800">{(refundAmount / 100).toFixed(0)} ج</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isPending || refundAmount === 0}
                >
                  {isPending ? "جاري المعالجة..." : "تأكيد الإرجاع"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
