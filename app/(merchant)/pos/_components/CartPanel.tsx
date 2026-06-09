"use client";

import { useState, useTransition, Dispatch } from "react";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  User,
  MessageSquare,
  Tag,
  ShoppingBag,
  CreditCard,
  Pause,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompletePOSSaleAction, HoldOrderAction } from "@/actions/pos/pos.actions";
import type { CartState, CartItem, InvoiceDiscount } from "./PosTerminal";
import DiscountDialog from "./DiscountDialog";
import SplitPaymentDialog from "./SplitPaymentDialog";
import ReceiptDialog from "./ReceiptDialog";

type CartAction =
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_ITEM_DISCOUNT"; productId: string; amount: number }
  | { type: "SET_INVOICE_DISCOUNT"; discount: InvoiceDiscount }
  | { type: "SET_CUSTOMER"; customer: CartState["customer"] }
  | { type: "SET_NOTE"; note: string }
  | { type: "CLEAR" }
  | { type: "LOAD"; state: CartState }
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "SET_QUANTITY"; productId: string; qty: number };

type Props = {
  cart: CartState;
  dispatch: Dispatch<CartAction>;
  store: { id: string; name: string; slug: string; settings: { logo: string | null; primaryColor: string | null; whatsappNumber: string | null } | null };
  cashier: { id: string; name: string | null; email: string };
  activeShift: { id: string; openingBalance: number; totalSales: number; transactionCount: number; openedAt: string } | null;
  onShiftComplete: (shift: { id: string; openingBalance: number; totalSales: number; transactionCount: number; openedAt: string }) => void;
  onHoldComplete: () => void;
};

// ─── Totals calculation ───────────────────────────────────────

function calcTotals(cart: CartState) {
  const subtotal = cart.items.reduce(
    (s, i) => s + i.price * i.quantity - i.discountAmount,
    0,
  );

  let invoiceDiscountAmount = 0;
  if (cart.invoiceDiscount) {
    if (cart.invoiceDiscount.type === "percentage") {
      invoiceDiscountAmount = Math.round(subtotal * (cart.invoiceDiscount.value / 100));
    } else {
      invoiceDiscountAmount = Math.min(Math.round(cart.invoiceDiscount.value * 100), subtotal);
    }
  }

  const total = Math.max(0, subtotal - invoiceDiscountAmount);
  const itemDiscounts = cart.items.reduce((s, i) => s + i.discountAmount, 0);
  const totalDiscount = itemDiscounts + invoiceDiscountAmount;
  const costTotal = cart.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const profitTotal = total - costTotal;
  const profitMargin = total > 0 ? (profitTotal / total) * 100 : 0;

  return { subtotal, invoiceDiscountAmount, total, totalDiscount, costTotal, profitTotal, profitMargin };
}

