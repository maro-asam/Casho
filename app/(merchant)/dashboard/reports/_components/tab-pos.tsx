import { Banknote, Clock, RotateCcw, Scale, Store, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, PanelLink, ReportTable, Stat } from "./report-ui";
import { tr } from "@/lib/i18n/dashboard";

export function TabPos({ pos }: { pos: NonNullable<ReportsData["pos"]> }) {
  const { shifts, returns } = pos;
  const diff = shifts.netDifference;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Store} label={tr("مبيعات الكاشير")} value={formatMoney(pos.netSales)} sub={<span>{tr("{0} فاتورة", formatNumber(pos.orders))}</span>} />
        <Stat
          icon={Clock}
          label={tr("الورديات")}
          value={formatNumber(shifts.count)}
          sub={shifts.open > 0 ? <span className="text-[#c93400] dark:text-(--sys-orange)">{tr("{0} لسه مفتوحة", formatNumber(shifts.open))}</span> : undefined}
        />
        <Stat
          icon={Scale}
          label={tr("فرق الكاش")}
          value={
            <span className={cn(diff < 0 && "text-[#d70015] dark:text-(--sys-red)", diff > 0 && "text-[#248a3d] dark:text-(--sys-green)")}>
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
                  <span className="flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" strokeWidth={1.8} />
                    {b.name}
                  </span>
                </td>
                <td className="text-end tabular-nums">{formatNumber(b.orders)}</td>
                <td className="text-end font-medium tabular-nums">{formatMoney(b.netSales)}</td>
                <td className="text-end tabular-nums text-muted-foreground">{formatMoney(b.returns)}</td>
                <td className="text-end tabular-nums">
                  {formatNumber(b.shifts)}
                  {b.openShifts > 0 && (
                    <span className="ms-1 text-[13px] text-[#c93400] dark:text-(--sys-orange)">{tr("({0} مفتوحة)", formatNumber(b.openShifts))}</span>
                  )}
                </td>
                <td
                  className={cn(
                    "text-end tabular-nums",
                    b.cashDifference < 0 && "text-[#d70015] dark:text-(--sys-red)",
                    b.cashDifference > 0 && "text-[#248a3d] dark:text-(--sys-green)",
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

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title={tr("أداء الكاشير")}
          description={tr("مبيعات كل موظف على نقطة البيع")}
          className="lg:col-span-2"
          contentClassName={pos.cashiers.length ? "p-0" : undefined}
          action={
            <PanelLink href="/pos/shifts">{tr("الورديات")}</PanelLink>
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
                    <span className="flex items-center gap-2">
                      <UserRound className="size-4 text-muted-foreground" strokeWidth={1.8} />
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
            <PanelLink href="/pos/returns">{tr("المرتجعات")}</PanelLink>
          }
        >
          {returns.topProducts.length ? (
            <ul className="apple-rows -mx-5 -mb-2 [--row-inset:20px]">
              {returns.topProducts.map((p) => (
                <li key={p.name} className="flex min-h-11 items-center justify-between gap-3 px-5 py-2.5 text-[15px]">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {tr("{0} قطعة · {1}", formatNumber(p.quantity), formatMoney(p.amount))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-muted-foreground">{tr("مفيش مرتجعات في الفترة دي.")}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
