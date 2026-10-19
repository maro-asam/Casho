import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetShiftByIdAction } from "@/actions/pos/shift.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function egp(p: number) {
  return (p / 100).toLocaleString(intlLocale(), { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const paymentLabels: Record<string, string> = {
  get cash() { return tr("نقداً"); }, get card() { return tr("بطاقة"); }, get vodafone_cash() { return tr("فودافون كاش"); },
  get instapay() { return tr("انستاباي"); }, get bank_transfer() { return tr("تحويل بنكي"); },
};

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

  return (
    <div className="min-h-screen bg-background p-6" dir={tdir()}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pos/shifts"><ArrowRight className="size-4 ltr:-scale-x-100" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {tr("تقرير الوردية")}
              <Badge className={isOpen ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                {isOpen ? tr("مفتوحة") : tr("مغلقة")}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {shift.cashier?.name ?? shift.cashier?.email} ·{" "}
              {shift.branch && `${shift.branch.name} · `}
              {new Date(shift.openedAt).toLocaleString(intlLocale())}
              {shift.closedAt && ` → ${new Date(shift.closedAt).toLocaleTimeString(intlLocale())}`}
            </p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: tr("إجمالي المبيعات"), value: tr("{0} ج", egp(shift.totalSales)), color: "text-primary" },
            { label: tr("الربح الإجمالي"), value: tr("{0} ج", egp(profitTotal)), color: profitTotal >= 0 ? "text-emerald-600" : "text-destructive" },
            { label: tr("عدد الفواتير"), value: shift.transactionCount.toString(), color: "text-foreground" },
            { label: tr("الخصومات"), value: tr("{0} ج", egp(shift.totalDiscount)), color: "text-amber-600" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Cash reconciliation */}
        {!isOpen && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm">{tr("تسوية الدرج النقدي")}</h2>
            <div className="space-y-1.5 text-sm">
              {[
                [tr("رصيد الافتتاح"), egp(shift.openingBalance)],
                [tr("+ المبيعات النقدية"), egp(cashSales)],
                [tr("± إيداع / سحب نقدي"), egp(cashMoves)],
                [tr("− مرتجعات نقدية"), egp(cashRefunds)],
                [tr("= النقدية المتوقعة"), egp(shift.expectedCash ?? 0)],
                [tr("النقدية الفعلية"), egp(shift.closingBalance ?? 0)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{tr("{0} ج", val)}</span>
                </div>
              ))}
              <div className="pt-1.5 border-t flex justify-between font-bold">
                <span>{tr("الفرق")}</span>
                <span className={shift.cashDifference! >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {tr("{0}{1} ج", shift.cashDifference! >= 0 ? "+" : "", egp(shift.cashDifference ?? 0))}
                </span>
              </div>
            </div>
            {shift.notes && (
              <p className="text-xs text-muted-foreground border-t pt-2">{shift.notes}</p>
            )}
          </div>
        )}

        {/* Payment breakdown */}
        {Object.keys(ordersByPayment).length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm">{tr("توزيع المدفوعات")}</h2>
            <div className="space-y-1.5">
              {Object.entries(ordersByPayment).map(([method, total]) => (
                <div key={method} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>{paymentLabels[method] ?? method}</span>
                  </div>
                  <span className="font-medium">{tr("{0} ج", egp(total))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-sm">{tr("الفواتير ({0})", shift.orders.length)}</h2>
          </div>
          {shift.orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tr("لا توجد فواتير في هذه الوردية")}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {shift.orders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{order.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString(intlLocale())} ·{" "}
                        {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-primary">{tr("{0} ج", egp(order.total))}</p>
                      {order.profitTotal !== null && order.profitTotal !== undefined && (
                        <p className={`text-xs ${order.profitTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {tr("ربح: {0} ج", egp(order.profitTotal))}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Cash entries log */}
        {shift.entries.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold text-sm">{tr("سجل الدرج النقدي")}</h2>
            </div>
            <div className="divide-y divide-border">
              {shift.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2">
                  <div>
                    <p className="text-xs font-medium">
                      {entry.type === "OPENING_FLOAT" ? tr("رصيد الافتتاح") :
                       entry.type === "CLOSING_COUNT" ? tr("رصيد الإغلاق") :
                       entry.type === "CASH_IN" ? tr("إيداع نقدي") :
                       entry.type === "CASH_OUT" ? tr("سحب نقدي") : entry.type}
                    </p>
                    {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${entry.amount >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {tr("{0}{1} ج", entry.amount >= 0 ? "+" : "", egp(entry.amount))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString(intlLocale())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
