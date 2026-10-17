import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, ShoppingCart } from "lucide-react";
import { OrderSource, OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DataCard,
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
  StatusPill,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { KpiStrip, th, theadRow } from "../_components/admin-ui";
import { ORDER_STATUS_META, fmtDateTime, fmtMoney, fmtNum, fmtRelative, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "طلبات المتاجر" };

const PAGE_SIZE = 25;
const BASE_PATH = "/admin/orders";
const SOURCE_LABELS: Record<OrderSource, string> = { ONLINE: "أونلاين", POS: "نقطة البيع", INSTAGRAM: "إنستجرام" };
const RANGES = { "7": "آخر ٧ أيام", "30": "آخر ٣٠ يوم", "90": "آخر ٩٠ يوم" } as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = pickEnum(OrderStatus, readParam(params, "status"));
  const source = pickEnum(OrderSource, readParam(params, "source"));
  const rangeParam = readParam(params, "range");
  const range = rangeParam && rangeParam in RANGES ? (rangeParam as keyof typeof RANGES) : undefined;
  const since = range ? new Date(new Date().getTime() - Number(range) * 86_400_000) : undefined;

  const baseWhere: Prisma.OrderWhereInput = {
    ...(source && { source }),
    ...(since && { createdAt: { gte: since } }),
    ...(q && {
      OR: [
        { id: { startsWith: q } },
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { store: { slug: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(status && { status }) };

  const [grouped, total, totals] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { ...where, status: status ?? { not: "CANCELED" } }, _sum: { total: true }, _avg: { total: true }, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<OrderStatus, number>>;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const [orders, activeStores] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        status: true,
        source: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        store: { select: { name: true, slug: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.groupBy({ by: ["storeId"], where: { ...where, status: status ?? { not: "CANCELED" } } }),
  ]);

  const now = new Date();
  const filtered = !!(q || status || source || range);

  return (
    <div className="space-y-6">
      <PageHeader title="طلبات المتاجر" description="كل الطلبات على المنصة للمتابعة والدعم. إدارة الطلب نفسه بتبقى من لوحة التاجر." />

      <KpiStrip
        items={[
          { label: "قيمة الطلبات", value: fmtMoney(totals._sum.total ?? 0), hint: status === "CANCELED" ? "الملغية بس" : "من غير الملغي" },
          { label: "عدد الطلبات", value: fmtNum(totals._count._all) },
          { label: "متوسط الطلب", value: fmtMoney(Math.round(totals._avg.total ?? 0)) },
          { label: "متاجر عليها طلبات", value: fmtNum(activeStores.length), hint: range ? RANGES[range] : "من البداية" },
        ]}
      />

      <div className="space-y-4">
        <FilterTabs
          label="حالة الطلب"
          param="status"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            ...(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((s) => ({ label: ORDER_STATUS_META[s].label, value: s, count: counts[s] ?? 0 })),
          ]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث برقم الطلب أو العميل أو الموبايل أو المتجر" className="sm:max-w-sm" />
              <div className="flex gap-2">
                <SelectFilter param="source" allLabel="كل القنوات" label="القناة" options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))} />
                <SelectFilter param="range" allLabel="كل الوقت" label="الفترة" options={Object.entries(RANGES).map(([value, label]) => ({ value, label }))} />
              </div>
            </>
          }
          footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="طلب" />}
        >
          {orders.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="مفيش طلبات بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={ShoppingCart} title="مفيش طلبات على المنصة لسه" />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>الطلب</th>
                      <th className={th}>المتجر</th>
                      <th className={cn(th, "hidden lg:table-cell")}>القناة</th>
                      <th className={th}>الحالة</th>
                      <th className={cn(th, "text-left")}>الإجمالي</th>
                      <th className={cn(th, "hidden pe-4 text-left xl:table-cell")}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-muted/40">
                        <td className="py-3 ps-4">
                          <p className="font-medium">{o.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono" dir="ltr">
                              #{o.id.slice(0, 8)}
                            </span>{" "}
                            · {fmtNum(o._count.items)} صنف
                          </p>
                        </td>
                        <td className="py-3">
                          <Link href={`/admin/stores/${o.store.slug}`} className="hover:underline">
                            {o.store.name}
                          </Link>
                        </td>
                        <td className="hidden py-3 text-muted-foreground lg:table-cell">{SOURCE_LABELS[o.source]}</td>
                        <td className="py-3">
                          <StatusPill tone={ORDER_STATUS_META[o.status].tone}>{ORDER_STATUS_META[o.status].label}</StatusPill>
                        </td>
                        <td className="py-3 text-left font-medium tabular-nums">{fmtMoney(o.total)}</td>
                        <td className="hidden py-3 pe-4 text-left text-xs text-muted-foreground xl:table-cell" title={fmtDateTime(o.createdAt)}>
                          {fmtRelative(o.createdAt, now)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {orders.map((o) => (
                  <li key={o.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">{o.fullName}</p>
                      <span className="shrink-0 font-medium tabular-nums">{fmtMoney(o.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Link href={`/admin/stores/${o.store.slug}`} className="hover:underline">
                        {o.store.name}
                      </Link>{" "}
                      · {fmtRelative(o.createdAt, now)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusPill tone={ORDER_STATUS_META[o.status].tone}>{ORDER_STATUS_META[o.status].label}</StatusPill>
                      {SOURCE_LABELS[o.source]}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataCard>
      </div>
    </div>
  );
}
