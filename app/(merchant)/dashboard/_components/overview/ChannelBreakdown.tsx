import Link from "next/link";
import { OrderSource } from "@prisma/client";
import CardHeading from "./CardHeading";
import type { ChannelTotal } from "./overview-data";
import { CHANNELS, formatMoney, formatNumber, formatPercent } from "./format";
import { tr } from "@/lib/i18n/dashboard";

// Always show online + POS so merchants see the POS channel even before using it.
const ALWAYS_SHOWN: OrderSource[] = [OrderSource.ONLINE, OrderSource.POS];

export default function ChannelBreakdown({ channels }: { channels: ChannelTotal[] }) {
  const rows = [
    ...channels,
    ...ALWAYS_SHOWN.filter((s) => !channels.some((c) => c.source === s)).map((source) => ({
      source,
      revenue: 0,
      orders: 0,
    })),
  ];
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <section className="apple-card">
      <CardHeading title={tr("المبيعات حسب القناة")} subtitle={tr("الإيرادات · آخر ٣٠ يوم")} />
      <div className="space-y-4 px-5 pt-1 pb-5">
        {rows.map((row) => {
          const { label, icon: Icon } = CHANNELS[row.source];
          const share = total > 0 ? (row.revenue / total) * 100 : 0;

          return (
            <div key={row.source} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[15px]">
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  {label}
                </span>
                <span className="text-[15px] font-semibold tabular-nums">{formatMoney(row.revenue)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 ease-(--ease-apple)"
                  style={{ width: `${share}%` }}
                />
              </div>
              <div className="flex justify-between text-[12px] text-muted-foreground tabular-nums">
                <span>{tr("{0} طلب", formatNumber(row.orders))}</span>
                <span>{formatPercent(share)}</span>
              </div>
            </div>
          );
        })}

        {!rows.some((r) => r.source === OrderSource.POS && r.orders > 0) && (
          <p className="rounded-xl bg-background px-3.5 py-2.5 text-[13px] leading-5 text-muted-foreground">
            {tr("عندك محل؟")}{" "}
            <Link href="/pos" className="font-semibold text-primary hover:underline">
              {tr("افتح الكاشير")}
            </Link>{" "}{tr("وكل بيعة هتتسجل هنا ومن نفس المخزون.")}
          </p>
        )}
      </div>
    </section>
  );
}
