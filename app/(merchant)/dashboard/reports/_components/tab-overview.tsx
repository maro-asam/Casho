import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  Coins,
  Eye,
  Info,
  Lightbulb,
  MousePointerClick,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import DeltaBadge from "../../_components/overview/DeltaBadge";
import { CHANNELS, formatMoney, formatNumber, formatPercent, percentChange } from "../../_components/overview/format";
import type { Delta, ReportsData } from "../_lib/types";
import { Note, Panel, ShareBar, Stat } from "./report-ui";
import { TrendChart } from "./trend-chart";
import { intlLocale, tr } from "@/lib/i18n/dashboard";

const pct = (v: number) => formatPercent(v);

export function TabOverview({ data }: { data: ReportsData }) {
  const { kpis, pnl } = data;
  const coverageNote =
    pnl.costCoverage < 0.999 && pnl.netSales.current > 0
      ? tr("محسوب على {0} من المبيعات", formatPercent(pnl.costCoverage * 100))
      : undefined;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Coins}
          label={tr("صافي المبيعات")}
          delta={kpis.netSales}
          format={formatMoney}
          hint={tr("قيمة المنتجات المباعة بعد الخصومات والمرتجعات، من غير الشحن والطلبات الملغية.")}
        />
        {pnl.costCoverage > 0 || pnl.netSales.current === 0 ? (
          <Stat
            icon={TrendingUp}
            label={tr("إجمالي الربح")}
            delta={kpis.grossProfit}
            format={formatMoney}
            hint={tr("صافي المبيعات ناقص تكلفة البضاعة المباعة. المنتجات اللي ملهاش سعر تكلفة مش داخلة في الحساب.")}
            sub={coverageNote && <span className="text-[#c93400] dark:text-(--sys-orange)">{coverageNote}</span>}
          />
        ) : (
          <Stat
            icon={TrendingUp}
            label={tr("إجمالي الربح")}
            value="—"
            hint={tr("محتاجين سعر التكلفة للمنتجات عشان نحسب الربح.")}
            sub={
              <Link href="/products" className="text-primary hover:underline">
                {tr("ضيف سعر التكلفة للمنتجات")}
              </Link>
            }
          />
        )}
        <Stat icon={ShoppingBag} label={tr("الطلبات")} delta={kpis.orders} format={formatNumber} hint={tr("كل الطلبات ما عدا الملغية، من كل القنوات.")} />
        <Stat
          icon={Receipt}
          label={tr("متوسط قيمة الطلب")}
          delta={kpis.aov}
          format={formatMoney}
          hint={tr("إجمالي اللي دفعه العملاء (شامل الشحن) ÷ عدد الطلبات غير الملغية.")}
        />
        <Stat
          icon={Eye}
          label={tr("الزوار")}
          delta={kpis.visitors}
          format={formatNumber}
          hint={tr("عدد الأشخاص المختلفين اللي فتحوا المتجر (مش عدد مرات الفتح).")}
          sub={<span>{tr("{0} زيارة", formatNumber(pnl.visits))}</span>}
        />
        <Stat
          icon={MousePointerClick}
          label={tr("معدل التحويل")}
          delta={kpis.conversion}
          format={pct}
          hint={tr("طلبات المتجر الأونلاين ÷ الزوار. طلبات الكاشير مش داخلة لأنها مش جاية من زيارات.")}
        />
        <Stat
          icon={Users}
          label={tr("العملاء")}
          delta={kpis.customers}
          format={formatNumber}
          hint={tr("عملاء مختلفين برقم موبايل. عملاء الكاشير اللي من غير بيانات مش محسوبين.")}
          sub={<span>{tr("{0} جديد", formatNumber(data.customers.new))}</span>}
        />
        <Stat
          icon={Ban}
          label={tr("نسبة الإلغاء")}
          delta={kpis.cancelRate}
          format={pct}
          invert
          hint={tr("الطلبات الملغية ÷ كل الطلبات في الفترة.")}
        />
      </div>

      <TrendChart series={data.series} previousLabel={data.range.previousLabel} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProfitStatement data={data} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Insights insights={data.insights} />
          <Channels data={data} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  delta,
  sign,
  strong,
  muted,
  invert,
  note,
}: {
  label: string;
  value: number;
  delta?: Delta;
  sign?: "-" | "+";
  strong?: boolean;
  muted?: boolean;
  invert?: boolean;
  note?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-2.5", strong && "border-t-[0.5px] border-border pt-3")}>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[15px]", strong ? "font-semibold" : muted ? "text-muted-foreground" : "")}>{label}</p>
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
      {delta && <DeltaBadge value={percentChange(delta.current, delta.previous)} invert={invert} className="hidden sm:inline-flex" />}
      <p className={cn("w-32 text-end tabular-nums", strong ? "text-[17px] font-bold" : "text-[15px] font-medium", muted && "text-muted-foreground")}>
        {sign === "-" && value > 0 ? "− " : ""}
        {formatMoney(value)}
      </p>
    </div>
  );
}

