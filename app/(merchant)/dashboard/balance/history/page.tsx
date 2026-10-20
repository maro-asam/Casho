import Link from "next/link";
import type { Metadata } from "next";
import type { BalanceTransactionType, Prisma } from "@prisma/client";
import { ChevronRight, Download, History, SearchX, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  LargeTitle,
  Pager,
  SearchInput,
  Segmented,
  SelectFilter,
  Unavailable,
  appleButton,
  readPage,
  readParam,
  type SearchParamsRecord,
} from "@/components/saas-page";
import { TX_TYPES, formatMoney } from "@/lib/balance-ui/meta";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { TxRow } from "../_components/tx-row";
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
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول.")} />
      </div>
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
      <LargeTitle
        eyebrow={
          <Link href="/balance" className={cn(appleButton.plain, "-ms-1 h-8 gap-0.5 px-1")}>
            <ChevronRight className="size-[18px] ltr:-scale-x-100" strokeWidth={2.4} />
            {tr("الرصيد")}
          </Link>
        }
        title={tr("سجل الحركات")}
        subtitle={
          allCount > 0 ? (
            <>
              {tr("دخل")}{" "}<span className="font-semibold text-(--sys-green) tabular-nums">{formatMoney(inflow)}</span>{" "}{tr("· خرج")}{" "}
              <span className="font-semibold text-foreground tabular-nums">{formatMoney(Math.abs(outflow))}</span>
              {days ? ` — ${PERIODS.find((p) => Number(p.value) === days)?.label}` : tr(" — من البداية")}
            </>
          ) : (
            tr("كل شحنة وكل تجديد اتعمل على رصيدك.")
          )
        }
        actions={
          storeHasAny && (
            <a href={`/dashboard/balance/history/export?${exportParams.toString()}`} className={appleButton.gray}>
              <Download className="size-4" />
              {tr("تصدير CSV")}
            </a>
          )
        }
      />

      {!storeHasAny ? (
        <div className="apple-card">
          <Unavailable
            icon={History}
            title={tr("لسه مفيش حركات")}
            description={tr("أول ما تشحن رصيد أو يتجدد الاشتراك، كل حركة هتتسجل هنا بالرصيد قبلها وبعدها.")}
            action={
              <Link href="/balance/topup" className={appleButton.filled}>
                {tr("اشحن رصيد")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented
            label={tr("نوع الحركة")}
            param="type"
            basePath={BASE_PATH}
            searchParams={params}
            segments={[
              { label: tr("الكل"), count: allCount },
              ...TX_TYPES.filter((t) => countFor(t.value) > 0 || type === t.value).map((t) => ({ label: t.label, value: t.value, count: countFor(t.value) })),
            ]}
          />

          <section className="apple-card overflow-hidden">
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SearchInput
                placeholder={tr("ابحث في الملاحظات أو رقم المرجع")}
                className="sm:max-w-sm"
                inputClassName="h-9 rounded-[10px] border-0 bg-muted text-[15px] focus-visible:ring-primary/40"
              />
              <SelectFilter
                label={tr("الفترة")}
                param="days"
                allLabel={tr("من البداية")}
                options={PERIODS}
                className="h-9 rounded-full border-0 bg-muted text-[15px] shadow-none sm:w-40"
              />
            </div>

            {rows.length === 0 ? (
              <Unavailable
                icon={SearchX}
                title={tr("مفيش حركات بالفلاتر دي")}
                description={tr("جرّب نوع أو فترة تانية.")}
                className="border-t-[0.5px] border-border"
                action={
                  hasFilters && (
                    <Link href={BASE_PATH} className={appleButton.tinted}>
                      {tr("مسح الفلاتر")}
                    </Link>
                  )
                }
              />
            ) : (
              <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:72px]">
                {rows.map((t) => (
                  <TxRow key={t.id} t={t} date={dtf.format(t.createdAt)} showBefore />
                ))}
              </ul>
            )}

            {total > 0 && (
              <div className="border-t-[0.5px] border-border">
                <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath={BASE_PATH} searchParams={params} noun={tr("حركة")} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
