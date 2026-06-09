import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Plus } from "lucide-react";
import { GetTransfersAction } from "@/actions/inventory/transfers.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransferStatus } from "@prisma/client";

const STATUS_CONFIG: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "معلق", variant: "secondary" },
  APPROVED: { label: "موافق عليه", variant: "outline" },
  SHIPPED: { label: "في الطريق", variant: "default" },
  RECEIVED: { label: "مُستلم", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

const FILTERS = [
  { value: "", label: "الكل" },
  { value: "PENDING", label: "معلق" },
  { value: "APPROVED", label: "موافق" },
  { value: "SHIPPED", label: "في الطريق" },
  { value: "RECEIVED", label: "مُستلم" },
];

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const status = searchParams.status as TransferStatus | undefined;

  const data = await GetTransfersAction({ page, status });

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
          <h1 className="text-xl font-bold">تحويلات المخزون بين الفروع</h1>
        </div>
        <Link href="/dashboard/inventory/transfers/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            تحويل جديد
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.value} href={f.value ? `?status=${f.value}&page=1` : "?page=1"}>
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
          <ArrowLeftRight className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">لا توجد تحويلات بعد</p>
          <Link href="/dashboard/inventory/transfers/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              إنشاء تحويل
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">من</th>
                <th className="px-4 py-3">إلى</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-center">المنتجات</th>
                <th className="px-4 py-3">مرجع</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((t) => {
                const cfg = STATUS_CONFIG[t.status];
                return (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{t.fromBranch.name}</td>
                    <td className="px-4 py-3 font-medium">{t.toBranch.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{t._count.items}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {t.reference ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(t.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/inventory/transfers/${t.id}`}>
                        <Button variant="ghost" size="sm">تفاصيل</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">{data.total} تحويل</span>
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
