import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetShiftsAction } from "@/actions/pos/shift.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";

function egp(p: number) {
  return (p / 100).toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default async function ShiftsPage() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) redirect("/");

  const shifts = await GetShiftsAction(50);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/pos"><ArrowRight className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">تقارير الورديات</h1>
            <p className="text-sm text-muted-foreground">{shifts.length} وردية</p>
          </div>
        </div>

        {/* Shifts list */}
        <div className="space-y-3">
          {shifts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <Clock className="size-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد ورديات بعد</p>
            </div>
          ) : (
            shifts.map((shift) => {
              const isOpen = shift.status === "OPEN";
              const duration = shift.closedAt
                ? Math.floor((new Date(shift.closedAt).getTime() - new Date(shift.openedAt).getTime()) / 60000)
                : Math.floor((Date.now() - new Date(shift.openedAt).getTime()) / 60000);

              return (
                <Link key={shift.id} href={`/pos/shifts/${shift.id}`}>
                  <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={isOpen ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-muted text-muted-foreground"}>
                            {isOpen ? "مفتوحة" : "مغلقة"}
                          </Badge>
                          <span className="text-sm font-medium">
                            {shift.cashier?.name ?? shift.cashier?.email ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(shift.openedAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({duration} دقيقة)
                          </span>
                        </div>
                      </div>

                      {!isOpen && shift.cashDifference !== null && shift.cashDifference !== undefined && shift.cashDifference !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          shift.cashDifference > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          <AlertCircle className="size-3" />
                          {shift.cashDifference > 0 ? "+" : ""}{egp(shift.cashDifference)} ج
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-3">
                      <div className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">المبيعات</p>
                        <p className="text-sm font-bold text-primary">{egp(shift.totalSales)} ج</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">الفواتير</p>
                        <p className="text-sm font-bold">{shift.transactionCount}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">رصيد الافتتاح</p>
                        <p className="text-sm font-bold">{egp(shift.openingBalance)} ج</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">
                          {isOpen ? "النقدية المتوقعة" : "رصيد الإغلاق"}
                        </p>
                        <p className="text-sm font-bold">
                          {isOpen
                            ? egp(shift.openingBalance + shift.totalSales)
                            : egp(shift.closingBalance ?? 0)
                          } ج
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
