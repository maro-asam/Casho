import Link from "next/link";
import { Banknote, Clock, RotateCcw, Scale, Store, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, Stat } from "./report-ui";

export function TabPos({ pos }: { pos: NonNullable<ReportsData["pos"]> }) {
  const { shifts, returns } = pos;
  const diff = shifts.netDifference;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Store} label="مبيعات الكاشير" value={formatMoney(pos.netSales)} sub={<span>{formatNumber(pos.orders)} فاتورة</span>} />
        <Stat
          icon={Clock}
          label="الورديات"
          value={formatNumber(shifts.count)}
          sub={shifts.open > 0 ? <span className="text-amber-600 dark:text-amber-400">{formatNumber(shifts.open)} لسه مفتوحة</span> : undefined}
        />
        <Stat
          icon={Scale}
          label="فرق الكاش"
          value={
            <span className={cn(diff < 0 && "text-rose-600 dark:text-rose-400", diff > 0 && "text-emerald-600 dark:text-emerald-400")}>
              {diff > 0 ? "+" : ""}
              {formatMoney(diff)}
            </span>
          }
          hint="مجموع (الكاش الفعلي − الكاش المتوقع) في الورديات المقفولة. بالسالب يعني عجز."
          sub={
            shifts.shortageShifts > 0 ? (
              <span>
                عجز {formatMoney(Math.abs(shifts.shortage))} في {formatNumber(shifts.shortageShifts)} وردية
              </span>
            ) : shifts.overage > 0 ? (
              <span>زيادة {formatMoney(shifts.overage)}</span>
            ) : undefined
          }
        />
        <Stat
          icon={RotateCcw}
          label="المرتجعات"
          value={formatMoney(returns.amount)}
          invert
          hint="قيمة المرتجعات المكتملة ÷ المبيعات قبل المرتجعات."
          sub={
            <span>
              {formatNumber(returns.count)} مرتجع · {formatPercent(returns.rate)} من المبيعات
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="أداء الكاشير"
          description="مبيعات كل موظف على نقطة البيع"
          className="lg:col-span-2"
          contentClassName={pos.cashiers.length ? "p-0" : undefined}
          action={
            <Link href="/pos/shifts" className="text-xs font-medium text-primary hover:underline">
              الورديات
            </Link>
          }
        >
          {pos.cashiers.length ? (
            <ReportTable
              head={
                <>
                  <th>الكاشير</th>
                  <th className="text-left!">الفواتير</th>
                  <th className="text-left!">المبيعات</th>
                  <th className="text-left!">متوسط الفاتورة</th>
                  <th className="text-left!">الخصومات</th>
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
                  <td className="text-left tabular-nums">{formatNumber(c.orders)}</td>
                  <td className="text-left font-medium tabular-nums">{formatMoney(c.netSales)}</td>
                  <td className="text-left tabular-nums">{formatMoney(c.aov)}</td>
                  <td className="text-left tabular-nums text-muted-foreground">{formatMoney(c.discounts)}</td>
                </tr>
              ))}
            </ReportTable>
          ) : (
            <EmptyNote icon={Banknote} title="مفيش مبيعات كاشير في الفترة دي" />
          )}
        </Panel>

        <Panel
          title="أكتر المنتجات رجوعًا"
          action={
            <Link href="/pos/returns" className="text-xs font-medium text-primary hover:underline">
              المرتجعات
            </Link>
          }
        >
          {returns.topProducts.length ? (
            <ul className="space-y-3">
              {returns.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatNumber(p.quantity)} قطعة · {formatMoney(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">مفيش مرتجعات في الفترة دي.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