function egp(piasters: number) {
  return (piasters / 100).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ─── Component ────────────────────────────────────────────────

export default function CartPanel({ cart, dispatch, store, cashier, activeShift, onShiftComplete, onHoldComplete }: Props) {
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { subtotal, invoiceDiscountAmount, total, totalDiscount, costTotal, profitTotal, profitMargin } = calcTotals(cart);

  const handleHold = () => {
    if (cart.items.length === 0) return;
    startTransition(async () => {
      try {
        await HoldOrderAction({
          cartData: {
            items: cart.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              image: i.image,
              price: i.price,
              costPrice: i.costPrice,
              quantity: i.quantity,
              discountAmount: i.discountAmount,
              stock: i.stock,
              sku: i.sku,
            })),
            invoiceDiscount: cart.invoiceDiscount,
            customer: cart.customer,
            note: cart.note,
          },
        });
        onHoldComplete();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      }
    });
  };

  const handleCompleteSale = (payments: { paymentMethod: string; amount: number; reference?: string }[]) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await CompletePOSSaleAction({
          shiftId: activeShift?.id,
          cartItems: cart.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            costPrice: i.costPrice,
            quantity: i.quantity,
            discountAmount: i.discountAmount,
          })),
          invoiceDiscount: cart.invoiceDiscount,
          payments,
          customer: cart.customer ?? undefined,
          notes: cart.note || undefined,
        });
        setShowPayment(false);
        setCompletedOrderId(result.orderId);
        if (activeShift) {
          onShiftComplete({
            ...activeShift,
            totalSales: activeShift.totalSales + result.total,
            transactionCount: activeShift.transactionCount + 1,
          });
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "حدث خطأ أثناء إتمام البيع");
      }
    });
  };

  const handleReceiptClose = () => {
    setCompletedOrderId(null);
    dispatch({ type: "CLEAR" });
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Customer row */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <User className="size-3.5 shrink-0 text-muted-foreground" />
        {cart.customer ? (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-xs font-medium">{cart.customer.name}</span>
            <span className="text-xs text-muted-foreground">{cart.customer.phone}</span>
            <button
              onClick={() => dispatch({ type: "SET_CUSTOMER", customer: null })}
              className="text-xs text-destructive hover:underline"
            >
              إزالة
            </button>
          </div>
        ) : (
          <span className="flex-1 text-xs text-muted-foreground">عميل نقدي (اختياري)</span>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {cart.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="size-10 opacity-30" />
            <p className="text-sm">أضف منتجات للفاتورة</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onIncrement={() => dispatch({ type: "INCREMENT", productId: item.productId })}
                onDecrement={() => dispatch({ type: "DECREMENT", productId: item.productId })}
                onRemove={() => dispatch({ type: "REMOVE", productId: item.productId })}
                onDiscountChange={(amount) =>
                  dispatch({ type: "SET_ITEM_DISCOUNT", productId: item.productId, amount })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      {editingNote ? (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={cart.note}
              onChange={(e) => dispatch({ type: "SET_NOTE", note: e.target.value })}
              onBlur={() => setEditingNote(false)}
              placeholder="ملاحظة على الفاتورة..."
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      ) : cart.note ? (
        <button
          onClick={() => setEditingNote(true)}
          className="flex items-center gap-1.5 border-t border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="size-3" />
          {cart.note}
        </button>
      ) : null}

      {/* Totals */}
      {cart.items.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>المجموع الفرعي</span>
            <span>{egp(subtotal)} ج</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>الخصم الإجمالي</span>
              <span>−{egp(totalDiscount)} ج</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>الإجمالي</span>
            <span className="text-primary">{egp(total)} ج</span>
          </div>
          {costTotal > 0 && (
            <div className="flex items-center justify-between rounded-md bg-emerald-500/10 px-2 py-1 text-xs">
              <span className="text-muted-foreground">الربح المتوقع</span>
              <span className={cn("font-medium", profitTotal >= 0 ? "text-emerald-600" : "text-destructive")}>
                {egp(profitTotal)} ج ({profitMargin.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="border-t border-border p-2 space-y-1.5">
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs"
            onClick={() => setShowDiscount(true)}
            disabled={cart.items.length === 0}
          >
            <Tag className="size-3" />
            خصم
            {cart.invoiceDiscount && (
              <span className="rounded-full bg-primary/20 text-primary px-1 text-[9px]">
                {cart.invoiceDiscount.type === "percentage"
                  ? `${cart.invoiceDiscount.value}%`
                  : `${cart.invoiceDiscount.value} ج`}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs"
            onClick={() => setEditingNote(!editingNote)}
          >
            <MessageSquare className="size-3" />
            ملاحظة
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs"
            onClick={handleHold}
            disabled={cart.items.length === 0 || isPending}
          >
            <Pause className="size-3" />
            تعليق
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={() => dispatch({ type: "CLEAR" })}
            disabled={cart.items.length === 0}
            title="مسح الفاتورة"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 h-11 text-sm font-bold"
          onClick={() => setShowPayment(true)}
          disabled={cart.items.length === 0 || isPending || !activeShift}
        >
          <CreditCard className="size-4" />
          {!activeShift ? "افتح وردية أولاً" : `إتمام البيع · ${egp(total)} ج`}
        </Button>
      </div>

      {/* Dialogs */}
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

      <SplitPaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        total={total}
        onConfirm={handleCompleteSale}
        loading={isPending}
      />

      {completedOrderId && (
        <ReceiptDialog
          open={true}
          onClose={handleReceiptClose}
          orderId={completedOrderId}
          store={store}
          cashierName={cashier.name ?? cashier.email}
        />
      )}
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────

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
  const [showDiscount, setShowDiscount] = useState(false);
  const lineTotal = item.price * item.quantity - item.discountAmount;

  return (
    <div className="px-3 py-2">
      <div className="flex items-start gap-2">
        <Image
          src={item.image || "/images/product-placeholder.png"}
          alt={item.name}
          width={36}
          height={36}
          className="rounded object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-tight truncate">{item.name}</p>
          {item.sku && <p className="text-[9px] text-muted-foreground">{item.sku}</p>}
          <div className="mt-1 flex items-center gap-1">
            <button
              onClick={onDecrement}
              className="flex size-5 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Minus className="size-2.5" />
            </button>
            <span className="min-w-5 text-center text-xs font-bold">{item.quantity}</span>
            <button
              onClick={onIncrement}
              disabled={item.quantity >= item.stock}
              className="flex size-5 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Plus className="size-2.5" />
            </button>
            <span className="text-[10px] text-muted-foreground mr-1">
              × {(item.price / 100).toFixed(0)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={onRemove} className="text-muted-foreground/50 hover:text-destructive">
            <Trash2 className="size-3" />
          </button>
          <span className="text-xs font-bold text-primary">
            {(lineTotal / 100).toFixed(0)} ج
          </span>
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
          >
            <Tag className="size-2.5" />
            خصم
          </button>
        </div>
      </div>

      {showDiscount && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
          <span className="text-[10px] text-muted-foreground">خصم ج:</span>
          <input
            type="number"
            min="0"
            max={item.price * item.quantity / 100}
            step="0.5"
            defaultValue={item.discountAmount / 100}
            onChange={(e) => onDiscountChange(Math.round(parseFloat(e.target.value || "0") * 100))}
            className="w-16 rounded border border-input bg-background px-1.5 py-0.5 text-xs focus:outline-none"
          />
          {item.discountAmount > 0 && (
            <span className="text-[10px] text-emerald-600">
              −{(item.discountAmount / 100).toFixed(0)} ج
            </span>
          )}
        </div>
      )}
    </div>
  );
}
