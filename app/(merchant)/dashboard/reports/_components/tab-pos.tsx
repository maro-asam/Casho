import Link from "next/link";
import { Banknote, Clock, RotateCcw, Scale, Store, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, Stat } from "./report-ui";
import { tr } from "@/lib/i18n/dashboard";

export function TabPos({ pos }: { pos: NonNullable<ReportsData["pos"]> }) {
  const { shifts, returns } = pos;
  const diff = shifts.netDifference;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Store} label={tr("مبيعات الكاشير")} value={formatMoney(pos.netSales)} sub={<span>{tr("{0} فاتورة", formatNumber(pos.orders))}</span>} />
        <Stat
          icon={Clock}
          label={tr("الورديات")}
          value={formatNumber(shifts.count)}
          sub={shifts.open > 0 ? <span className="text-amber-600 dark:text-amber-400">{tr("{0} لسه مفتوحة", formatNumber(shifts.open))}</span> : undefined}
        />
        <Stat
          icon={Scale}
          label={tr("فرق الكاش")}
          value={
            <span className={cn(diff < 0 && "text-rose-600 dark:text-rose-400", diff > 0 && "text-emerald-600 dark:text-emerald-400")}>
              {diff > 0 ? "+" : ""}
              {formatMoney(diff)}
            </span>
          }
          hint={tr("مجموع (الكاش الفعلي − الكاش المتوقع) في الورديات المقفولة. بالسالب يعني عجز.")}
          sub={
            shifts.shortageShifts > 0 ? (
              <span>
                {tr("عجز {0} في {1} وردية", formatMoney(Math.abs(shifts.shortage)), formatNumber(shifts.shortageShifts))}
              </span>
            ) : shifts.overage > 0 ? (
              <span>{tr("زيادة {0}", formatMoney(shifts.overage))}</span>
            ) : undefined
          }
        />
        <Stat
          icon={RotateCcw}
          label={tr("المرتجعات")}
          value={formatMoney(returns.amount)}
          invert
          hint={tr("قيمة المرتجعات المكتملة ÷ المبيعات قبل المرتجعات.")}
          sub={
            <span>
              {tr("{0} مرتجع · {1} من المبيعات", formatNumber(returns.count), formatPercent(returns.rate))}
            </span>
          }
        />
      </div>

      {pos.branches.length > 0 && (
        <Panel title={tr("الفروع")} description={tr("مبيعات وورديات كل فرع في الفترة دي")} contentClassName="p-0">
          <ReportTable
            head={
              <>
                <th>{tr("الفرع")}</th>
                <th className="text-end!">{tr("الفواتير")}</th>
                <th className="text-end!">{tr("المبيعات")}</th>
                <th className="text-end!">{tr("المرتجعات")}</th>
                <th className="text-end!">{tr("الورديات")}</th>
                <th className="text-end!">{tr("فرق الكاش")}</th>
              </>
            }
          >
            {pos.branches.map((b) => (
              <tr key={b.id}>
                <td>
                  <span className="flex items-center gap-2 font-medium">
                    <Store className="size-4 text-muted-foreground" />
                    {b.name}
                  </span>
                </td>
                <td className="text-end tabular-nums">{formatNumber(b.orders)}</td>
                <td className="text-end font-medium tabular-nums">{formatMoney(b.netSales)}</td>
                <td className="text-end tabular-nums text-muted-foreground">{formatMoney(b.returns)}</td>
                <td className="text-end tabular-nums">
                  {formatNumber(b.shifts)}
                  {b.openShifts > 0 && (
                    <span className="ms-1 text-xs text-amber-600 dark:text-amber-400">{tr("({0} مفتوحة)", formatNumber(b.openShifts))}</span>
                  )}
                </td>
                <td
                  className={cn(
                    "text-end tabular-nums",
                    b.cashDifference < 0 && "text-rose-600 dark:text-rose-400",
                    b.cashDifference > 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {b.cashDifference > 0 ? "+" : ""}
                  {formatMoney(b.cashDifference)}
                </td>
              </tr>
            ))}
          </ReportTable>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title={tr("أداء الكاشير")}
          description={tr("مبيعات كل موظف على نقطة البيع")}
          className="lg:col-span-2"
          contentClassName={pos.cashiers.length ? "p-0" : undefined}
          action={
            <Link href="/pos/shifts" className="text-xs font-medium text-primary hover:underline">
              {tr("الورديات")}
            </Link>
          }
        >
          {pos.cashiers.length ? (
            <ReportTable
              head={
                <>
                  <th>{tr("الكاشير")}</th>
                  <th className="text-end!">{tr("الفواتير")}</th>
                  <th className="text-end!">{tr("المبيعات")}</th>
                  <th className="text-end!">{tr("متوسط الفاتورة")}</th>
                  <th className="text-end!">{tr("الخصومات")}</th>
                </>
              }
            >
              {pos.cashiers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="flex items-center gap-2 font-medium">
                      <UserRound className="size-4 text-muted-foreground" />
                      {c.name}
                    </span>
                  </td>
                  <td className="text-end tabular-nums">{formatNumber(c.orders)}</td>
                  <td className="text-end font-medium tabular-nums">{formatMoney(c.netSales)}</td>
                  <td className="text-end tabular-nums">{formatMoney(c.aov)}</td>
                  <td className="text-end tabular-nums text-muted-foreground">{formatMoney(c.discounts)}</td>
                </tr>
              ))}
            </ReportTable>
          ) : (
            <EmptyNote icon={Banknote} title={tr("مفيش مبيعات كاشير في الفترة دي")} />
          )}
        </Panel>

        <Panel
          title={tr("أكتر المنتجات رجوعًا")}
          action={
            <Link href="/pos/returns" className="text-xs font-medium text-primary hover:underline">
              {tr("المرتجعات")}
            </Link>
          }
        >
          {returns.topProducts.length ? (
            <ul className="space-y-3">
              {returns.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {tr("{0} قطعة · {1}", formatNumber(p.quantity), formatMoney(p.amount))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{tr("مفيش مرتجعات في الفترة دي.")}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
