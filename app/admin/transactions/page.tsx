import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, SearchX } from "lucide-react";
import { BalanceTransactionType, Prisma } from "@prisma/client";

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
import { TX_TYPE_META, fmtDateTime, fmtMoney, fmtNum, pickEnum } from "../_lib/format";

export const metadata: Metadata = { title: "الحركات المالية" };

const PAGE_SIZE = 30;
const BASE_PATH = "/admin/transactions";
const RANGES = { "7": "آخر ٧ أيام", "30": "آخر ٣٠ يوم", "90": "آخر ٩٠ يوم", "365": "آخر سنة" } as const;

export default async function AdminTransactionsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const type = pickEnum(BalanceTransactionType, readParam(params, "type"));
  const rangeParam = readParam(params, "range");
  const range = rangeParam && rangeParam in RANGES ? (rangeParam as keyof typeof RANGES) : undefined;
  const since = range ? new Date(new Date().getTime() - Number(range) * 86_400_000) : undefined;

  const baseWhere: Prisma.BalanceTransactionWhereInput = {
    ...(since && { createdAt: { gte: since } }),
    ...(q && {
      OR: [
        { note: { contains: q, mode: "insensitive" } },
        { reference: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
        { store: { slug: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const where = { ...baseWhere, ...(type && { type }) };

  // Sums per type for the KPI strip, same filters minus the type tab.
  const [grouped, total] = await Promise.all([
    prisma.balanceTransaction.groupBy({ by: ["type"], where: baseWhere, _count: { _all: true }, _sum: { amount: true } }),
    prisma.balanceTransaction.count({ where }),
  ]);
  const byType = Object.fromEntries(grouped.map((g) => [g.type, g])) as Partial<Record<BalanceTransactionType, (typeof grouped)[number]>>;
  const sum = (t: BalanceTransactionType) => byType[t]?._sum.amount ?? 0;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const rows = await prisma.balanceTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      type: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      note: true,
      reference: true,
      createdAt: true,
      store: { select: { name: true, slug: true } },
    },
  });

  const filtered = !!(q || type || range);
  const subscriptionNet = -sum("SUBSCRIPTION_CHARGE") - Math.abs(sum("REFUND"));

  return (
    <div className="space-y-6">
      <PageHeader title="الحركات المالية" description="دفتر أرصدة كل المتاجر: شحن، خصومات اشتراك، تعديلات ومرتجعات. ده مصدر أرقام الإيراد." />

      <KpiStrip
        items={[
          { label: "صافي إيراد الاشتراكات", value: fmtMoney(subscriptionNet), hint: `${fmtNum(byType.SUBSCRIPTION_CHARGE?._count._all ?? 0)} خصم · ${range ? RANGES[range] : "من البداية"}` },
          { label: "الشحن", value: fmtMoney(sum("TOPUP")), hint: `${fmtNum(byType.TOPUP?._count._all ?? 0)} عملية` },
          { label: "تعديلات يدوية", value: fmtMoney(sum("MANUAL_ADJUSTMENT")), hint: `${fmtNum(byType.MANUAL_ADJUSTMENT?._count._all ?? 0)} تعديل` },
          { label: "بونص ومكافآت", value: fmtMoney(sum("BONUS") + sum("REFERRAL_REWARD")), hint: "رصيد مجاني اتضاف للتجار" },
        ]}
      />

      <div className="space-y-4">
        <FilterTabs
          label="نوع الحركة"
          param="type"
          basePath={BASE_PATH}
          searchParams={params}
          tabs={[
            { label: "الكل", count: grouped.reduce((s, g) => s + g._count._all, 0) },
            ...(Object.keys(TX_TYPE_META) as BalanceTransactionType[]).map((t) => ({ label: TX_TYPE_META[t].label, value: t, count: byType[t]?._count._all ?? 0 })),
          ]}
        />

        <DataCard
          toolbar={
            <>
              <SearchInput placeholder="ابحث بالمتجر أو الملاحظة أو المرجع" />
              <SelectFilter param="range" allLabel="كل الوقت" label="الفترة" options={Object.entries(RANGES).map(([value, label]) => ({ value, label }))} />
            </>
          }
          footer={total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun="حركة" />}
        >
          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="مفيش حركات بالفلاتر دي"
                action={
                  <Link href={BASE_PATH} className="text-sm text-primary hover:underline">
                    مسح الفلاتر
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={ArrowLeftRight} title="مفيش حركات مالية لسه" />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theadRow}>
                      <th className={cn(th, "ps-4")}>المتجر</th>
                      <th className={th}>النوع</th>
                      <th className={cn(th, "hidden lg:table-cell")}>ملاحظة / مرجع</th>
                      <th className={cn(th, "text-left")}>المبلغ</th>
                      <th className={cn(th, "hidden text-left xl:table-cell")}>الرصيد قبل ← بعد</th>
                      <th className={cn(th, "pe-4 text-left")}>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((tx) => (
                      <tr key={tx.id} className="transition-colors hover:bg-muted/40">
                        <td className="py-3 ps-4">
                          <Link href={`/admin/stores/${tx.store.slug}`} className="font-medium hover:underline">
                            {tx.store.name}
                          </Link>
                        </td>
                        <td className="py-3">
                          <StatusPill tone={TX_TYPE_META[tx.type].tone}>{TX_TYPE_META[tx.type].label}</StatusPill>
                        </td>
                        <td className="hidden max-w-72 py-3 lg:table-cell">
                          <p className="truncate text-muted-foreground" title={tx.note ?? undefined}>
                            {tx.note ?? "—"}
                          </p>
                          {tx.reference && (
                            <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
                              <span className="block text-right">{tx.reference}</span>
                            </p>
                          )}
                        </td>
                        <td className={cn("py-3 text-left font-medium tabular-nums", tx.amount > 0 && "text-emerald-700 dark:text-emerald-400")} dir="ltr">
                          {tx.amount > 0 ? "+" : ""}
                          {fmtMoney(tx.amount)}
                        </td>
                        <td className="hidden py-3 text-left text-xs tabular-nums text-muted-foreground xl:table-cell">
                          {fmtMoney(tx.balanceBefore)} ← {fmtMoney(tx.balanceAfter)}
                        </td>
                        <td className="py-3 pe-4 text-left text-xs text-muted-foreground">{fmtDateTime(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {rows.map((tx) => (
                  <li key={tx.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/admin/stores/${tx.store.slug}`} className="min-w-0 truncate font-medium">
                        {tx.store.name}
                      </Link>
                      <span className={cn("shrink-0 font-medium tabular-nums", tx.amount > 0 && "text-emerald-700 dark:text-emerald-400")} dir="ltr">
                        {tx.amount > 0 ? "+" : ""}
                        {fmtMoney(tx.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusPill tone={TX_TYPE_META[tx.type].tone}>{TX_TYPE_META[tx.type].label}</StatusPill>
                      {fmtDateTime(tx.createdAt)}
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
