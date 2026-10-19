import Link from "next/link";
import { ArrowRight, Plus, Users } from "lucide-react";
import { GetSuppliersAction } from "@/actions/inventory/suppliers.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function formatBalance(piasters: number) {
  if (piasters === 0) return null;
  return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "EGP" }).format(
    piasters / 100,
  );
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await loadDashboardLocale();
  const page = parseInt(searchParams.page ?? "1", 10);
  const data = await GetSuppliersAction({ page });

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
          <h1 className="text-xl font-bold">{tr("الموردون")}</h1>
        </div>
        <Link href="/dashboard/inventory/suppliers/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {tr("مورد جديد")}
          </Button>
        </Link>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{tr("لا يوجد موردون بعد")}</p>
          <Link href="/dashboard/inventory/suppliers/new">
            <Button size="sm" className="mt-4 gap-2">
              <Plus className="size-4" />
              {tr("إضافة أول مورد")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{tr("الاسم")}</th>
                <th className="px-4 py-3">{tr("التواصل")}</th>
                <th className="px-4 py-3 text-center">{tr("المنتجات")}</th>
                <th className="px-4 py-3 text-center">{tr("طلبات الشراء")}</th>
                <th className="px-4 py-3">{tr("الرصيد المستحق")}</th>
                <th className="px-4 py-3">{tr("الحالة")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.phone && <p>{s.phone}</p>}
                    {s.email && <p className="text-xs">{s.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{s._count.products}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{s._count.purchaseOrders}</td>
                  <td className="px-4 py-3">
                    {s.balance > 0 ? (
                      <span className="font-semibold text-amber-600">
                        {formatBalance(s.balance)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? tr("نشط") : tr("غير نشط")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/inventory/suppliers/${s.id}`}>
                      <Button variant="ghost" size="sm">{tr("تفاصيل")}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
              <span className="text-muted-foreground">{tr("{0} مورد", data.total)}</span>
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
