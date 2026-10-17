import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PageHeader, SelectFilter, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { KpiStrip, Panel, PanelEmpty, th, theadRow } from "../_components/admin-ui";
import { EARNED_COMMISSION, cairoMonthStart, getFinanceTotals, getMonthlyFinance, margin } from "../_lib/finance";
import { fmtMoney, fmtNum } from "../_lib/format";

export const metadata: Metadata = { title: "الأرباح" };
export const dynamic = "force-dynamic";

const RANGES = { "6": "آخر ٦ شهور", "12": "آخر ١٢ شهر", "24": "آخر ٢٤ شهر" } as const;
const pctFmt = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 1 });
const fmtPct = (r: number | null) => (r === null ? "—" : pctFmt.format(r));

export default async function AdminProfitPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const rangeParam = readParam(params, "months");
  const range = rangeParam && rangeParam in RANGES ? (rangeParam as keyof typeof RANGES) : "12";

  const [months, totals] = await Promise.all([getMonthlyFinance(Number(range)), getFinanceTotals()]);
  const since = cairoMonthStart(-(Number(range) - 1));

  // Commission cost per rep in the same window (by charge date, earned statuses).
  const byRep = await prisma.salesCommission.groupBy({
    by: ["salesRepId"],
    where: { paymentAt: { gte: since }, status: { in: EARNED_COMMISSION } },
    _sum: { amount: true, basisAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { amount: "desc" } },
  });
  const reps = byRep.length
    ? await prisma.salesRep.findMany({ where: { id: { in: byRep.map((r) => r.salesRepId) } }, select: { id: true, user: { select: { name: true, email: true } } } })
    : [];
  const repName = new Map(reps.map((r) => [r.id, r.user.name ?? r.user.email]));

  const window = months.reduce(
    (acc, m) => ({ charges: acc.charges + m.charges, refunds: acc.refunds + m.refunds, revenue: acc.revenue + m.revenue, commissions: acc.commissions + m.commissions, profit: acc.profit + m.profit }),
    { charges: 0, refunds: 0, revenue: 0, commissions: 0, profit: 0 },
  );
  const rows = [...months].reverse(); // newest first

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأرباح"
        description="صافي الربح = إيراد الاشتراكات (ناقص المرتجع) ناقص عمولات فريق المبيعات. العمولة بتتحسب في شهر الدفعة اللي جت منها."
        actions={<SelectFilter param="months" allLabel={RANGES["12"]} label="الفترة" options={[{ value: "6", label: RANGES["6"] }, { value: "24", label: RANGES["24"] }]} />}
      />

      <KpiStrip
        items={[
          { label: `صافي الربح (${RANGES[range]})`, value: fmtMoney(window.profit), hint: `هامش ${fmtPct(margin(window.profit, window.revenue))} · من البداية ${fmtMoney(totals.profit)}` },
          { label: "صافي إيراد الاشتراكات", value: fmtMoney(window.revenue), hint: `${fmtMoney(window.charges)} اشتراكات − ${fmtMoney(window.refunds)} مرتجع`, href: "/admin/transactions?type=SUBSCRIPTION_CHARGE" },
          {
            label: "عمولات المبيعات",
            value: fmtMoney(window.commissions),
            hint: `${fmtPct(margin(window.commissions, window.revenue))} من الإيراد`,
            href: "/admin/sales/commissions",
          },
          {
            label: "مستحق للمندوبين دلوقتي",
            value: fmtMoney(totals.owed),
            hint: `اتصرف ${fmtMoney(totals.paidOut)} في ${fmtNum(totals.payoutCount)} دفعة${totals.onHold ? ` · ${fmtMoney(totals.onHold)} معلّق` : ""}`,
            href: "/admin/sales/payouts",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="شهر بشهر" description="الشهر الحالي لسه مكملش." className="xl:col-span-2" flush>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={cn(th, "ps-4")}>الشهر</th>
                  <th className={cn(th, "hidden text-left md:table-cell")}>الاشتراكات</th>
                  <th className={cn(th, "hidden text-left md:table-cell")}>المرتجع</th>
                  <th className={cn(th, "text-left")}>صافي الإيراد</th>
                  <th className={cn(th, "text-left")}>العمولات</th>
                  <th className={cn(th, "text-left")}>صافي الربح</th>
                  <th className={cn(th, "hidden pe-4 text-left sm:table-cell")}>الهامش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m, i) => (
                  <tr key={m.key} className={cn(i === 0 && "bg-muted/20")}>
                    <td className="py-3 ps-4 font-medium">
                      {m.longLabel}
                      {i === 0 && <span className="ms-1.5 text-xs font-normal text-muted-foreground">(لحد النهارده)</span>}
                    </td>
                    <td className="hidden py-3 text-left tabular-nums md:table-cell">{fmtMoney(m.charges)}</td>
                    <td className="hidden py-3 text-left tabular-nums text-muted-foreground md:table-cell">{m.refunds ? `−${fmtMoney(m.refunds)}` : "—"}</td>
                    <td className="py-3 text-left tabular-nums">{fmtMoney(m.revenue)}</td>
                    <td className="py-3 text-left tabular-nums text-muted-foreground">{m.commissions ? `−${fmtMoney(m.commissions)}` : "—"}</td>
                    <td className={cn("py-3 text-left font-semibold tabular-nums", m.profit < 0 && "text-rose-700 dark:text-rose-400")}>{fmtMoney(m.profit)}</td>
                    <td className="hidden py-3 pe-4 text-left text-muted-foreground tabular-nums sm:table-cell">{fmtPct(margin(m.profit, m.revenue))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                  <td className="py-3 ps-4">الإجمالي</td>
                  <td className="hidden py-3 text-left tabular-nums md:table-cell">{fmtMoney(window.charges)}</td>
                  <td className="hidden py-3 text-left tabular-nums md:table-cell">{window.refunds ? `−${fmtMoney(window.refunds)}` : "—"}</td>
                  <td className="py-3 text-left tabular-nums">{fmtMoney(window.revenue)}</td>
                  <td className="py-3 text-left tabular-nums">{window.commissions ? `−${fmtMoney(window.commissions)}` : "—"}</td>
                  <td className={cn("py-3 text-left tabular-nums", window.profit < 0 && "text-rose-700 dark:text-rose-400")}>{fmtMoney(window.profit)}</td>
                  <td className="hidden py-3 pe-4 text-left tabular-nums sm:table-cell">{fmtPct(margin(window.profit, window.revenue))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel
          title="العمولات حسب المندوب"
          description={RANGES[range]}
          flush
          className="h-fit"
          actions={
            <Link href="/admin/sales" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              فريق المبيعات <ArrowUpRight className="size-3" />
            </Link>
          }
        >
          {byRep.length === 0 ? (
            <PanelEmpty>مفيش عمولات في الفترة دي.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {byRep.map((r) => {
                const amount = r._sum.amount ?? 0;
                const share = window.commissions > 0 ? amount / window.commissions : 0;
                return (
                  <li key={r.salesRepId} className="space-y-1.5 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/admin/sales/reps/${r.salesRepId}`} className="min-w-0 truncate font-medium hover:underline">
                        {repName.get(r.salesRepId) ?? "مندوب"}
                      </Link>
                      <span className="shrink-0 font-semibold tabular-nums">{fmtMoney(amount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtNum(r._count._all)} عمولة على {fmtMoney(r._sum.basisAmount ?? 0)} اشتراكات
                    </p>
                    <div className="h-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${fmtPct(share)} من العمولات`}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
            الأرقام قبل التعديلات اليدوية والاسترجاعات؛ الإجمالي في الجدول شاملها.
          </p>
        </Panel>
      </div>
    </div>
  );
}
