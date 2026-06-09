import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GetPurchaseOrderDetailAction } from "@/actions/inventory/purchase-orders.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderStatus } from "@prisma/client";
import { POActions } from "./_components/POActions";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "مسودة", variant: "secondary" },
  SENT: { label: "مُرسل للمورد", variant: "outline" },
  PARTIAL: { label: "استلام جزئي", variant: "default" },
  RECEIVED: { label: "مُستلم بالكامل", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

export default async function PODetailPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  const po = await GetPurchaseOrderDetailAction(poId);
  const cfg = STATUS_CONFIG[po.status];

  const receivedTotal = po.items.reduce((s, i) => s + i.receivedQuantity * i.unitCost, 0);
  const pendingTotal = po.totalAmount - receivedTotal;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/purchase-orders">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4" />
              طلبات الشراء
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{po.orderNumber}</h1>
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
        </div>
        <POActions po={po} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">تفاصيل الطلب</h2>
          <dl className="space-y-3 text-sm">
            {po.supplier && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">المورد</dt>
                <dd>
                  <Link href={`/dashboard/inventory/suppliers/${po.supplier.id}`} className="hover:underline">
                    {po.supplier.name}
                  </Link>
                </dd>
              </div>
            )}
            {po.branch && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">الفرع</dt>
                <dd>{po.branch.name}</dd>
              </div>
            )}
            {po.expectedDate && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">تاريخ الاستلام</dt>
                <dd>
                  {new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(po.expectedDate))}
                </dd>
              </div>
            )}
            {po.receivedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">تاريخ الاستلام الفعلي</dt>
                <dd>
                  {new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(po.receivedAt))}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">أُنشئ بواسطة</dt>
              <dd>{po.createdBy.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">تاريخ الإنشاء</dt>
              <dd>{new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(po.createdAt))}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الإجمالي الكلي</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(po.totalAmount / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تم استلامه</span>
              <span className="font-semibold text-emerald-600">
                {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(receivedTotal / 100)}
              </span>
            </div>
            {pendingTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">متبقي</span>
                <span className="font-semibold text-amber-600">
                  {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(pendingTotal / 100)}
                </span>
              </div>
            )}
          </div>
          {po.notes && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {po.notes}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <h2 className="border-b border-border px-5 py-4 font-semibold">
            المنتجات ({po.items.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">المنتج</th>
                <th className="px-4 py-3 text-center">الكمية المطلوبة</th>
                <th className="px-4 py-3 text-center">المُستلم</th>
                <th className="px-4 py-3 text-center">المتبقي</th>
                <th className="px-4 py-3 text-center">سعر الوحدة</th>
                <th className="px-4 py-3 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {po.items.map((item) => {
                const remaining = item.quantity - item.receivedQuantity;
                const pct = Math.round((item.receivedQuantity / item.quantity) * 100);
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={item.product.image} alt={item.product.name} className="size-9 rounded-md object-cover" />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                          {item.product.sku && <p className="font-mono text-xs text-muted-foreground">{item.product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={item.receivedQuantity === item.quantity ? "font-semibold text-emerald-600" : "tabular-nums"}>
                        {item.receivedQuantity}
                      </span>
                      {pct > 0 && pct < 100 && (
                        <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-center tabular-nums ${remaining > 0 ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
                      {remaining}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(item.unitCost / 100)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold tabular-nums">
                      {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(item.totalCost / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
