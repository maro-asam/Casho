"use client";

import { useState, useTransition, type Dispatch } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, MessageSquare, Pause, ScanBarcode, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { CompletePOSSaleAction, HoldOrderAction } from "@/actions/pos/pos.actions";
import { cn } from "@/lib/utils";
import CustomerPicker from "./CustomerPicker";
import DiscountDialog from "./DiscountDialog";
import PaymentDialog, { type PaymentEntry } from "./PaymentDialog";
import ReceiptDialog from "./ReceiptDialog";
import type { CartAction, CartItem, CartState } from "./PosTerminal";
import { egp } from "./pos-format";
import { Stepper } from "./pos-ui";
import { tr } from "@/lib/i18n/dashboard";

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
        toast.success(tr("الفاتورة اتعلّقت. تقدر ترجعلها من «معلّق»."));
        onHoldComplete();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tr("مقدرناش نعلّق الفاتورة"));
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
        toast.error(e instanceof Error ? e.message : tr("حصلت مشكلة وإحنا بنكمّل البيع"));
      }
    });
  };

  const actionButton =
    "apple-press flex h-11 flex-col items-center justify-center gap-0.5 rounded-[12px] bg-(--fill-3) text-[12px] font-medium text-foreground/85 hover:bg-(--fill-3)/70 disabled:opacity-40";

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex shrink-0 items-end justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-[22px] leading-7 font-bold">{tr("الفاتورة الحالية")}</h2>
          <p className="text-[13px] text-muted-foreground tabular-nums">{empty ? tr("فاضية") : tr("{0} قطعة", itemCount)}</p>
        </div>
        {!empty && (
          <button
            type="button"
            onClick={() => dispatch({ type: "CLEAR" })}
            className="apple-press h-8 rounded-full px-3 text-[15px] text-(--sys-red) hover:bg-(--sys-red)/8"
          >
            {tr("مسح")}
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 pb-2">
        <CustomerPicker customer={cart.customer} onChange={(customer) => dispatch({ type: "SET_CUSTOMER", customer })} />
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
            <ScanBarcode className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
            <p className="text-[17px] font-semibold">{tr("امسح باركود أو اختار منتج")}</p>
            <p className="text-[13px] text-muted-foreground">{tr("المنتجات اللي تختارها هتظهر هنا.")}</p>
          </div>
        ) : (
          <ul className="apple-rows [--row-inset:76px]">
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
        <div className="shrink-0 px-3 pt-2">
          {editingNote ? (
            <input
              autoFocus
              value={cart.note}
              onChange={(e) => dispatch({ type: "SET_NOTE", note: e.target.value })}
              onBlur={() => setEditingNote(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingNote(false)}
              placeholder={tr("ملاحظة على الفاتورة...")}
              aria-label={tr("ملاحظة على الفاتورة")}
              className="h-10 w-full rounded-[10px] bg-(--fill-3) px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingNote(true)}
              className="flex w-full items-center gap-2 rounded-[10px] bg-(--sys-orange)/10 px-3 py-2 text-start text-[13px] hover:bg-(--sys-orange)/15"
            >
              <MessageSquare className="size-4 shrink-0 text-(--sys-orange)" />
              <span className="truncate">{cart.note}</span>
            </button>
          )}
        </div>
      )}

      {/* Totals + actions */}
      <div className="shrink-0 space-y-3 p-3">
        {!empty && (
          <dl className="space-y-1 rounded-[16px] bg-(--fill-3)/60 px-4 py-3 text-[15px]">
            <div className="flex justify-between text-muted-foreground">
              <dt>{tr("الإجمالي الفرعي")}</dt>
              <dd className="tabular-nums">{egp(subtotal)}</dd>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-(--sys-green)">
                  {tr("الخصم")}
                  {cart.invoiceDiscount && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "SET_INVOICE_DISCOUNT", discount: null })}
                      className="grid size-4 place-items-center rounded-full bg-(--sys-gray)/50 text-white hover:bg-(--sys-red)"
                      aria-label={tr("شيل خصم الفاتورة")}
                    >
                      <X className="size-2.5" strokeWidth={3} />
                    </button>
                  )}
                </dt>
                <dd className="text-(--sys-green) tabular-nums">−{egp(totalDiscount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-[17px] font-semibold">{tr("الإجمالي")}</dt>
              <dd className="text-[30px] leading-9 font-bold tabular-nums ltr:tracking-[-0.02em]">{egp(total)}</dd>
            </div>
            {costTotal > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <button
                  type="button"
                  onClick={() => setShowProfit((v) => !v)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  aria-pressed={showProfit}
                >
                  {showProfit ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {tr("الربح")}
                </button>
                <span
                  className={cn("tabular-nums", !showProfit && "blur-sm select-none", profitTotal < 0 ? "text-(--sys-red)" : "text-muted-foreground")}
                  aria-hidden={!showProfit}
                >
                  {tr("{0} · {1}٪", egp(profitTotal), profitMargin.toFixed(0))}
                </span>
              </div>
            )}
          </dl>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button type="button" className={actionButton} onClick={() => setShowDiscount(true)} disabled={empty}>
            <Tag className="size-4" />
            {tr("خصم")}
          </button>
          <button type="button" className={actionButton} onClick={() => setEditingNote(true)} disabled={empty}>
            <MessageSquare className="size-4" />
            {tr("ملاحظة")}
          </button>
          <button type="button" className={actionButton} onClick={handleHold} disabled={empty || isPending}>
            <Pause className="size-4" />
            {tr("تعليق")}
          </button>
        </div>

        {activeShift ? (
          <button
            type="button"
            onClick={() => onPaymentOpenChange(true)}
            disabled={empty || isPending}
            className="apple-press flex h-14 w-full items-center justify-between rounded-[16px] bg-primary px-5 text-[17px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              {isPending && <Loader2 className="size-5 animate-spin" />}
              {tr("الدفع")}
              <kbd className="rounded-md bg-primary-foreground/18 px-1.5 py-0.5 font-sans text-[11px] font-medium">F9</kbd>
            </span>
            <span className="tabular-nums">{egp(total)}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenShift}
            className="apple-press flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-(--sys-orange)/14 text-[17px] font-semibold"
          >
            <span className="size-2 rounded-full bg-(--sys-orange)" />
            {tr("افتح وردية عشان تبدأ تبيع")}
          </button>
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
    <li className="group flex items-start gap-3 px-4 py-3">
      <Image
        src={item.image || "/images/product-placeholder.png"}
        alt=""
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-[10px] bg-(--fill-3) object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-[15px] leading-5 font-medium">{item.name}</p>
          <p className="shrink-0 text-[15px] font-semibold tabular-nums">{egp(lineTotal)}</p>
        </div>
        <p className="text-[12px] text-muted-foreground tabular-nums">
          {item.quantity} × {egp(item.price)}
          {item.discountAmount > 0 && <span className="text-(--sys-green)"> · −{egp(item.discountAmount)}</span>}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Stepper
            value={item.quantity}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            canIncrement={!atMax}
            decLabel={tr("قلّل الكمية")}
            incLabel={atMax ? tr("مفيش كمية أكتر في المخزون") : tr("زوّد الكمية")}
          />
          <div className="flex items-center gap-1">
            {showDiscount ? (
              <label className="flex h-8 items-center gap-1 rounded-full bg-(--fill-3) ps-2.5 pe-2" htmlFor={`disc-${item.productId}`}>
                <Tag className="size-3.5 text-muted-foreground" />
                <span className="sr-only">{tr("خصم على الصنف")}</span>
                <input
                  id={`disc-${item.productId}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={(item.price * item.quantity) / 100}
                  step="0.5"
                  defaultValue={item.discountAmount ? item.discountAmount / 100 : ""}
                  onChange={(e) => onDiscountChange(Math.min(item.price * item.quantity, Math.round(parseFloat(e.target.value || "0") * 100)))}
                  placeholder="0"
                  className="w-12 bg-transparent text-[13px] tabular-nums outline-none"
                />
                <span className="text-[12px] text-muted-foreground">{tr("ج.م")}</span>
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setShowDiscount(true)}
                aria-label={tr("خصم على الصنف")}
                title={tr("خصم على الصنف")}
                className="apple-press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-(--fill-3) hover:text-foreground"
              >
                <Tag className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              aria-label={tr("شيل {0}", item.name)}
              className="apple-press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-(--sys-red)/10 hover:text-(--sys-red)"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
