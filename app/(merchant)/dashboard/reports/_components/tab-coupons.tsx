import Link from "next/link";
import { TicketPercent } from "lucide-react";

import { StatusPill, type PillTone } from "@/components/saas-page";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, Stat } from "./report-ui";

const STATUS: Record<ReportsData["coupons"][number]["status"], { label: string; tone: PillTone }> = {
  active: { label: "شغال", tone: "success" },
  inactive: { label: "متوقف", tone: "neutral" },
  expired: { label: "انتهى", tone: "neutral" },
  used_up: { label: "خلص استخدامه", tone: "warning" },
};

export function TabCoupons({ data }: { data: ReportsData }) {
  const used = data.coupons.filter((c) => c.uses > 0);
  const totalDiscount = used.reduce((s, c) => s + c.discount, 0);
  const totalSales = used.reduce((s, c) => s + c.sales, 0);
  const totalUses = used.reduce((s, c) => s + c.uses, 0);

  if (!data.coupons.length) {
    return (
      <Panel title="الكوبونات">
        <EmptyNote icon={TicketPercent} title="لسه معملتش كوبونات" description="الكوبونات بتساعدك تجيب عملاء جداد وترجّع القدام." />
        <div className="mt-4 text-center">
          <Link href="/coupons" className="text-sm font-medium text-primary hover:underline">
            اعمل كوبون
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="طلبات بكوبون" value={formatNumber(totalUses)} />
        <Stat
          label="نصيب الكوبونات من المبيعات"
          value={formatPercent(data.couponShare * 100)}
          hint="قيمة الطلبات اللي فيها كوبون ÷ قيمة كل الطلبات."
        />
        <Stat label="مبيعات بكوبون" value={formatMoney(totalSales)} />
        <Stat
          label="تكلفة الخصم"
          value={formatMoney(totalDiscount)}
          hint="إجمالي الخصم على الطلبات اللي استخدمت كوبون (بيشمل خصم نقاط الولاء لو اتستخدمت في نفس الطلب)."
          sub={totalSales > 0 ? <span>{formatPercent((totalDiscount / (totalSales + totalDiscount)) * 100)} من قيمتها</span> : undefined}
        />
      </div>

      <Panel title="أداء الكوبونات" description="في الفترة المختارة" contentClassName="p-0">
        <ReportTable
          head={
            <>
              <th>الكوبون</th>
              <th>الحالة</th>
              <th className="text-left!">الاستخدام</th>
              <th className="hidden text-left! md:table-cell">عملاء</th>
              <th className="text-left!">المبيعات</th>
              <th className="text-left!">الخصم</th>
            </>
          }
        >
          {data.coupons.map((c) => (
            <tr key={c.code}>
              <td>
                <span className="font-mono text-sm font-medium" dir="ltr">
                  {c.code}
                </span>
                <span className="ms-2 text-xs text-muted-foreground">
                  {c.type === "PERCENTAGE" ? `${formatNumber(c.value)}٪` : formatMoney(c.value * 100)}
                </span>
              </td>
              <td>
                <StatusPill tone={STATUS[c.status].tone}>{STATUS[c.status].label}</StatusPill>
              </td>
              <td className="text-left tabular-nums">{formatNumber(c.uses)}</td>
              <td className="hidden text-left tabular-nums md:table-cell">{formatNumber(c.customers)}</td>
              <td className="text-left font-medium tabular-nums">{formatMoney(c.sales)}</td>
              <td className="text-left tabular-nums text-muted-foreground">{formatMoney(c.discount)}</td>
            </tr>
          ))}
        </ReportTable>
      </Panel>
    </div>
  );
}
