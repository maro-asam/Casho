"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ApproveSuggestedOrderAction,
  type SuggestedOrderDetail,
} from "@/actions/instagram/instagram.actions";

type Props = {
  order: SuggestedOrderDetail;
  storeProducts: Array<{ id: string; name: string; price: number }>;
};

type ItemState = {
  suggestedItemId: string;
  aiProductName: string;
  aiVariant: string | null;
  matchedProductId: string;
  quantity: number;
  unitPrice: number; // piasters
};

function formatPrice(piasters: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piasters / 100);
}

export function ApproveForm({ order, storeProducts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState(order.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone ?? "");
  const [customerAddress, setCustomerAddress] = useState(order.customerAddress ?? "");

  const [items, setItems] = useState<ItemState[]>(() =>
    order.items.map((item) => ({
      suggestedItemId: item.id,
      aiProductName: item.aiProductName,
      aiVariant: item.aiVariant,
      matchedProductId: item.matchedProductId ?? "",
      quantity: item.aiQuantity,
      unitPrice: item.unitPrice ?? item.matchedProduct
        ? Math.round((item.matchedProduct?.price ?? 0) * 100)
        : 0,
    })),
  );

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleProductChange(index: number, productId: string) {
    const product = storeProducts.find((p) => p.id === productId);
    updateItem(index, {
      matchedProductId: productId,
      unitPrice: product ? Math.round(product.price * 100) : 0,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const isValid =
    customerName.trim() &&
    customerPhone.trim() &&
    customerAddress.trim() &&
    items.every((item) => item.matchedProductId && item.unitPrice > 0 && item.quantity > 0);

  function handleApprove() {
    startTransition(async () => {
      const result = await ApproveSuggestedOrderAction({
        suggestedOrderId: order.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: items.map((item) => ({
          suggestedItemId: item.suggestedItemId,
          matchedProductId: item.matchedProductId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      if (result.success) {
        toast.success("تم إنشاء الطلب بنجاح! 🎉");
        router.push(`/dashboard/orders/${result.orderId}`);
      } else {
        toast.error(result.error ?? "حدث خطأ أثناء الاعتماد");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Customer Info */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">الاسم *</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="اسم العميل"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">رقم الهاتف *</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className="rounded-xl text-right"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">العنوان *</Label>
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="المدينة، الحي، الشارع"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.suggestedItemId} className="rounded-xl border border-border/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Package className="size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  اقترح الذكاء الاصطناعي:{" "}
                  <span className="font-medium text-foreground">
                    {item.aiProductName}
                    {item.aiVariant && ` — ${item.aiVariant}`}
                  </span>
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label className="mb-1 text-xs">المنتج *</Label>
                  <select
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={item.matchedProductId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                  >
                    <option value="">اختر منتج</option>
                    {storeProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1 text-xs">الكمية</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="mb-1 text-xs">السعر (جنيه)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice / 100}
                    onChange={(e) =>
                      updateItem(index, {
                        unitPrice: Math.round((parseFloat(e.target.value) || 0) * 100),
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium">الإجمالي</p>
        <p className="text-lg font-bold">{formatPrice(subtotal)}</p>
      </div>

      {/* Approve Button */}
      <Button
        className="w-full rounded-xl"
        size="lg"
        onClick={handleApprove}
        disabled={isPending || !isValid}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            جاري الإنشاء...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-5" />
            اعتماد وإنشاء الطلب
          </>
        )}
      </Button>

      {!isValid && (
        <p className="text-center text-xs text-muted-foreground">
          أكمل جميع البيانات المطلوبة (*) لتتمكن من الاعتماد
        </p>
      )}
    </div>
  );
}
