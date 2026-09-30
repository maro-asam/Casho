"use client";

import { useState, useTransition, type Dispatch } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, MessageSquare, Minus, Pause, Plus, ScanBarcode, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { CompletePOSSaleAction, HoldOrderAction } from "@/actions/pos/pos.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CustomerPicker from "./CustomerPicker";
import DiscountDialog from "./DiscountDialog";
import PaymentDialog, { type PaymentEntry } from "./PaymentDialog";
import ReceiptDialog from "./ReceiptDialog";
import type { CartAction, CartItem, CartState } from "./PosTerminal";
import { egp } from "./pos-format";

type Shift = { id: string; openingBalance: number; totalSales: number; transactionCount: number; openedAt: string };

type Props = {
  cart: CartState;
  dispatch: Dispatch<CartAction>;
  store: { id: string; name: string; slug: string; settings: { logo: string | null; primaryColor: string | null; whatsappNumber: string | null } | null };
  cashier: { id: string; name: string | null; email: string };
  activeShift: Shift | null;
  onShiftComplete: (shift: Shift) => void;
  onHoldComplete: () => void;
  onOpenShift: () => void;
  paymentOpen: boolean;
  onPaymentOpenChange: (open: boolean) => void;
};

export function calcTotals(cart: CartState) {
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity - i.discountAmount, 0);
  let invoiceDiscountAmount = 0;
  if (cart.invoiceDiscount) {
    invoiceDiscountAmount =
      cart.invoiceDiscount.type === "percentage"
        ? Math.round(subtotal * (cart.invoiceDiscount.value / 100))
        : Math.min(Math.round(cart.invoiceDiscount.value * 100), subtotal);
  }
  const total = Math.max(0, subtotal - invoiceDiscountAmount);
  const itemDiscounts = cart.items.reduce((s, i) => s + i.discountAmount, 0);
  const costTotal = cart.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const profitTotal = total - costTotal;
  return {
    subtotal,
    total,
    totalDiscount: itemDiscounts + invoiceDiscountAmount,
    costTotal,
    profitTotal,
    profitMargin: total > 0 ? (profitTotal / total) * 100 : 0,
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
  };
}

