"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, RotateCcw, Search } from "lucide-react";
import { SegmentedButtons } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Stepper } from "../../_components/pos-ui";
import { GetOrderForReturnAction, ProcessReturnAction } from "@/actions/pos/returns.actions";
import { useRouter } from "next/navigation";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

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
      setError(e instanceof Error ? e.message : tr("طلب غير موجود"));
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
      setError(tr("اختر على الأقل منتج واحد للإرجاع"));
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
        setError(e instanceof Error ? e.message : tr("حدث خطأ"));
      }
    });
  };

  const money = (p: number) => tr("{0} ج", (p / 100).toFixed(0));
  const field = "h-11 w-full rounded-[10px] bg-(--fill-3) px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="apple-press inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="size-4" />
        {tr("إرجاع جديد")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="apple-ui max-h-[94vh] max-w-lg gap-0 overflow-y-auto bg-background p-0 text-foreground" dir={tdir()}>
          <DialogHeader className="items-center gap-1.5 px-6 pt-7 pb-4 text-center sm:text-center">
            <span aria-hidden className="grid size-10 place-items-center rounded-[10px] bg-(--sys-orange) text-white">
              <RotateCcw className="size-5" />
            </span>
            <DialogTitle className="pt-1">{tr("معالجة مرتجع")}</DialogTitle>
            <DialogDescription className="text-[13px]">{tr("اكتب رقم الطلب واختار اللي راجع.")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-4 pb-5">
            {/* Order search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadOrder();
              }}
              className="flex gap-2"
            >
              <label className="flex h-11 flex-1 items-center gap-2 rounded-[12px] bg-card px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">{tr("رقم الطلب...")}</span>
                <input
                  autoFocus
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder={tr("رقم الطلب...")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !orderId.trim()}
                className="apple-press inline-flex h-11 items-center gap-1.5 rounded-full bg-card px-4 text-[15px] font-medium text-primary disabled:opacity-50"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {tr("بحث")}
              </button>
            </form>

            {error && <p className="px-1 text-[13px] text-(--sys-red)">{error}</p>}

            {order && (
              <>
                <div className="flex items-center justify-between rounded-[14px] bg-card px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{order.fullName}</p>
                    <p className="text-[13px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString(intlLocale())}</p>
                  </div>
                  <span className="text-[17px] font-semibold tabular-nums">{money(order.total)}</span>
                </div>

                <SegmentedButtons
                  label={tr("نوع الإرجاع")}
                  value={returnType}
                  onChange={(t) => {
                    setReturnType(t);
                    if (t === "FULL_RETURN") {
                      const full: Record<string, number> = {};
                      order.items.forEach((i) => {
                        full[i.productId] = getReturnableQty(i);
                      });
                      setReturnItems(full);
                    }
                  }}
                  options={[
                    ["FULL_RETURN", tr("إرجاع كامل")],
                    ["PARTIAL_RETURN", tr("إرجاع جزئي")],
                  ]}
                  className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
                />

                <ul className="apple-rows max-h-64 overflow-y-auto rounded-[14px] bg-card [--row-inset:72px]">
                  {order.items.map((item) => {
                    const returnable = getReturnableQty(item);
                    const qty = returnItems[item.productId] ?? 0;
                    return (
                      <li key={item.productId} className="flex items-center gap-3 px-4 py-2.5">
                        <Image src={item.product.image || "/images/product-placeholder.png"} alt="" width={44} height={44} className="size-11 shrink-0 rounded-[10px] bg-(--fill-3) object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">{item.product.name}</p>
                          <p className="text-[12px] text-muted-foreground tabular-nums">{tr("قابل للإرجاع: {0} من {1}", returnable, item.quantity)}</p>
                        </div>
                        <Stepper
                          value={qty}
                          canDecrement={qty > 0}
                          canIncrement={qty < returnable}
                          onDecrement={() => setReturnItems((prev) => ({ ...prev, [item.productId]: Math.max(0, (prev[item.productId] ?? 0) - 1) }))}
                          onIncrement={() => setReturnItems((prev) => ({ ...prev, [item.productId]: Math.min(returnable, (prev[item.productId] ?? 0) + 1) }))}
                          decLabel={tr("قلّل الكمية")}
                          incLabel={tr("زوّد الكمية")}
                        />
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tr("سبب الإرجاع (اختياري)")} aria-label={tr("سبب الإرجاع (اختياري)")} className={cn(field, "bg-card")} />
                  <label className="flex items-center gap-3 rounded-[10px] bg-card ps-3 pe-1">
                    <span className="shrink-0 text-[15px]">{tr("طريقة الاسترداد")}</span>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] text-muted-foreground outline-none"
                    >
                      <option value="cash">{tr("نقداً")}</option>
                      <option value="card">{tr("بطاقة")}</option>
                      <option value="store_credit">{tr("رصيد بالمتجر")}</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-[14px] bg-(--sys-orange)/12 px-4 py-3">
                  <span className="text-[15px] font-medium">{tr("مبلغ الاسترداد")}</span>
                  <span className="text-[28px] font-bold tabular-nums">{money(refundAmount)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || refundAmount === 0}
                  className="apple-press flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary text-[17px] font-semibold text-primary-foreground disabled:opacity-40"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending ? tr("جاري المعالجة...") : tr("تأكيد الإرجاع")}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
