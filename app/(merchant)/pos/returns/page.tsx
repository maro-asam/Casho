import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetReturnsAction } from "@/actions/pos/returns.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";
import ReturnsClient from "./_components/ReturnsClient";

export default async function ReturnsPage() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) redirect("/");

  const returns = await GetReturnsAction(100);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/pos"><ArrowRight className="size-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="size-5" />
                المرتجعات والاستبدالات
              </h1>
              <p className="text-sm text-muted-foreground">{returns.length} عملية إرجاع</p>
            </div>
          </div>
          <ReturnsClient storeId={store.id} />
        </div>

        {/* Returns list */}
        <div className="space-y-3">
          {returns.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <RotateCcw className="size-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد مرتجعات بعد</p>
            </div>
          ) : (
            returns.map((ret) => (
              <div key={ret.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {ret.type === "FULL_RETURN" ? "إرجاع كامل" :
                         ret.type === "PARTIAL_RETURN" ? "إرجاع جزئي" : "استبدال"}
                      </Badge>
                      <span className="text-sm font-medium">
                        طلب #{ret.originalOrder.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ret.originalOrder.fullName} ·{" "}
                      {new Date(ret.createdAt).toLocaleString("ar-EG")} ·{" "}
                      الكاشير: {ret.cashier?.name ?? "—"}
                    </p>
                    {ret.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">السبب: {ret.reason}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-destructive">
                      −{((ret.refundAmount ?? 0) / 100).toFixed(0)} ج
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ret.refundMethod === "cash" ? "نقداً" : ret.refundMethod}
                    </p>
                  </div>
                </div>

                {/* Returned items */}
                {ret.items.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ret.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 text-xs">
                        <span>{item.product.name}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
