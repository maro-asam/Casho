import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock, CreditCard } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import { ORDER_STATUS_META } from "../../orders/_components/order-meta";
import { hourLabel } from "../_lib/range";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ShareBar } from "./report-ui";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
// Saturday first — the Egyptian work week.
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

export function TabSales({ data }: { data: ReportsData }) {
  const { pnl } = data;
  const collectable = pnl.collected + pnl.outstanding;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="التحصيل" description="الفلوس اللي وصلتك فعلًا، واللي لسه في الطريق">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> اتحصّل
              </p>
              <p className="text-xl font-bold tabular-nums">{formatMoney(pnl.collected)}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-amber-600 dark:text-amber-400" /> لسه متحصّلش
              </p>
              <p className="text-xl font-bold tabular-nums">{formatMoney(pnl.outstanding)}</p>
            </div>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500" style={{ width: `${collectable ? (pnl.collected / collectable) * 100 : 0}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${collectable ? (pnl.outstanding / collectable) * 100 : 0}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            &quot;اتحصّل&quot; = طلبات مدفوعة أو اتسلّمت. &quot;لسه&quot; = {formatNumber(pnl.outstandingOrders)} طلب قيد المراجعة أو
            مع شركة الشحن (الدفع عند الاستلام).{" "}
            {pnl.outstandingOrders > 0 && (
              <Link href="/orders?status=PENDING" className="font-medium text-primary hover:underline">
                راجع الطلبات
              </Link>
            )}
          </p>
        </Panel>

        <Panel title="حالة الطلبات" description="كل طلبات الفترة حسب حالتها دلوقتي">
          <ul className="space-y-2.5">
            {data.statuses.map((s) => {
              const meta = ORDER_STATUS_META[s.status];
              return (
                <li key={s.status} className="flex items-center gap-3 text-sm">
                  <StatusPill tone={meta.tone} className="w-24 justify-center">
                    {meta.label}
                  </StatusPill>
                  <span className="flex-1 tabular-nums text-muted-foreground">{formatNumber(s.count)} طلب</span>
                  <span className="font-medium tabular-nums">{formatMoney(s.value)}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="طرق الدفع" description="الدفع المقسّم في الكاشير محسوب بمبلغ كل طريقة لوحدها">
        {data.payments.length ? (
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {data.payments.map((p) => (
              <li key={p.method} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                </div>
                <ShareBar value={p.share} />
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPercent(p.share * 100)} · {formatNumber(p.count)} عملية
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote icon={CreditCard} title="مفيش مدفوعات في الفترة دي" />
        )}
      </Panel>

      <Heatmap heatmap={data.heatmap} />

      <Panel title="المبيعات حسب أيام الأسبوع">
        <Weekdays weekdays={data.weekdays} />
      </Panel>
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: number[][] }) {
  const max = Math.max(...heatmap.flat(), 0);

  return (
    <Panel title="أوقات الطلبات" description="كل مربع = عدد الطلبات في الساعة دي من اليوم ده (بتوقيت القاهرة)">
      {max === 0 ? (
        <EmptyNote icon={CalendarClock} title="مفيش طلبات في الفترة دي" />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-2xl space-y-1">
            {WEEK_ORDER.map((weekday) => (
              <div key={weekday} className="flex items-center gap-1">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">{WEEKDAYS[weekday]}</span>
                <div className="grid flex-1 grid-cols-24 gap-0.5">
                  {heatmap[weekday].map((count, hour) => (
                    <div
                      key={hour}
                      title={`${WEEKDAYS[weekday]} ${hourLabel(hour)}: ${formatNumber(count)} طلب`}
                      className={cn("aspect-square rounded-sm", count === 0 && "bg-muted")}
                      style={count > 0 ? { backgroundColor: `color-mix(in oklab, var(--primary) ${15 + (count / max) * 85}%, transparent)` } : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1 pt-1">
              <span className="w-16 shrink-0" />
              <div className="grid flex-1 grid-cols-24 gap-0.5 text-[10px] text-muted-foreground">
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="text-center">
                    {h % 3 === 0 ? hourLabel(h) : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Weekdays({ weekdays }: { weekdays: ReportsData["weekdays"] }) {
  const max = Math.max(...weekdays.map((d) => d.netSales), 1);
  const best = weekdays.reduce((a, b) => (b.netSales > a.netSales ? b : a));

  return (
    <ul className="space-y-2.5">
      {WEEK_ORDER.map((weekday) => {
        const d = weekdays[weekday];
        return (
          <li key={weekday} className="flex items-center gap-3 text-sm">
            <span className={cn("w-16 shrink-0", d === best && d.netSales > 0 ? "font-semibold" : "text-muted-foreground")}>
              {WEEKDAYS[weekday]}
            </span>
            <ShareBar value={d.netSales / max} className="h-2 flex-1" />
            <span className="w-16 shrink-0 text-xs text-muted-foreground tabular-nums">{formatNumber(d.orders)} طلب</span>
            <span className="w-24 shrink-0 text-left font-medium tabular-nums">{formatMoney(d.netSales)}</span>
          </li>
        );
      })}
    </ul>
  );
}