export default function CartPanel({
  cart,
  dispatch,
  store,
  cashier,
  activeShift,
  onShiftComplete,
  onHoldComplete,
  onOpenShift,
  paymentOpen,
  onPaymentOpenChange,
}: Props) {
  const [showDiscount, setShowDiscount] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { subtotal, total, totalDiscount, costTotal, profitTotal, profitMargin, itemCount } = calcTotals(cart);
  const empty = cart.items.length === 0;

  const handleHold = () => {
    if (empty) return;
    startTransition(async () => {
      try {
        await HoldOrderAction({
          cartData: {
            items: cart.items.map(({ productId, name, image, price, costPrice, quantity, discountAmount, stock, sku }) => ({
              productId,
              name,
              image,
              price,
              costPrice,
              quantity,
              discountAmount,
              stock,
              sku,
            })),
            invoiceDiscount: cart.invoiceDiscount,
            customer: cart.customer,
            note: cart.note,
          },
        });
        toast.success("الفاتورة اتعلّقت. تقدر ترجعلها من «معلّق».");
        onHoldComplete();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "مقدرناش نعلّق الفاتورة");
      }
    });
  };

  const handleCompleteSale = (payments: PaymentEntry[]) => {
    startTransition(async () => {
      try {
        const result = await CompletePOSSaleAction({
          shiftId: activeShift?.id,
          cartItems: cart.items.map(({ productId, name, price, costPrice, quantity, discountAmount }) => ({
            productId,
            name,
            price,
            costPrice,
            quantity,
            discountAmount,
          })),
          invoiceDiscount: cart.invoiceDiscount,
          payments,
          customer: cart.customer ?? undefined,
          notes: cart.note || undefined,
        });
        onPaymentOpenChange(false);
        setCompletedOrderId(result.orderId);
        if (activeShift) {
          onShiftComplete({
            ...activeShift,
            totalSales: activeShift.totalSales + result.total,
            transactionCount: activeShift.transactionCount + 1,
          });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "حصلت مشكلة وإحنا بنكمّل البيع");
      }
    });
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div>
          <h2 className="text-sm font-semibold">الفاتورة الحالية</h2>
          <p className="text-xs text-muted-foreground">{empty ? "فاضية" : `${itemCount} قطعة`}</p>
        </div>
        {!empty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={() => dispatch({ type: "CLEAR" })}
          >
            <Trash2 className="size-4" />
            مسح
          </Button>
        )}
      </div>

      <div className="shrink-0 border-b border-border p-3">
        <CustomerPicker customer={cart.customer} onChange={(customer) => dispatch({ type: "SET_CUSTOMER", customer })} />
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ScanBarcode className="size-6" />
            </span>
            <p className="text-sm font-medium">امسح باركود أو اختار منتج</p>
            <p className="text-xs text-muted-foreground">المنتجات اللي تختارها هتظهر هنا.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onIncrement={() => dispatch({ type: "INCREMENT", productId: item.productId })}
                onDecrement={() => dispatch({ type: "DECREMENT", productId: item.productId })}
                onRemove={() => dispatch({ type: "REMOVE", productId: item.productId })}
                onDiscountChange={(amount) => dispatch({ type: "SET_ITEM_DISCOUNT", productId: item.productId, amount })}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Note */}
      {(editingNote || cart.note) && (
        <div className="shrink-0 border-t border-border px-3 py-2">
          {editingNote ? (
            <input
              autoFocus
              value={cart.note}
              onChange={(e) => dispatch({ type: "SET_NOTE", note: e.target.value })}
              onBlur={() => setEditingNote(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingNote(false)}
              placeholder="ملاحظة على الفاتورة..."
              aria-label="ملاحظة على الفاتورة"
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingNote(true)}
              className="flex w-full items-center gap-1.5 text-start text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">{cart.note}</span>
            </button>
          )}
        </div>
      )}

      {/* Totals + actions */}
      <div className="shrink-0 space-y-3 border-t border-border p-3">
        {!empty && (
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>الإجمالي الفرعي</dt>
              <dd className="tabular-nums">{egp(subtotal)}</dd>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <dt className="flex items-center gap-1.5">
                  الخصم
                  {cart.invoiceDiscount && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "SET_INVOICE_DISCOUNT", discount: null })}
                      className="rounded text-muted-foreground hover:text-destructive"
                      aria-label="شيل خصم الفاتورة"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </dt>
                <dd className="tabular-nums">−{egp(totalDiscount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-semibold">الإجمالي</dt>
              <dd className="text-2xl font-bold tracking-tight tabular-nums">{egp(total)}</dd>
            </div>
            {costTotal > 0 && (
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowProfit((v) => !v)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  aria-pressed={showProfit}
                >
                  {showProfit ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  الربح
                </button>
                <span
                  className={cn(
                    "tabular-nums",
                    !showProfit && "select-none blur-sm",
                    profitTotal < 0 ? "text-destructive" : "text-muted-foreground",
                  )}
                  aria-hidden={!showProfit}
                >
                  {egp(profitTotal)} · {profitMargin.toFixed(0)}٪
                </span>
              </div>
            )}
          </dl>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowDiscount(true)} disabled={empty}>
            <Tag className="size-4" />
            خصم
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setEditingNote(true)} disabled={empty}>
            <MessageSquare className="size-4" />
            ملاحظة
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleHold} disabled={empty || isPending}>
            <Pause className="size-4" />
            تعليق
          </Button>
        </div>

        {activeShift ? (
          <Button
            size="lg"
            className="h-14 w-full justify-between px-5 text-base font-semibold"
            onClick={() => onPaymentOpenChange(true)}
            disabled={empty || isPending}
          >
            <span className="flex items-center gap-2">
              {isPending && <Loader2 className="size-5 animate-spin" />}
              الدفع
              <kbd className="rounded bg-primary-foreground/15 px-1.5 py-0.5 font-sans text-[11px] font-medium">F9</kbd>
            </span>
            <span className="tabular-nums">{egp(total)}</span>
          </Button>
        ) : (
          <Button size="lg" variant="secondary" className="h-14 w-full text-base font-semibold" onClick={onOpenShift}>
            افتح وردية عشان تبدأ تبيع
          </Button>
        )}
      </div>

      <DiscountDialog
        open={showDiscount}
        onOpenChange={setShowDiscount}
        currentDiscount={cart.invoiceDiscount}
        subtotal={subtotal}
        onApply={(discount) => {
          dispatch({ type: "SET_INVOICE_DISCOUNT", discount });
          setShowDiscount(false);
        }}
      />

      <PaymentDialog open={paymentOpen} onOpenChange={onPaymentOpenChange} total={total} onConfirm={handleCompleteSale} loading={isPending} />

      {completedOrderId && (
        <ReceiptDialog
          open
          onClose={() => {
            setCompletedOrderId(null);
            dispatch({ type: "CLEAR" });
          }}
          orderId={completedOrderId}
          store={store}
          cashierName={cashier.name ?? cashier.email}
        />
      )}
    </div>
  );
}

function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onDiscountChange,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onDiscountChange: (amount: number) => void;
}) {
  const [showDiscount, setShowDiscount] = useState(item.discountAmount > 0);
  const lineTotal = item.price * item.quantity - item.discountAmount;
  const atMax = item.quantity >= item.stock;

  return (
    <li className="px-3 py-3">
      <div className="flex items-start gap-3">
        <Image
          src={item.image || "/images/product-placeholder.png"}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-lg border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`شيل ${item.name}`}
              className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center rounded-lg border border-border">
              <button
                type="button"
                onClick={onDecrement}
                aria-label="قلّل الكمية"
                className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={onIncrement}
                disabled={atMax}
                aria-label="زوّد الكمية"
                title={atMax ? "مفيش كمية أكتر في المخزون" : undefined}
                className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="text-end">
              <p className="text-sm font-semibold tabular-nums">{egp(lineTotal)}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {item.quantity} × {egp(item.price)}
              </p>
            </div>
          </div>

          {showDiscount ? (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor={`disc-${item.productId}`}>
                خصم على الصنف
              </label>
              <input
                id={`disc-${item.productId}`}
                type="number"
                inputMode="decimal"
                min="0"
                max={(item.price * item.quantity) / 100}
                step="0.5"
                defaultValue={item.discountAmount ? item.discountAmount / 100 : ""}
                onChange={(e) =>
                  onDiscountChange(Math.min(item.price * item.quantity, Math.round(parseFloat(e.target.value || "0") * 100)))
                }
                placeholder="0"
                className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs text-muted-foreground">ج.م</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDiscount(true)}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Tag className="size-3" />
              خصم على الصنف
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
