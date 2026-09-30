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
import { Panel, ShareBar, Stat } from "./report-ui";
import { TrendChart } from "./trend-chart";

const pct = (v: number) => formatPercent(v);

export function TabOverview({ data }: { data: ReportsData }) {
  const { kpis, pnl } = data;
  const coverageNote =
    pnl.costCoverage < 0.999 && pnl.netSales.current > 0
      ? `محسوب على ${formatPercent(pnl.costCoverage * 100)} من المبيعات`
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Coins}
          label="صافي المبيعات"
          delta={kpis.netSales}
          format={formatMoney}
          hint="قيمة المنتجات المباعة بعد الخصومات والمرتجعات، من غير الشحن والطلبات الملغية."
        />
        {pnl.costCoverage > 0 || pnl.netSales.current === 0 ? (
          <Stat
            icon={TrendingUp}
            label="إجمالي الربح"
            delta={kpis.grossProfit}
            format={formatMoney}
            hint="صافي المبيعات ناقص تكلفة البضاعة المباعة. المنتجات اللي ملهاش سعر تكلفة مش داخلة في الحساب."
            sub={coverageNote && <span className="text-amber-600 dark:text-amber-400">{coverageNote}</span>}
          />
        ) : (
          <Stat
            icon={TrendingUp}
            label="إجمالي الربح"
            value="—"
            hint="محتاجين سعر التكلفة للمنتجات عشان نحسب الربح."
            sub={
              <Link href="/products" className="text-amber-600 hover:underline dark:text-amber-400">
                ضيف سعر التكلفة للمنتجات
              </Link>
            }
          />
        )}
        <Stat icon={ShoppingBag} label="الطلبات" delta={kpis.orders} format={formatNumber} hint="كل الطلبات ما عدا الملغية، من كل القنوات." />
        <Stat
          icon={Receipt}
          label="متوسط قيمة الطلب"
          delta={kpis.aov}
          format={formatMoney}
          hint="إجمالي اللي دفعه العملاء (شامل الشحن) ÷ عدد الطلبات غير الملغية."
        />
        <Stat
          icon={Eye}
          label="الزوار"
          delta={kpis.visitors}
          format={formatNumber}
          hint="عدد الأشخاص المختلفين اللي فتحوا المتجر (مش عدد مرات الفتح)."
          sub={<span>{formatNumber(pnl.visits)} زيارة</span>}
        />
        <Stat
          icon={MousePointerClick}
          label="معدل التحويل"
          delta={kpis.conversion}
          format={pct}
          hint="طلبات المتجر الأونلاين ÷ الزوار. طلبات الكاشير مش داخلة لأنها مش جاية من زيارات."
        />
        <Stat
          icon={Users}
          label="العملاء"
          delta={kpis.customers}
          format={formatNumber}
          hint="عملاء مختلفين برقم موبايل. عملاء الكاشير اللي من غير بيانات مش محسوبين."
          sub={<span>{formatNumber(data.customers.new)} جديد</span>}
        />
        <Stat
          icon={Ban}
          label="نسبة الإلغاء"
          delta={kpis.cancelRate}
          format={pct}
          invert
          hint="الطلبات الملغية ÷ كل الطلبات في الفترة."
        />
      </div>

      <TrendChart series={data.series} previousLabel={data.range.previousLabel} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProfitStatement data={data} />
        </div>
        <div className="space-y-6 lg:col-span-2">
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
    <div className={cn("flex items-center gap-3 py-2.5", strong && "border-t border-border pt-3")}>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", strong ? "font-semibold" : muted ? "text-muted-foreground" : "")}>{label}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {delta && <DeltaBadge value={percentChange(delta.current, delta.previous)} invert={invert} className="hidden sm:inline-flex" />}
      <p className={cn("w-32 text-left tabular-nums", strong ? "text-base font-bold" : "text-sm font-medium", muted && "text-muted-foreground")}>
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
    <Panel title="الأرباح والخسائر" description="حساب مبسط لفلوس الفترة من أول سعر البيع لحد الربح">
      <div className="divide-y divide-transparent">
        <Row label="إجمالي المبيعات" note="بسعر البيع قبل أي خصم" value={pnl.grossSales.current} delta={pnl.grossSales} />
        <Row label="الخصومات" value={pnl.discounts.current} delta={pnl.discounts} sign="-" muted invert />
        <Row label="المرتجعات" value={pnl.returns.current} delta={pnl.returns} sign="-" muted invert />
        <Row label="صافي المبيعات" value={pnl.netSales.current} delta={pnl.netSales} strong />
        {hasCost ? (
          <>
            <Row label="تكلفة البضاعة المباعة" value={pnl.cogs} sign="-" muted />
            <Row
              label="إجمالي الربح"
              value={pnl.grossProfit.current}
              delta={pnl.grossProfit}
              strong
              note={`هامش الربح ${formatPercent(pnl.margin.current)}`}
            />
          </>
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            مفيش سعر تكلفة لأي منتج اتباع، فمش هنقدر نحسب الربح. ضيف سعر التكلفة من صفحة تعديل المنتج.
          </p>
        )}
      </div>

      {hasCost && pnl.costCoverage < 0.999 && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {formatNumber(pnl.productsMissingCost)} منتج اتباعوا من غير سعر تكلفة، فالربح محسوب على{" "}
          {formatPercent(pnl.costCoverage * 100)} من المبيعات بس.{" "}
          <Link href="/products" className="font-medium underline underline-offset-2">
            ضيف التكلفة
          </Link>
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">الشحن المحصّل</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatMoney(pnl.shipping)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">القطع المباعة</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatNumber(pnl.units.current)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">قطع في الطلب</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{pnl.itemsPerOrder.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">طلبات ملغية</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatNumber(pnl.canceledOrders)} <span className="text-xs font-normal text-muted-foreground">· {formatMoney(pnl.canceledValue)}</span>
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

const INSIGHT_ICON = { positive: Sparkles, warning: AlertTriangle, info: Lightbulb };
const INSIGHT_TONE = {
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-primary",
};

function Insights({ insights }: { insights: ReportsData["insights"] }) {
  return (
    <Panel title="ملاحظات على الفترة" description="أرقام محسوبة من بياناتك، مش نصايح عامة">
      {insights.length ? (
        <ul className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = INSIGHT_ICON[insight.tone];
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-6">
                <Icon className={cn("mt-1 size-4 shrink-0", INSIGHT_TONE[insight.tone])} />
                <span>{insight.text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">محتاجين بيانات أكتر في الفترة دي عشان نطلع ملاحظات مفيدة.</p>
      )}
    </Panel>
  );
}

function Channels({ data }: { data: ReportsData }) {
  return (
    <Panel title="المبيعات حسب القناة">
      {data.channels.length ? (
        <ul className="space-y-4">
          {data.channels.map((c) => {
            const { label, icon: Icon } = CHANNELS[c.source];
            return (
              <li key={c.source} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="flex-1 font-medium">{label}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(c.netSales)}</span>
                </div>
                <ShareBar value={c.share} />
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPercent(c.share * 100)} · {formatNumber(c.orders)} طلب · متوسط {formatMoney(c.aov)}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">مفيش طلبات في الفترة دي.</p>
      )}
    </Panel>
  );
}
