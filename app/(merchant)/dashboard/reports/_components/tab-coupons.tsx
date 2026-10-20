import Link from "next/link";
import { TicketPercent } from "lucide-react";

import { StatusText, appleButton, type PillTone } from "@/components/saas-page";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, Stat } from "./report-ui";
import { tr } from "@/lib/i18n/dashboard";

const STATUS: Record<ReportsData["coupons"][number]["status"], { label: string; tone: PillTone }> = {
  active: { get label() { return tr("شغال"); }, tone: "success" },
  inactive: { get label() { return tr("متوقف"); }, tone: "neutral" },
  expired: { get label() { return tr("انتهى"); }, tone: "neutral" },
  used_up: { get label() { return tr("خلص استخدامه"); }, tone: "warning" },
};

export function TabCoupons({ data }: { data: ReportsData }) {
  const used = data.coupons.filter((c) => c.uses > 0);
  const totalDiscount = used.reduce((s, c) => s + c.discount, 0);
  const totalSales = used.reduce((s, c) => s + c.sales, 0);
  const totalUses = used.reduce((s, c) => s + c.uses, 0);

  if (!data.coupons.length) {
    return (
      <Panel title={tr("الكوبونات")}>
        <EmptyNote icon={TicketPercent} title={tr("لسه معملتش كوبونات")} description={tr("الكوبونات بتساعدك تجيب عملاء جداد وترجّع القدام.")} />
        <div className="mt-4 text-center">
          <Link href="/coupons" className={`${appleButton.filled} h-9 px-4`}>
            {tr("اعمل كوبون")}
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={tr("طلبات بكوبون")} value={formatNumber(totalUses)} />
        <Stat
          label={tr("نصيب الكوبونات من المبيعات")}
          value={formatPercent(data.couponShare * 100)}
          hint={tr("قيمة الطلبات اللي فيها كوبون ÷ قيمة كل الطلبات.")}
        />
        <Stat label={tr("مبيعات بكوبون")} value={formatMoney(totalSales)} />
        <Stat
          label={tr("تكلفة الخصم")}
          value={formatMoney(totalDiscount)}
          hint={tr("إجمالي الخصم على الطلبات اللي استخدمت كوبون (بيشمل خصم نقاط الولاء لو اتستخدمت في نفس الطلب).")}
          sub={totalSales > 0 ? <span>{tr("{0} من قيمتها", formatPercent((totalDiscount / (totalSales + totalDiscount)) * 100))}</span> : undefined}
        />
      </div>

      <Panel title={tr("أداء الكوبونات")} description={tr("في الفترة المختارة")} contentClassName="p-0">
        <ReportTable
          head={
            <>
              <th>{tr("الكوبون")}</th>
              <th>{tr("الحالة")}</th>
              <th className="text-end!">{tr("الاستخدام")}</th>
              <th className="hidden text-end! md:table-cell">{tr("عملاء")}</th>
              <th className="text-end!">{tr("المبيعات")}</th>
              <th className="text-end!">{tr("الخصم")}</th>
            </>
          }
        >
          {data.coupons.map((c) => (
            <tr key={c.code}>
              <td>
                <span className="font-mono text-[15px]" dir="ltr">
                  {c.code}
                </span>
                <span className="ms-2 text-[13px] text-muted-foreground">
                  {c.type === "PERCENTAGE" ? tr("{0}٪", formatNumber(c.value)) : formatMoney(c.value * 100)}
                </span>
              </td>
              <td>
                <StatusText tone={STATUS[c.status].tone}>{STATUS[c.status].label}</StatusText>
              </td>
              <td className="text-end tabular-nums">{formatNumber(c.uses)}</td>
              <td className="hidden text-end tabular-nums md:table-cell">{formatNumber(c.customers)}</td>
              <td className="text-end font-medium tabular-nums">{formatMoney(c.sales)}</td>
              <td className="text-end tabular-nums text-muted-foreground">{formatMoney(c.discount)}</td>
            </tr>
          ))}
        </ReportTable>
      </Panel>
    </div>
  );
}
