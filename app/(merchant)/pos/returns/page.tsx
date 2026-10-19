import Link from "next/link";
import { requirePosContext } from "@/lib/pos/pos-context";
import { GetReturnsAction } from "@/actions/pos/returns.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";
import ReturnsClient from "./_components/ReturnsClient";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ReturnsPage() {
  await loadDashboardLocale();
  const ctx = await requirePosContext();
  const store = { id: ctx.storeId };

  const returns = await GetReturnsAction(100);

  return (
    <div className="min-h-screen bg-background p-6" dir={tdir()}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/pos"><ArrowRight className="size-4 ltr:-scale-x-100" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="size-5" />
                {tr("المرتجعات والاستبدالات")}
              </h1>
              <p className="text-sm text-muted-foreground">{tr("{0} عملية إرجاع", returns.length)}</p>
            </div>
          </div>
          <ReturnsClient storeId={store.id} />
        </div>

        {/* Returns list */}
        <div className="space-y-3">
          {returns.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <RotateCcw className="size-10 mx-auto mb-2 opacity-30" />
              <p>{tr("لا توجد مرتجعات بعد")}</p>
            </div>
          ) : (
            returns.map((ret) => (
              <div key={ret.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {ret.type === "FULL_RETURN" ? tr("إرجاع كامل") :
                         ret.type === "PARTIAL_RETURN" ? tr("إرجاع جزئي") : tr("استبدال")}
                      </Badge>
                      <span className="text-sm font-medium">
                        {tr("طلب #{0}", ret.originalOrder.id.slice(-6).toUpperCase())}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tr("{0} · {1} · الكاشير: {2}", ret.originalOrder.fullName, new Date(ret.createdAt).toLocaleString(intlLocale()), ret.cashier?.name ?? "—")}
                      {ctx.branches.length > 1 && ret.branch && ` · ${ret.branch.name}`}
                    </p>
                    {ret.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">{tr("السبب: {0}", ret.reason)}</p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-destructive">
                      {tr("−{0} ج", ((ret.refundAmount ?? 0) / 100).toFixed(0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ret.refundMethod === "cash" ? tr("نقداً") : ret.refundMethod}
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