/** A small income statement: gross → discounts → returns → net → cost → profit. */
function ProfitStatement({ data }: { data: ReportsData }) {
  const { pnl } = data;
  const hasCost = pnl.costCoverage > 0;

  return (
    <Panel title={tr("الأرباح والخسائر")} description={tr("حساب مبسط لفلوس الفترة من أول سعر البيع لحد الربح")}>
      <div className="divide-y divide-transparent">
        <Row label={tr("إجمالي المبيعات")} note={tr("بسعر البيع قبل أي خصم")} value={pnl.grossSales.current} delta={pnl.grossSales} />
        <Row label={tr("الخصومات")} value={pnl.discounts.current} delta={pnl.discounts} sign="-" muted invert />
        <Row label={tr("المرتجعات")} value={pnl.returns.current} delta={pnl.returns} sign="-" muted invert />
        <Row label={tr("صافي المبيعات")} value={pnl.netSales.current} delta={pnl.netSales} strong />
        {hasCost ? (
          <>
            <Row label={tr("تكلفة البضاعة المباعة")} value={pnl.cogs} sign="-" muted />
            <Row
              label={tr("إجمالي الربح")}
              value={pnl.grossProfit.current}
              delta={pnl.grossProfit}
              strong
              note={tr("هامش الربح {0}", formatPercent(pnl.margin.current))}
            />
          </>
        ) : (
          <div className="pt-2">
            <Note icon={Info}>{tr("مفيش سعر تكلفة لأي منتج اتباع، فمش هنقدر نحسب الربح. ضيف سعر التكلفة من صفحة تعديل المنتج.")}</Note>
          </div>
        )}
      </div>

      {hasCost && pnl.costCoverage < 0.999 && (
        <div className="mt-3">
          <Note icon={AlertTriangle} tone="warning">
          {tr("{0} منتج اتباعوا من غير سعر تكلفة، فالربح محسوب على {1} من المبيعات بس.", formatNumber(pnl.productsMissingCost), formatPercent(pnl.costCoverage * 100))}{" "}
          <Link href="/products" className="text-primary hover:underline">
            {tr("ضيف التكلفة")}
          </Link>
          </Note>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-[15px] sm:grid-cols-4">
        <div className="rounded-xl bg-background px-3.5 py-2.5">
          <dt className="text-[12px] text-muted-foreground">{tr("الشحن المحصّل")}</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{formatMoney(pnl.shipping)}</dd>
        </div>
        <div className="rounded-xl bg-background px-3.5 py-2.5">
          <dt className="text-[12px] text-muted-foreground">{tr("القطع المباعة")}</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{formatNumber(pnl.units.current)}</dd>
        </div>
        <div className="rounded-xl bg-background px-3.5 py-2.5">
          <dt className="text-[12px] text-muted-foreground">{tr("قطع في الطلب")}</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{pnl.itemsPerOrder.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}</dd>
        </div>
        <div className="rounded-xl bg-background px-3.5 py-2.5">
          <dt className="text-[12px] text-muted-foreground">{tr("طلبات ملغية")}</dt>
          <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">
            {formatNumber(pnl.canceledOrders)} <span className="text-[13px] font-normal text-muted-foreground">· {formatMoney(pnl.canceledValue)}</span>
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

const INSIGHT_ICON = { positive: Sparkles, warning: AlertTriangle, info: Lightbulb };
const INSIGHT_TONE = {
  positive: "text-(--sys-green)",
  warning: "text-(--sys-orange)",
  info: "text-primary",
};

function Insights({ insights }: { insights: ReportsData["insights"] }) {
  return (
    <Panel title={tr("ملاحظات على الفترة")} description={tr("أرقام محسوبة من بياناتك، مش نصايح عامة")}>
      {insights.length ? (
        <ul className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = INSIGHT_ICON[insight.tone];
            return (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-6">
                <Icon className={cn("mt-1 size-4 shrink-0", INSIGHT_TONE[insight.tone])} />
                <span>{insight.text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[15px] text-muted-foreground">{tr("محتاجين بيانات أكتر في الفترة دي عشان نطلع ملاحظات مفيدة.")}</p>
      )}
    </Panel>
  );
}

function Channels({ data }: { data: ReportsData }) {
  return (
    <Panel title={tr("المبيعات حسب القناة")}>
      {data.channels.length ? (
        <ul className="space-y-4">
          {data.channels.map((c) => {
            const { label, icon: Icon } = CHANNELS[c.source];
            return (
              <li key={c.source} className="space-y-1.5">
                <div className="flex items-center gap-2 text-[15px]">
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  <span className="flex-1">{label}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(c.netSales)}</span>
                </div>
                <ShareBar value={c.share} />
                <p className="text-[13px] text-muted-foreground tabular-nums">
                  {tr("{0} · {1} طلب · متوسط {2}", formatPercent(c.share * 100), formatNumber(c.orders), formatMoney(c.aov))}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[15px] text-muted-foreground">{tr("مفيش طلبات في الفترة دي.")}</p>
      )}
    </Panel>
  );
}
