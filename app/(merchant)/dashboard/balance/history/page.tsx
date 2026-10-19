import Link from "next/link";
import type { Metadata } from "next";
import type { BalanceTransactionType, Prisma } from "@prisma/client";
import { ArrowRight, Download, History, SearchX, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TX_TYPES, formatMoney, formatSigned, txMeta } from "@/lib/balance-ui/meta";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("سجل الحركات"),
};
}

const PAGE_SIZE = 25;
const BASE_PATH = "/balance/history";
const PERIODS = [
  { value: "30", get label() { return tr("آخر ٣٠ يوم"); } },
  { value: "90", get label() { return tr("آخر ٣ شهور"); } },
  { value: "365", get label() { return tr("آخر سنة"); } },
];
const dtf = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const daysAgo = (days: number) => new Date(new Date().getTime() - days * 86400_000);
const isoDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(d);

type HistoryRouteProps = { searchParams?: Promise<SearchParamsRecord> };

export default async function BalanceHistoryRoute({ searchParams }: HistoryRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) {
    return (
      <EmptyState icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول.")} className="rounded-xl border border-dashed border-border" />
    );
  }

  // ── Filters (all in the URL so every view is shareable) ──────────────
  const q = readParam(params, "q");
  const typeParam = readParam(params, "type");
  const type = TX_TYPES.some((t) => t.value === typeParam) ? (typeParam as BalanceTransactionType) : undefined;
  const daysParam = readParam(params, "days");
  const days = PERIODS.some((p) => p.value === daysParam) ? Number(daysParam) : undefined;
  const from = days ? daysAgo(days) : undefined;

  const baseWhere: Prisma.BalanceTransactionWhereInput = {
    storeId: store.id,
    ...(from && { createdAt: { gte: from } }),
    ...(q && { OR: [{ note: { contains: q, mode: "insensitive" } }, { reference: { contains: q } }] }),
  };

  // Tab counts share search + period with the list, so each number matches its tab.
  const [typeStats, storeHasAny] = await Promise.all([
    prisma.balanceTransaction.groupBy({ by: ["type"], where: baseWhere, _count: { _all: true }, _sum: { amount: true } }),
    prisma.balanceTransaction.count({ where: { storeId: store.id } }).then((n) => n > 0),
  ]);
  const countFor = (t: BalanceTransactionType) => typeStats.find((s) => s.type === t)?._count._all ?? 0;
  const allCount = typeStats.reduce((s, t) => s + t._count._all, 0);
  const total = type ? countFor(type) : allCount;
  const inflow = typeStats.reduce((s, t) => s + Math.max(0, t._sum.amount ?? 0), 0);
  const outflow = typeStats.reduce((s, t) => s + Math.min(0, t._sum.amount ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(readPage(params), totalPages);
  const rows = await prisma.balanceTransaction.findMany({
    where: { ...baseWhere, ...(type && { type }) },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, type: true, amount: true, note: true, reference: true, balanceBefore: true, balanceAfter: true, createdAt: true },
  });

  const exportParams = new URLSearchParams({
    ...(type && { type }),
    ...(q && { q }),
    ...(from && { from: isoDay(from) }),
  });
  const hasFilters = Boolean(q || type || days);

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("سجل الحركات")}
        description={
          allCount > 0 ? (
            <>
              {tr("دخل")}{" "}<span className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400">{formatMoney(inflow)}</span>{" "}{tr("· خرج")}{" "}
              <span className="font-medium text-foreground tabular-nums">{formatMoney(Math.abs(outflow))}</span>
              {days ? ` — ${PERIODS.find((p) => Number(p.value) === days)?.label}` : tr(" — من البداية")}
            </>
          ) : (
            tr("كل شحنة وكل تجديد اتعمل على رصيدك.")
          )
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/balance">
                <ArrowRight className="size-4 ltr:-scale-x-100" />
                {tr("الرصيد")}
              </Link>
            </Button>
            {storeHasAny && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={`/dashboard/balance/history/export?${exportParams.toString()}`}>
                  <Download className="size-4" />
                  {tr("تصدير CSV")}
                </a>
              </Button>
            )}
          </>
        }
      />

      {!storeHasAny ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={History}
            title={tr("لسه مفيش حركات")}
            description={tr("أول ما تشحن رصيد أو يتجدد الاشتراك، كل حركة هتتسجل هنا بالرصيد قبلها وبعدها.")}
            action={
              <Button asChild size="sm">
                <Link href="/balance/topup">{tr("اشحن رصيد")}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <FilterTabs
            label={tr("نوع الحركة")}
            param="type"
            basePath={BASE_PATH}
            searchParams={params}
            tabs={[
              { label: tr("الكل"), count: allCount },
              ...TX_TYPES.filter((t) => countFor(t.value) > 0 || type === t.value).map((t) => ({ label: t.label, value: t.value, count: countFor(t.value) })),
            ]}
          />
          <DataCard
            toolbar={
              <>
                <SearchInput placeholder={tr("ابحث في الملاحظات أو رقم المرجع")} />
                <SelectFilter label={tr("الفترة")} param="days" allLabel={tr("من البداية")} options={PERIODS} />
              </>
            }
            footer={
              total > 0 ? <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("حركة")} /> : undefined
            }
          >
            {rows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={tr("مفيش حركات بالفلاتر دي")}
                description={tr("جرّب نوع أو فترة تانية.")}
                action={
                  hasFilters && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={BASE_PATH}>{tr("مسح الفلاتر")}</Link>
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-10 ps-4 text-start text-xs font-medium text-muted-foreground">{tr("الحركة")}</TableHead>
                        <TableHead className="h-10 text-start text-xs font-medium text-muted-foreground">{tr("التاريخ")}</TableHead>
                        <TableHead className="h-10 text-end text-xs font-medium text-muted-foreground">{tr("المبلغ")}</TableHead>
                        <TableHead className="hidden h-10 text-end text-xs font-medium text-muted-foreground lg:table-cell">{tr("قبلها")}</TableHead>
                        <TableHead className="h-10 pe-4 text-end text-xs font-medium text-muted-foreground">{tr("بعدها")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((t) => {
                        const meta = txMeta(t.type);
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="py-3 ps-4">
                              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                              {t.note && <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{trv(t.note)}</p>}
                              {t.reference && (
                                <p className="font-mono text-[11px] text-muted-foreground/80" dir="ltr">
                                  #{t.reference.slice(0, 10)}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground">{dtf.format(t.createdAt)}</TableCell>
                            <TableCell
                              dir="ltr"
                              className={cn("py-3 text-left text-sm font-semibold tabular-nums", t.amount > 0 && "text-emerald-700 dark:text-emerald-400")}
                            >
                              {formatSigned(t.amount)}
                            </TableCell>
                            <TableCell className="hidden py-3 text-end text-sm text-muted-foreground tabular-nums lg:table-cell">{formatMoney(t.balanceBefore)}</TableCell>
                            <TableCell className="py-3 pe-4 text-end text-sm tabular-nums">{formatMoney(t.balanceAfter)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <ul className="divide-y divide-border md:hidden">
                  {rows.map((t) => {
                    const meta = txMeta(t.type);
                    return (
                      <li key={t.id} className="space-y-1.5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                          <span dir="ltr" className={cn("text-sm font-semibold tabular-nums", t.amount > 0 && "text-emerald-700 dark:text-emerald-400")}>
                            {formatSigned(t.amount)}
                          </span>
                        </div>
                        {t.note && <p className="truncate text-xs text-muted-foreground">{trv(t.note)}</p>}
                        <p className="flex justify-between text-xs text-muted-foreground">
                          <span>{dtf.format(t.createdAt)}</span>
                          <span className="tabular-nums">{tr("الرصيد {0}", formatMoney(t.balanceAfter))}</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </DataCard>
        </div>
      )}
    </div>
  );
}
