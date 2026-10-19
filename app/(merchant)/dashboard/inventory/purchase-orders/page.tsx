import Link from "next/link";
import { ArrowRight, Plus, ShoppingCart } from "lucide-react";
import { GetPurchaseOrdersAction } from "@/actions/inventory/purchase-orders.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderStatus } from "@prisma/client";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { get label() { return tr("مسودة"); }, variant: "secondary" },
  SENT: { get label() { return tr("مُرسل للمورد"); }, variant: "outline" },
  PARTIAL: { get label() { return tr("استلام جزئي"); }, variant: "default" },
  RECEIVED: { get label() { return tr("مُستلم بالكامل"); }, variant: "default" },
  CANCELLED: { get label() { return tr("ملغي"); }, variant: "destructive" },
};

const STATUS_FILTERS = [
  { value: "", get label() { return tr("الكل"); } },
  { value: "DRAFT", get label() { return tr("مسودة"); } },
  { value: "SENT", get label() { return tr("مُرسل"); } },
  { value: "PARTIAL", get label() { return tr("جزئي"); } },
  { value: "RECEIVED", get label() { return tr("مُستلم"); } },
  { value: "CANCELLED", get label() { return tr("ملغي"); } },
];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  await loadDashboardLocale();
  const page = parseInt(searchParams.page ?? "1", 10);
  const status = searchParams.status as PurchaseOrderStatus | undefined;

  const data = await GetPurchaseOrdersAction({ page, status });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowRight className="size-4 ltr:-scale-x-100" />
              {tr("المخزون")}
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{tr("طلبات الشراء")}</h1>
        </div>
        <Link href="/dashboard/inventory/purchase-orders/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {tr("طلب شراء جديد")}
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
          <p className="text-muted-foreground">{tr("لا توجد طلبات شراء")}</p>
          <Link href="/dashboard/inventory/purchase-orders/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              {tr("إنشاء أول طلب شراء")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{tr("رقم الأمر")}</th>
                <th className="px-4 py-3">{tr("المورد")}</th>
                <th className="px-4 py-3">{tr("الفرع")}</th>
                <th className="px-4 py-3">{tr("الحالة")}</th>
                <th className="px-4 py-3 text-center">{tr("المنتجات")}</th>
                <th className="px-4 py-3">{tr("الإجمالي")}</th>
                <th className="px-4 py-3">{tr("تاريخ الإنشاء")}</th>
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
                      {new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "EGP" }).format(po.totalAmount / 100)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(intlLocale(), { day: "2-digit", month: "short", year: "numeric" }).format(new Date(po.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/inventory/purchase-orders/${po.id}`}>
                        <Button variant="ghost" size="sm">{tr("عرض")}</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">{tr("{0} طلب", data.total)}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}>
                    <Button variant="outline" size="sm">{tr("السابق")}</Button>
                  </Link>
                )}
                {page < data.totalPages && (
                  <Link href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}>
                    <Button variant="outline" size="sm">{tr("التالي")}</Button>
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
