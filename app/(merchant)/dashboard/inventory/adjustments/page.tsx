import Link from "next/link";
import { Plus, ArrowRight, ClipboardList } from "lucide-react";
import { GetAdjustmentsAction } from "@/actions/inventory/adjustments.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdjustmentReason } from "@prisma/client";

const REASON_LABELS: Record<AdjustmentReason, string> = {
  DAMAGE: "تلف",
  THEFT: "سرقة",
  EXPIRY: "انتهاء صلاحية",
  COUNT_CORRECTION: "تصحيح جرد",
  LOSS: "ضياع",
  FOUND: "عثر عليه",
  OTHER: "أخرى",
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
  const page = parseInt(searchParams.page ?? "1", 10);
  const data = await GetAdjustmentsAction({ page });

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
          <h1 className="text-xl font-bold">تسويات المخزون</h1>
        </div>
        <Link href="/dashboard/inventory/adjustments/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            تسوية جديدة
          </Button>
        </Link>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">لا توجد تسويات بعد</p>
          <Link href="/dashboard/inventory/adjustments/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              إنشاء أول تسوية
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">السبب</th>
                <th className="px-4 py-3">عدد المنتجات</th>
                <th className="px-4 py-3">الفرع</th>
                <th className="px-4 py-3">بواسطة</th>
                <th className="px-4 py-3">ملاحظة</th>
                <th className="px-4 py-3">التاريخ</th>
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
                  <td className="px-4 py-3 tabular-nums">{a._count.items} منتج</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.branch?.name ?? "الكل"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.user.name ?? "—"}</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-xs text-muted-foreground">{a.notes ?? "—"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("ar-EG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(a.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/inventory/adjustments/${a.id}`}>
                      <Button variant="ghost" size="sm">تفاصيل</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                {data.total.toLocaleString("ar-EG")} تسوية
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}`}>
                    <Button variant="outline" size="sm">السابق</Button>
                  </Link>
                )}
                {page < data.totalPages && (
                  <Link href={`?page=${page + 1}`}>
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
