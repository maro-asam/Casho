import Link from "next/link";
import { Crown, Gift, Repeat, Store, UserPlus, Users, Wallet } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Panel, ReportTable, Stat } from "./report-ui";

const dateFormat = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", timeZone: "Africa/Cairo" });

export function TabCustomers({ data }: { data: ReportsData }) {
  const c = data.customers;
  const known = c.newRevenue + c.returningRevenue;
  const returningShare = known ? c.returningRevenue / known : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="عملاء اشتروا"
          delta={c.unique}
          format={formatNumber}
          hint="عملاء مختلفين برقم موبايل عملوا طلب غير ملغي في الفترة."
        />
        <Stat
          icon={UserPlus}
          label="عملاء جداد"
          value={formatNumber(c.new)}
          hint="أول طلب ليهم في متجرك كان في الفترة دي."
          sub={<span>{formatNumber(c.returning)} رجعوا تاني</span>}
        />
        <Stat
          icon={Repeat}
          label="اشتروا أكتر من مرة"
          value={formatPercent(c.repeatRate)}
          hint="نسبة العملاء اللي عملوا طلبين أو أكتر جوه الفترة نفسها."
        />
        <Stat
          icon={Wallet}
          label="متوسط صرف العميل"
          value={formatMoney(c.avgSpend)}
          hint="إجمالي اللي دفعه العملاء المعروفين ÷ عددهم."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="مبيعات العملاء الجداد والقدام" className="lg:col-span-2">
          {known > 0 ? (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(1 - returningShare) * 100}%` }} />
                <div className="h-full bg-primary/35" style={{ width: `${returningShare * 100}%` }} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" /> عملاء جداد ({formatNumber(c.new)})
                  </dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums">{formatMoney(c.newRevenue)}</dd>
                  <dd className="text-xs text-muted-foreground">{formatPercent((1 - returningShare) * 100)} من المبيعات</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary/35" /> عملاء رجعوا ({formatNumber(c.returning)})
                  </dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums">{formatMoney(c.returningRevenue)}</dd>
                  <dd className="text-xs text-muted-foreground">{formatPercent(returningShare * 100)} من المبيعات</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">مفيش طلبات بأرقام عملاء في الفترة دي.</p>
          )}
          {c.walkInOrders > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
              <Store className="mt-0.5 size-3.5 shrink-0" />
              {formatNumber(c.walkInOrders)} بيعة في الكاشير بـ {formatMoney(c.walkInSales)} من غير بيانات عميل، ومش داخلة في
              أرقام العملاء. اطلب رقم العميل في الكاشير عشان تعرف مين بيرجع.
            </p>
          )}
        </Panel>

        <Panel title="قاعدة العملاء">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">كل العملاء المسجلين</dt>
              <dd className="font-medium tabular-nums">{formatNumber(c.crmTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">اتسجلوا في الفترة</dt>
              <dd className="font-medium tabular-nums">{formatNumber(c.crmNew)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Gift className="size-3.5" /> نقاط ولاء اتكسبت
              </dt>
              <dd className="font-medium tabular-nums">{formatNumber(data.loyalty.earned)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Gift className="size-3.5" /> نقاط اتستخدمت
              </dt>
              <dd className="font-medium tabular-nums">{formatNumber(data.loyalty.redeemed)}</dd>
            </div>
          </dl>
          <Link href="/crm/customers" className="mt-4 inline-block text-xs font-medium text-primary hover:underline">
            كل العملاء ←
          </Link>
        </Panel>
      </div>

      <Panel title="أكتر العملاء صرفًا" description="في الفترة المختارة" contentClassName={data.topCustomers.length ? "p-0" : undefined}>
        {data.topCustomers.length ? (
          <ReportTable
            head={
              <>
                <th className="w-8">#</th>
                <th>العميل</th>
                <th className="text-left!">الطلبات</th>
                <th className="text-left!">إجمالي الصرف</th>
                <th className="hidden md:table-cell">آخر طلب</th>
              </>
            }
          >
            {data.topCustomers.map((customer, i) => (
              <tr key={customer.key} className="relative hover:bg-muted/40">
                <td className="text-xs text-muted-foreground tabular-nums">
                  {i === 0 ? <Crown className="size-4 text-amber-500" /> : formatNumber(i + 1)}
                </td>
                <td>
                  {customer.customerId ? (
                    <Link href={`/crm/customers/${customer.customerId}`} className="font-medium after:absolute after:inset-0">
                      {customer.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{customer.name}</span>
                  )}
                  <span className="ms-2 text-xs text-muted-foreground tabular-nums" dir="ltr">
                    {customer.phone}
                  </span>
                  {customer.isNew && (
                    <StatusPill tone="info" className="ms-2">
                      جديد
                    </StatusPill>
                  )}
                </td>
                <td className="text-left tabular-nums">{formatNumber(customer.orders)}</td>
                <td className="text-left font-medium tabular-nums">{formatMoney(customer.spend)}</td>
                <td className="hidden text-xs text-muted-foreground md:table-cell">{dateFormat.format(customer.lastOrderAt)}</td>
              </tr>
            ))}
          </ReportTable>
        ) : (
          <EmptyNote icon={Users} title="مفيش عملاء اشتروا في الفترة دي" />
        )}
      </Panel>
    </div>
  );
}
