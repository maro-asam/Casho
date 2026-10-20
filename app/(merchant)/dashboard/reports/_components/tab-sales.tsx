import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock, CreditCard } from "lucide-react";

import { StatusText } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import { ORDER_STATUS_META } from "../../orders/_components/order-meta";
import { hourLabel } from "../_lib/range";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ShareBar } from "./report-ui";
import { lazyList, tr } from "@/lib/i18n/dashboard";

const WEEKDAYS = lazyList(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]);
// Saturday first — the Egyptian work week.
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

export function TabSales({ data }: { data: ReportsData }) {
  const { pnl } = data;
  const collectable = pnl.collected + pnl.outstanding;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={tr("التحصيل")} description={tr("الفلوس اللي وصلتك فعلًا، واللي لسه في الطريق")}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CheckCircle2 className="size-4 text-(--sys-green)" />{" "}{tr("اتحصّل")}
              </p>
              <p className="text-[22px] leading-7 font-bold tabular-nums">{formatMoney(pnl.collected)}</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Clock className="size-4 text-(--sys-orange)" />{" "}{tr("لسه متحصّلش")}
              </p>
              <p className="text-[22px] leading-7 font-bold tabular-nums">{formatMoney(pnl.outstanding)}</p>
            </div>
          </div>
          <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-(--sys-green)" style={{ width: `${collectable ? (pnl.collected / collectable) * 100 : 0}%` }} />
            <div className="h-full bg-(--sys-orange)" style={{ width: `${collectable ? (pnl.outstanding / collectable) * 100 : 0}%` }} />
          </div>
          <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
            {tr("\"اتحصّل\" = طلبات مدفوعة أو اتسلّمت. \"لسه\" = {0} طلب قيد المراجعة أو مع شركة الشحن (الدفع عند الاستلام).", formatNumber(pnl.outstandingOrders))}{" "}
            {pnl.outstandingOrders > 0 && (
              <Link href="/orders?status=PENDING" className="text-primary hover:underline">
                {tr("راجع الطلبات")}
              </Link>
            )}
          </p>
        </Panel>

        <Panel title={tr("حالة الطلبات")} description={tr("كل طلبات الفترة حسب حالتها دلوقتي")}>
          <ul className="apple-rows -mx-5 -mb-2 [--row-inset:20px]">
            {data.statuses.map((s) => {
              const meta = ORDER_STATUS_META[s.status];
              return (
                <li key={s.status} className="flex min-h-11 items-center gap-3 px-5 py-2.5 text-[15px]">
                  <StatusText tone={meta.tone} className="w-28 text-[15px] text-foreground">
                    {meta.label}
                  </StatusText>
                  <span className="flex-1 tabular-nums text-muted-foreground">{tr("{0} طلب", formatNumber(s.count))}</span>
                  <span className="font-medium tabular-nums">{formatMoney(s.value)}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title={tr("طرق الدفع")} description={tr("الدفع المقسّم في الكاشير محسوب بمبلغ كل طريقة لوحدها")}>
        {data.payments.length ? (
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {data.payments.map((p) => (
              <li key={p.method} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[15px]">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                </div>
                <ShareBar value={p.share} />
                <p className="text-[13px] text-muted-foreground tabular-nums">
                  {tr("{0} · {1} عملية", formatPercent(p.share * 100), formatNumber(p.count))}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote icon={CreditCard} title={tr("مفيش مدفوعات في الفترة دي")} />
        )}
      </Panel>

      <Heatmap heatmap={data.heatmap} />

      <Panel title={tr("المبيعات حسب أيام الأسبوع")}>
        <Weekdays weekdays={data.weekdays} />
      </Panel>
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: number[][] }) {
  const max = Math.max(...heatmap.flat(), 0);

  return (
    <Panel title={tr("أوقات الطلبات")} description={tr("كل مربع = عدد الطلبات في الساعة دي من اليوم ده (بتوقيت القاهرة)")}>
      {max === 0 ? (
        <EmptyNote icon={CalendarClock} title={tr("مفيش طلبات في الفترة دي")} />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-2xl space-y-1">
            {WEEK_ORDER.map((weekday) => (
              <div key={weekday} className="flex items-center gap-1">
                <span className="w-16 shrink-0 text-[12px] text-muted-foreground">{WEEKDAYS[weekday]}</span>
                <div className="grid flex-1 grid-cols-24 gap-0.5">
                  {heatmap[weekday].map((count, hour) => (
                    <div
                      key={hour}
                      title={tr("{0} {1}: {2} طلب", WEEKDAYS[weekday], hourLabel(hour), formatNumber(count))}
                      className={cn("aspect-square rounded-[4px]", count === 0 && "bg-muted")}
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
            <div className="flex items-center justify-end gap-1.5 pt-3 text-[12px] text-muted-foreground">
              <span>{tr("أقل")}</span>
              {[15, 40, 65, 100].map((p) => (
                <span
                  key={p}
                  aria-hidden
                  className="size-3 rounded-[3px]"
                  style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${p}%, transparent)` }}
                />
              ))}
              <span>{tr("أكتر")}</span>
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
          <li key={weekday} className="flex items-center gap-3 text-[15px]">
            <span className={cn("w-16 shrink-0", d === best && d.netSales > 0 ? "font-semibold" : "text-muted-foreground")}>
              {WEEKDAYS[weekday]}
            </span>
            <ShareBar value={d.netSales / max} className="h-2 flex-1" />
            <span className="w-16 shrink-0 text-[13px] text-muted-foreground tabular-nums">{tr("{0} طلب", formatNumber(d.orders))}</span>
            <span className="w-24 shrink-0 text-end font-medium tabular-nums">{formatMoney(d.netSales)}</span>
          </li>
        );
      })}
    </ul>
  );
}
