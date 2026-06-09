import Link from "next/link";
import { ArrowRight, Plus, ShoppingCart } from "lucide-react";
import { GetPurchaseOrdersAction } from "@/actions/inventory/purchase-orders.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderStatus } from "@prisma/client";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "مسودة", variant: "secondary" },
  SENT: { label: "مُرسل للمورد", variant: "outline" },
  PARTIAL: { label: "استلام جزئي", variant: "default" },
  RECEIVED: { label: "مُستلم بالكامل", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

const STATUS_FILTERS = [
  { value: "", label: "الكل" },
  { value: "DRAFT", label: "مسودة" },
  { value: "SENT", label: "مُرسل" },
  { value: "PARTIAL", label: "جزئي" },
  { value: "RECEIVED", label: "مُستلم" },
  { value: "CANCELLED", label: "ملغي" },
];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const status = searchParams.status as PurchaseOrderStatus | undefined;

  const data = await GetPurchaseOrdersAction({ page, status });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4" />
              المخزون
            </Button>
          </Link>
          <h1 className="text-xl font-bold">طلبات الشراء</h1>
        </div>
        <Link href="/dashboard/inventory/purchase-orders/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            طلب شراء جديد
          </Button>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `?status=${f.value}&page=1` : "?page=1"}
          >
            <Button
              variant={status === f.value || (!status && !f.value) ? "default" : "outline"}
              size="sm"
            >
              {f.label}
            </Button>
          </Link>
        ))}
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ShoppingCart className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">لا توجد طلبات شراء</p>
          <Link href="/dashboard/inventory/purchase-orders/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              إنشاء أول طلب شراء
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">رقم الأمر</th>
                <th className="px-4 py-3">المورد</th>
                <th className="px-4 py-3">الفرع</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-center">المنتجات</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">تاريخ الإنشاء</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((po) => {
                const cfg = STATUS_CONFIG[po.status];
                return (
                  <tr key={po.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold">{po.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">{po.supplier?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{po.branch?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{po._count.items}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(po.totalAmount / 100)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(po.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/inventory/purchase-orders/${po.id}`}>
                        <Button variant="ghost" size="sm">عرض</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">{data.total} طلب</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}>
                    <Button variant="outline" size="sm">السابق</Button>
                  </Link>
                )}
                {page < data.totalPages && (
                  <Link href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}>
                    <Button variant="outline" size="sm">التالي</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
