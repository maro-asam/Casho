import Link from "next/link";
import { Crown, Gift, Repeat, Store, UserPlus, Users, Wallet } from "lucide-react";

import { Tag } from "@/components/saas-page";
import { formatMoney, formatNumber, formatPercent } from "../../_components/overview/format";
import type { ReportsData } from "../_lib/types";
import { EmptyNote, Note, Panel, PanelLink, ReportTable, Stat } from "./report-ui";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const dateFormat = lazyIntl.date({ day: "numeric", month: "short", timeZone: "Africa/Cairo" });

export function TabCustomers({ data }: { data: ReportsData }) {
  const c = data.customers;
  const known = c.newRevenue + c.returningRevenue;
  const returningShare = known ? c.returningRevenue / known : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Users}
          label={tr("عملاء اشتروا")}
          delta={c.unique}
          format={formatNumber}
          hint={tr("عملاء مختلفين برقم موبايل عملوا طلب غير ملغي في الفترة.")}
        />
        <Stat
          icon={UserPlus}
          label={tr("عملاء جداد")}
          value={formatNumber(c.new)}
          hint={tr("أول طلب ليهم في متجرك كان في الفترة دي.")}
          sub={<span>{tr("{0} رجعوا تاني", formatNumber(c.returning))}</span>}
        />
        <Stat
          icon={Repeat}
          label={tr("اشتروا أكتر من مرة")}
          value={formatPercent(c.repeatRate)}
          hint={tr("نسبة العملاء اللي عملوا طلبين أو أكتر جوه الفترة نفسها.")}
        />
        <Stat
          icon={Wallet}
          label={tr("متوسط صرف العميل")}
          value={formatMoney(c.avgSpend)}
          hint={tr("إجمالي اللي دفعه العملاء المعروفين ÷ عددهم.")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={tr("مبيعات العملاء الجداد والقدام")} className="lg:col-span-2">
          {known > 0 ? (
            <>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(1 - returningShare) * 100}%` }} />
                <div className="h-full bg-primary/35" style={{ width: `${returningShare * 100}%` }} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-[15px]">
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" />{" "}{tr("عملاء جداد ({0})", formatNumber(c.new))}
                  </dt>
                  <dd className="mt-1 text-[22px] leading-7 font-bold tabular-nums">{formatMoney(c.newRevenue)}</dd>
                  <dd className="text-[13px] text-muted-foreground">{tr("{0} من المبيعات", formatPercent((1 - returningShare) * 100))}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary/35" />{" "}{tr("عملاء رجعوا ({0})", formatNumber(c.returning))}
                  </dt>
                  <dd className="mt-1 text-[22px] leading-7 font-bold tabular-nums">{formatMoney(c.returningRevenue)}</dd>
                  <dd className="text-[13px] text-muted-foreground">{tr("{0} من المبيعات", formatPercent(returningShare * 100))}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-[15px] text-muted-foreground">{tr("مفيش طلبات بأرقام عملاء في الفترة دي.")}</p>
          )}
          {c.walkInOrders > 0 && (
            <div className="mt-4">
              <Note icon={Store}>
              {tr("{0} بيعة في الكاشير بـ {1} من غير بيانات عميل، ومش داخلة في أرقام العملاء. اطلب رقم العميل في الكاشير عشان تعرف مين بيرجع.", formatNumber(c.walkInOrders), formatMoney(c.walkInSales))}
              </Note>
            </div>
          )}
        </Panel>

        <Panel title={tr("قاعدة العملاء")} action={<PanelLink href="/crm/customers">{tr("كل العملاء")}</PanelLink>} contentClassName="p-0 pb-2">
          <dl className="apple-rows text-[15px] [--row-inset:20px] [&>div]:flex [&>div]:min-h-11 [&>div]:items-center [&>div]:px-5 [&>div]:py-2.5">
            <div className="flex justify-between">
              <dt>{tr("كل العملاء المسجلين")}</dt>
              <dd className="ms-auto text-muted-foreground tabular-nums">{formatNumber(c.crmTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{tr("اتسجلوا في الفترة")}</dt>
              <dd className="ms-auto text-muted-foreground tabular-nums">{formatNumber(c.crmNew)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5">
                <Gift className="size-4 text-muted-foreground" strokeWidth={1.8} />{" "}{tr("نقاط ولاء اتكسبت")}
              </dt>
              <dd className="ms-auto text-muted-foreground tabular-nums">{formatNumber(data.loyalty.earned)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5">
                <Gift className="size-4 text-muted-foreground" strokeWidth={1.8} />{" "}{tr("نقاط اتستخدمت")}
              </dt>
              <dd className="ms-auto text-muted-foreground tabular-nums">{formatNumber(data.loyalty.redeemed)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title={tr("أكتر العملاء صرفًا")} description={tr("في الفترة المختارة")} contentClassName={data.topCustomers.length ? "p-0" : undefined}>
        {data.topCustomers.length ? (
          <ReportTable
            head={
              <>
                <th className="w-8">#</th>
                <th>{tr("العميل")}</th>
                <th className="text-end!">{tr("الطلبات")}</th>
                <th className="text-end!">{tr("إجمالي الصرف")}</th>
                <th className="hidden md:table-cell">{tr("آخر طلب")}</th>
              </>
            }
          >
            {data.topCustomers.map((customer, i) => (
              <tr key={customer.key} className="relative hover:bg-muted/40">
                <td className="text-[13px] text-muted-foreground tabular-nums">
                  {i === 0 ? <Crown className="size-4 text-(--sys-orange)" /> : formatNumber(i + 1)}
                </td>
                <td>
                  {customer.customerId ? (
                    <Link href={`/crm/customers/${customer.customerId}`} className="after:absolute after:inset-0 after:content-['']">
                      {customer.name}
                    </Link>
                  ) : (
                    <span>{customer.name}</span>
                  )}
                  <span className="ms-2 text-[13px] text-muted-foreground tabular-nums" dir="ltr">
                    {customer.phone}
                  </span>
                  {customer.isNew && (
                    <Tag tone="info" className="ms-2">
                      {tr("جديد")}
                    </Tag>
                  )}
                </td>
                <td className="text-end tabular-nums">{formatNumber(customer.orders)}</td>
                <td className="text-end font-medium tabular-nums">{formatMoney(customer.spend)}</td>
                <td className="hidden text-[13px] text-muted-foreground md:table-cell">{dateFormat.format(customer.lastOrderAt)}</td>
              </tr>
            ))}
          </ReportTable>
        ) : (
          <EmptyNote icon={Users} title={tr("مفيش عملاء اشتروا في الفترة دي")} />
        )}
      </Panel>
    </div>
  );
}
