import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import { GetMovementsAction } from "@/actions/inventory/movements.actions";
import { StockMovementBadge } from "../_components/StockMovementBadge";
import { Button } from "@/components/ui/button";
import { StockMovementType } from "@prisma/client";
import { intlLocale, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

const MOVEMENT_TYPES = [
  { value: "", get label() { return tr("الكل"); } },
  { value: "SALE", get label() { return tr("بيع"); } },
  { value: "RETURN", get label() { return tr("إرجاع"); } },
  { value: "PURCHASE", get label() { return tr("شراء"); } },
  { value: "ADJUSTMENT", get label() { return tr("تسوية"); } },
  { value: "DAMAGE", get label() { return tr("تلف"); } },
  { value: "TRANSFER_IN", get label() { return tr("تحويل وارد"); } },
  { value: "TRANSFER_OUT", get label() { return tr("تحويل صادر"); } },
];

async function MovementsTable({
  page,
  type,
  search,
}: {
  page: number;
  type?: string;
  search?: string;
}) {
  const data = await GetMovementsAction({
    page,
    pageSize: 30,
    type: type ? (type as StockMovementType) : undefined,
    search,
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">{tr("المنتج")}</th>
              <th className="px-4 py-3">{tr("النوع")}</th>
              <th className="px-4 py-3 text-center">{tr("الكمية")}</th>
              <th className="px-4 py-3 text-center">{tr("قبل")}</th>
              <th className="px-4 py-3 text-center">{tr("بعد")}</th>
              <th className="px-4 py-3">{tr("الفرع")}</th>
              <th className="px-4 py-3">{tr("ملاحظة")}</th>
              <th className="px-4 py-3">{tr("التاريخ")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  {tr("لا توجد حركات")}
                </td>
              </tr>
            ) : (
              data.items.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.product.image}
                        alt={m.product.name}
                        className="size-8 shrink-0 rounded-md object-cover"
                      />
                      <div>
                        <Link
                          href={`/dashboard/products/${m.product.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {m.product.name}
                        </Link>
                        {m.variant && (
                          <p className="text-xs text-muted-foreground">{m.variant.name}</p>
                        )}
                        {m.product.sku && (
                          <p className="font-mono text-xs text-muted-foreground">{m.product.sku}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StockMovementBadge type={m.type} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        m.quantity >= 0
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-red-500"
                      }
                    >
                      {m.quantity >= 0 ? "+" : ""}
                      {m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {m.stockBefore}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold tabular-nums">
                    {m.stockAfter}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.branch?.name ?? "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    <p className="truncate text-xs">{m.note ?? "—"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(intlLocale(), {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(m.createdAt))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            {tr("{0} - {1} من {2}", ((data.page - 1) * data.pageSize + 1).toLocaleString(intlLocale()), Math.min(data.page * data.pageSize, data.total).toLocaleString(intlLocale()), data.total.toLocaleString(intlLocale()))}
          </span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link href={`?page=${data.page - 1}${type ? `&type=${type}` : ""}`}>
                <Button variant="outline" size="sm">{tr("السابق")}</Button>
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link href={`?page=${data.page + 1}${type ? `&type=${type}` : ""}`}>
                <Button variant="outline" size="sm">{tr("التالي")}</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string; search?: string };
}) {
  await loadDashboardLocale();
  const page = parseInt(searchParams.page ?? "1", 10);
  const type = searchParams.type;
  const search = searchParams.search;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="size-4 ltr:-scale-x-100" />
            {tr("المخزون")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{tr("سجل حركات المخزون")}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {MOVEMENT_TYPES.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `?type=${t.value}&page=1` : "?page=1"}
          >
            <Button
              variant={type === t.value || (!type && !t.value) ? "default" : "outline"}
              size="sm"
            >
              {t.label}
            </Button>
          </Link>
        ))}
      </div>

      <Suspense
        key={`${page}-${type}-${search}`}
        fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
      >
        <MovementsTable page={page} type={type} search={search} />
      </Suspense>
    </div>
  );
}
