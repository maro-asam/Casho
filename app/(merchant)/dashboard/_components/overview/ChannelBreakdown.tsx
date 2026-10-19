import Link from "next/link";
import { OrderSource } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <CardTitle className="text-base font-semibold">{tr("المبيعات حسب القناة")}</CardTitle>
        <p className="text-xs text-muted-foreground">{tr("الإيرادات · آخر ٣٠ يوم")}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        {rows.map((row) => {
          const { label, icon: Icon } = CHANNELS[row.source];
          const share = total > 0 ? (row.revenue / total) * 100 : 0;

          return (
            <div key={row.source} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </span>
                <span className="font-semibold tabular-nums">{formatMoney(row.revenue)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{tr("{0} طلب", formatNumber(row.orders))}</span>
                <span>{formatPercent(share)}</span>
              </div>
            </div>
          );
        })}

        {!rows.some((r) => r.source === OrderSource.POS && r.orders > 0) && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {tr("عندك محل؟")}{" "}
            <Link href="/pos" className="font-medium text-primary hover:underline">
              {tr("افتح الكاشير")}
            </Link>{" "}{tr("وكل بيعة هتتسجل هنا ومن نفس المخزون.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
