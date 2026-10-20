import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetShiftByIdAction } from "@/actions/pos/shift.actions";
import { ChevronLeft } from "lucide-react";
import { StatusText } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { GroupTitle, PAYMENT_META, PosSubpage, Tile, paymentLabel } from "../../_components/pos-ui";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function egp(p: number) {
  return (p / 100).toLocaleString(intlLocale(), { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}


export default async function ShiftDetailPage({ params }: { params: Promise<{ shiftId: string }> }) {
  await loadDashboardLocale();
  const { shiftId } = await params;
  await requireUserId();

  const shift = await GetShiftByIdAction(shiftId);
  if (!shift) notFound();

  const isOpen = shift.status === "OPEN";
  const cashMoves = shift.entries
    .filter((e) => e.type === "CASH_IN" || e.type === "CASH_OUT")
    .reduce((s, e) => s + e.amount, 0);
  const cashRefunds = shift.returns.filter((r) => r.refundMethod === "cash").reduce((s, r) => s + r.refundAmount, 0);
  // Same formula as closing: float + cash sales + cash in/out − cash refunds.
  const cashSales = (shift.expectedCash ?? 0) - shift.openingBalance - cashMoves + cashRefunds;
  const profitTotal = shift.orders.reduce((s, o) => s + (o.profitTotal ?? 0), 0);
  const ordersByPayment = shift.orders.reduce<Record<string, number>>((acc, o) => {
    const method = o.splitPayments.length > 0
      ? "split"
      : o.paymentMethod;
    acc[method] = (acc[method] ?? 0) + o.total;
    return acc;
  }, {});

  const totalPaid = Object.values(ordersByPayment).reduce((a, b) => a + b, 0);
  const diff = shift.cashDifference ?? 0;
  const metrics = [
    { label: tr("إجمالي المبيعات"), value: tr("{0} ج", egp(shift.totalSales)), tone: "" },
    { label: tr("الربح الإجمالي"), value: tr("{0} ج", egp(profitTotal)), tone: profitTotal >= 0 ? "text-(--sys-green)" : "text-(--sys-red)" },
    { label: tr("عدد الفواتير"), value: shift.transactionCount.toString(), tone: "" },
    { label: tr("الخصومات"), value: tr("{0} ج", egp(shift.totalDiscount)), tone: shift.totalDiscount > 0 ? "text-(--sys-orange)" : "" },
  ];
  const entryLabel = (type: string) =>
    type === "OPENING_FLOAT"
      ? tr("رصيد الافتتاح")
      : type === "CLOSING_COUNT"
        ? tr("رصيد الإغلاق")
        : type === "CASH_IN"
          ? tr("إيداع نقدي")
          : type === "CASH_OUT"
            ? tr("سحب نقدي")
            : type;

  return (
    <div className="h-full" dir={tdir()}>
      <PosSubpage
        back="/pos/shifts"
        backLabel={tr("الورديات")}
        title={tr("تقرير الوردية")}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusText tone={isOpen ? "success" : "neutral"}>{isOpen ? tr("مفتوحة") : tr("مغلقة")}</StatusText>
            <span>
              {shift.cashier?.name ?? shift.cashier?.email} · {shift.branch && `${shift.branch.name} · `}
              {new Date(shift.openedAt).toLocaleString(intlLocale(), { dateStyle: "medium", timeStyle: "short" })}
              {shift.closedAt && ` → ${new Date(shift.closedAt).toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </span>
        }
      >
        {/* Key metrics */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-border/60 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col-reverse bg-card px-5 py-4">
              <dt className="text-[13px] text-muted-foreground">{m.label}</dt>
              <dd className={cn("text-[24px] leading-8 font-bold tabular-nums", m.tone)}>{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Cash reconciliation */}
          {!isOpen && (
            <section className="space-y-2">
              <GroupTitle>{tr("تسوية الدرج النقدي")}</GroupTitle>
              <div className="apple-card overflow-hidden rounded-[14px]">
                <dl className="apple-rows text-[15px] [--row-inset:16px]">
                  {[
                    [tr("رصيد الافتتاح"), egp(shift.openingBalance)],
                    [tr("+ المبيعات النقدية"), egp(cashSales)],
                    [tr("± إيداع / سحب نقدي"), egp(cashMoves)],
                    [tr("− مرتجعات نقدية"), egp(cashRefunds)],
                    [tr("= النقدية المتوقعة"), egp(shift.expectedCash ?? 0)],
                    [tr("النقدية الفعلية"), egp(shift.closingBalance ?? 0)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex min-h-11 items-center justify-between px-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="tabular-nums">{tr("{0} ج", val)}</dd>
                    </div>
                  ))}
                </dl>
                <div className={cn("flex items-center justify-between px-4 py-3", diff < 0 ? "bg-(--sys-red)/10" : diff > 0 ? "bg-(--sys-green)/10" : "bg-(--fill-3)/50")}>
                  <span className="text-[15px] font-semibold">{tr("الفرق")}</span>
                  <span className={cn("text-[22px] font-bold tabular-nums", diff < 0 ? "text-(--sys-red)" : diff > 0 ? "text-(--sys-green)" : "")}>
                    {tr("{0}{1} ج", diff >= 0 ? "+" : "", egp(diff))}
                  </span>
                </div>
              </div>
              {shift.notes && <p className="px-4 text-[13px] text-muted-foreground">{shift.notes}</p>}
            </section>
          )}

          {/* Payment breakdown */}
          {Object.keys(ordersByPayment).length > 0 && (
            <section className="space-y-2">
              <GroupTitle>{tr("توزيع المدفوعات")}</GroupTitle>
              <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:58px]">
                {Object.entries(ordersByPayment).map(([method, total]) => {
                  const meta = PAYMENT_META[method];
                  const share = totalPaid ? Math.round((total / totalPaid) * 100) : 0;
                  return (
                    <li key={method} className="flex items-center gap-3.5 px-4 py-3">
                      {meta ? <Tile icon={meta.icon} tint={meta.tint} /> : <span className="size-[29px] shrink-0 rounded-[7px] bg-(--sys-gray)" />}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-[15px]">
                          <span>{paymentLabel(method)}</span>
                          <span className="font-semibold tabular-nums">{tr("{0} ج", egp(total))}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--fill-3)" role="presentation">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Orders */}
        <section className="space-y-2">
          <GroupTitle>{tr("الفواتير ({0})", shift.orders.length)}</GroupTitle>
          {shift.orders.length === 0 ? (
            <div className="apple-card rounded-[14px] px-6 py-10 text-center text-[15px] text-muted-foreground">{tr("لا توجد فواتير في هذه الوردية")}</div>
          ) : (
            <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
              {shift.orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/dashboard/orders/${order.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-(--fill-3)/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{order.fullName}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {order.splitPayments.length > 0 ? paymentLabel("split") : paymentLabel(order.paymentMethod)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[15px] font-semibold tabular-nums">{tr("{0} ج", egp(order.total))}</p>
                      {order.profitTotal != null && (
                        <p className={cn("text-[12px] tabular-nums", order.profitTotal >= 0 ? "text-(--sys-green)" : "text-(--sys-red)")}>
                          {tr("ربح: {0} ج", egp(order.profitTotal))}
                        </p>
                      )}
                    </div>
                    <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cash entries log */}
        {shift.entries.length > 0 && (
          <section className="space-y-2">
            <GroupTitle>{tr("سجل الدرج النقدي")}</GroupTitle>
            <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
              {shift.entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[15px]">{entryLabel(entry.type)}</p>
                    {entry.note && <p className="truncate text-[13px] text-muted-foreground">{entry.note}</p>}
                  </div>
                  <div className="text-end">
                    <p className={cn("text-[15px] font-semibold tabular-nums", entry.amount >= 0 ? "text-(--sys-green)" : "text-(--sys-red)")}>
                      {tr("{0}{1} ج", entry.amount >= 0 ? "+" : "", egp(entry.amount))}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PosSubpage>
    </div>
  );
}
