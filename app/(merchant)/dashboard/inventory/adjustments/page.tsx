import Link from "next/link";
import { Plus, ArrowRight, ClipboardList } from "lucide-react";
import { GetAdjustmentsAction } from "@/actions/inventory/adjustments.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdjustmentReason } from "@prisma/client";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const REASON_LABELS: Record<AdjustmentReason, string> = {
  get DAMAGE() { return tr("تلف"); },
  get THEFT() { return tr("سرقة"); },
  get EXPIRY() { return tr("انتهاء صلاحية"); },
  get COUNT_CORRECTION() { return tr("تصحيح جرد"); },
  get LOSS() { return tr("ضياع"); },
  get FOUND() { return tr("عثر عليه"); },
  get OTHER() { return tr("أخرى"); },
};

const REASON_VARIANTS: Record<AdjustmentReason, "destructive" | "secondary" | "outline"> = {
  DAMAGE: "destructive",
  THEFT: "destructive",
  EXPIRY: "destructive",
  COUNT_CORRECTION: "secondary",
  LOSS: "destructive",
  FOUND: "secondary",
  OTHER: "outline",
};

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await loadDashboardLocale();
  const page = parseInt(searchParams.page ?? "1", 10);
  const data = await GetAdjustmentsAction({ page });

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
          <h1 className="text-xl font-bold">{tr("تسويات المخزون")}</h1>
        </div>
        <Link href="/dashboard/inventory/adjustments/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {tr("تسوية جديدة")}
          </Button>
        </Link>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{tr("لا توجد تسويات بعد")}</p>
          <Link href="/dashboard/inventory/adjustments/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              {tr("إنشاء أول تسوية")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{tr("السبب")}</th>
                <th className="px-4 py-3">{tr("عدد المنتجات")}</th>
                <th className="px-4 py-3">{tr("الفرع")}</th>
                <th className="px-4 py-3">{tr("بواسطة")}</th>
                <th className="px-4 py-3">{tr("ملاحظة")}</th>
                <th className="px-4 py-3">{tr("التاريخ")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Badge variant={REASON_VARIANTS[a.reason]}>
                      {REASON_LABELS[a.reason]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{tr("{0} منتج", a._count.items)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.branch?.name ?? tr("الكل")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.user.name ?? "—"}</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-xs text-muted-foreground">{a.notes ?? "—"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(intlLocale(), {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(a.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/inventory/adjustments/${a.id}`}>
                      <Button variant="ghost" size="sm">{tr("تفاصيل")}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                {tr("{0} تسوية", data.total.toLocaleString(intlLocale()))}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}`}>
                    <Button variant="outline" size="sm">{tr("السابق")}</Button>
                  </Link>
                )}
                {page < data.totalPages && (
                  <Link href={`?page=${page + 1}`}>
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
