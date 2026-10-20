import { RotateCcw } from "lucide-react";
import { requirePosContext } from "@/lib/pos/pos-context";
import { GetReturnsAction } from "@/actions/pos/returns.actions";
import { Tag } from "@/components/saas-page";
import ReturnsClient from "./_components/ReturnsClient";
import { PosSubpage } from "../_components/pos-ui";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ReturnsPage() {
  await loadDashboardLocale();
  const ctx = await requirePosContext();
  const store = { id: ctx.storeId };

  const returns = await GetReturnsAction(100);
  const refunded = returns.reduce((s, r) => s + (r.refundAmount ?? 0), 0);
  const money = (p: number) => tr("{0} ج", (p / 100).toFixed(0));
  const typeLabel = (t: string) => (t === "FULL_RETURN" ? tr("إرجاع كامل") : t === "PARTIAL_RETURN" ? tr("إرجاع جزئي") : tr("استبدال"));
  const refundLabel = (m: string | null) => (m === "cash" ? tr("نقداً") : m === "card" ? tr("بطاقة") : m === "store_credit" ? tr("رصيد بالمتجر") : (m ?? "—"));

  return (
    <div className="h-full" dir={tdir()}>
      <PosSubpage
        back="/pos"
        backLabel={tr("نقطة البيع")}
        title={tr("المرتجعات والاستبدالات")}
        subtitle={
          returns.length > 0 ? (
            <>
              {tr("{0} عملية إرجاع", returns.length)} · <span className="tabular-nums">{tr("اترد {0}", money(refunded))}</span>
            </>
          ) : (
            tr("{0} عملية إرجاع", returns.length)
          )
        }
        actions={<ReturnsClient storeId={store.id} />}
      >
        {returns.length === 0 ? (
          <div className="apple-card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <RotateCcw className="mb-2 size-11 text-(--label-3)" strokeWidth={1.5} />
            <p className="text-[20px] font-semibold">{tr("لا توجد مرتجعات بعد")}</p>
            <p className="max-w-sm text-[15px] text-muted-foreground">{tr("لما عميل يرجّع حاجة، دوس «إرجاع جديد» واكتب رقم الطلب — المخزون بيرجع لوحده.")}</p>
          </div>
        ) : (
          <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:68px]">
            {returns.map((ret) => (
              <li key={ret.id} className="flex items-start gap-3 px-4 py-3.5">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-(--sys-orange)/14 text-(--sys-orange)">
                  <RotateCcw className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[15px] font-semibold">
                      {tr("طلب #{0}", ret.originalOrder.id.slice(-6).toUpperCase())} · {ret.originalOrder.fullName}
                    </p>
                    <p className="shrink-0 text-[15px] font-semibold text-(--sys-red) tabular-nums">−{money(ret.refundAmount ?? 0)}</p>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
                    <p className="min-w-0 truncate">
                      {new Date(ret.createdAt).toLocaleString(intlLocale(), { dateStyle: "medium", timeStyle: "short" })} · {tr("الكاشير: {0}", ret.cashier?.name ?? "—")}
                      {ctx.branches.length > 1 && ret.branch && ` · ${ret.branch.name}`}
                    </p>
                    <span className="shrink-0">{refundLabel(ret.refundMethod)}</span>
                  </div>
                  {ret.reason && <p className="mt-1 text-[13px]">{tr("السبب: {0}", ret.reason)}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Tag tone={ret.type === "FULL_RETURN" ? "danger" : ret.type === "PARTIAL_RETURN" ? "warning" : "info"}>{typeLabel(ret.type)}</Tag>
                    {ret.items.map((item) => (
                      <span key={item.id} className="inline-flex h-6 items-center gap-1 rounded-full bg-(--fill-3) px-2.5 text-[12px]">
                        {item.product.name}
                        <span className="text-muted-foreground tabular-nums">×{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PosSubpage>
    </div>
  );
}
