import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetShiftByIdAction } from "@/actions/pos/shift.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function egp(p: number) {
  return (p / 100).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const paymentLabels: Record<string, string> = {
  cash: "نقداً", card: "بطاقة", vodafone_cash: "فودافون كاش",
  instapay: "انستاباي", bank_transfer: "تحويل بنكي",
};

export default async function ShiftDetailPage({ params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params;
  await requireUserId();

  const shift = await GetShiftByIdAction(shiftId);
  if (!shift) notFound();

  const isOpen = shift.status === "OPEN";
  const profitTotal = shift.orders.reduce((s, o) => s + (o.profitTotal ?? 0), 0);
  const ordersByPayment = shift.orders.reduce<Record<string, number>>((acc, o) => {
    const method = o.splitPayments.length > 0
      ? "split"
      : o.paymentMethod;
    acc[method] = (acc[method] ?? 0) + o.total;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pos/shifts"><ArrowRight className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              تقرير الوردية
              <Badge className={isOpen ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                {isOpen ? "مفتوحة" : "مغلقة"}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {shift.cashier?.name} ·{" "}
              {new Date(shift.openedAt).toLocaleString("ar-EG")}
              {shift.closedAt && ` → ${new Date(shift.closedAt).toLocaleTimeString("ar-EG")}`}
            </p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "إجمالي المبيعات", value: `${egp(shift.totalSales)} ج`, color: "text-primary" },
            { label: "الربح الإجمالي", value: `${egp(profitTotal)} ج`, color: profitTotal >= 0 ? "text-emerald-600" : "text-destructive" },
            { label: "عدد الفواتير", value: shift.transactionCount.toString(), color: "text-foreground" },
            { label: "الخصومات", value: `${egp(shift.totalDiscount)} ج`, color: "text-amber-600" },
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
            <h2 className="font-semibold text-sm">تسوية الدرج النقدي</h2>
            <div className="space-y-1.5 text-sm">
              {[
                ["رصيد الافتتاح", egp(shift.openingBalance)],
                ["+ المبيعات النقدية", egp(shift.totalSales)],
                ["− المرتجعات", egp(shift.totalReturns)],
                ["= النقدية المتوقعة", egp(shift.expectedCash ?? 0)],
                ["النقدية الفعلية", egp(shift.closingBalance ?? 0)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val} ج</span>
                </div>
              ))}
              <div className="pt-1.5 border-t flex justify-between font-bold">
                <span>الفرق</span>
                <span className={shift.cashDifference! >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {shift.cashDifference! >= 0 ? "+" : ""}{egp(shift.cashDifference ?? 0)} ج
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
            <h2 className="font-semibold text-sm">توزيع المدفوعات</h2>
            <div className="space-y-1.5">
              {Object.entries(ordersByPayment).map(([method, total]) => (
                <div key={method} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>{paymentLabels[method] ?? method}</span>
                  </div>
                  <span className="font-medium">{egp(total)} ج</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-sm">الفواتير ({shift.orders.length})</h2>
          </div>
          {shift.orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              لا توجد فواتير في هذه الوردية
            </div>
          ) : (
            <div className="divide-y divide-border">
              {shift.orders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders?order=${order.id}`}>
                  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{order.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString("ar-EG")} ·{" "}
                        {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-primary">{egp(order.total)} ج</p>
                      {order.profitTotal !== null && order.profitTotal !== undefined && (
                        <p className={`text-xs ${order.profitTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          ربح: {egp(order.profitTotal)} ج
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
              <h2 className="font-semibold text-sm">سجل الدرج النقدي</h2>
            </div>
            <div className="divide-y divide-border">
              {shift.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2">
                  <div>
                    <p className="text-xs font-medium">
                      {entry.type === "OPENING_FLOAT" ? "رصيد الافتتاح" :
                       entry.type === "CLOSING_COUNT" ? "رصيد الإغلاق" :
                       entry.type === "CASH_IN" ? "إيداع نقدي" :
                       entry.type === "CASH_OUT" ? "سحب نقدي" : entry.type}
                    </p>
                    {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${entry.amount >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {entry.amount >= 0 ? "+" : ""}{egp(entry.amount)} ج
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString("ar-EG")}
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
