import { BarChart3 } from "lucide-react";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { MethodLogo } from "./shared";

export type MethodStat = { key: string; orders: number; revenue: number; canceled: number };

const nf = new Intl.NumberFormat("ar-EG");
const pct = (n: number) => `${nf.format(Math.round(n))}٪`;

export function MethodPerformance({ stats, periodDays }: { stats: MethodStat[]; periodDays: number }) {
  const total = stats.reduce((s, x) => s + x.orders, 0);
  const rows = [...stats].sort((a, b) => b.orders - a.orders);

  const cod = stats.find((s) => s.key === "cash_on_delivery");
  const prepaid = stats.filter((s) => s.key !== "cash_on_delivery");
  const prepaidOrders = prepaid.reduce((s, x) => s + x.orders, 0);
  const prepaidCancel = prepaidOrders ? (prepaid.reduce((s, x) => s + x.canceled, 0) / prepaidOrders) * 100 : null;
  const codCancel = cod?.orders ? (cod.canceled / cod.orders) * 100 : null;

  let insight: string | null = null;
  if (codCancel !== null && prepaidCancel !== null && codCancel - prepaidCancel >= 5) {
    insight = `الطلبات الكاش بتتلغي ${pct(codCancel)} مقابل ${pct(prepaidCancel)} بس للمدفوع مقدمًا — شجّع عملاءك يدفعوا أونلاين.`;
  } else if (cod && total && cod.orders / total >= 0.8) {
    insight = `${pct((cod.orders / total) * 100)} من طلباتك كاش عند الاستلام. الدفع الأونلاين بيقلل المرتجع ويوصّل فلوسك أسرع.`;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <BarChart3 className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">العملاء بيدفعوا إزاي؟</h2>
          <p className="text-sm text-muted-foreground">
            آخر {nf.format(periodDays)} يوم{total > 0 && ` · ${nf.format(total)} طلب`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {total === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">أول ما توصلك طلبات، هتشوف هنا كل طريقة دفع جابت كام وكام اتلغى منها.</p>
        ) : (
          <>
            {insight && <p className="border-b border-border bg-primary/[0.03] px-5 py-3 text-sm leading-6">{insight}</p>}
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const m = PAYMENT_METHODS_BY_KEY[r.key as PaymentMethodKey];
                const share = (r.orders / total) * 100;
                const cancel = r.orders ? (r.canceled / r.orders) * 100 : 0;
                return (
                  <li key={r.key} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-5 py-3.5 sm:grid-cols-[auto_minmax(0,12rem)_minmax(0,1fr)_auto]">
                    {m ? <MethodLogo src={m.logo} alt="" size="sm" /> : <span className="size-8" />}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m?.label ?? r.key}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{nf.format(r.orders)} طلب</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, share)}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-end text-sm tabular-nums">{pct(share)}</span>
                    </div>
                    <div className="col-span-2 flex justify-between gap-4 text-xs sm:col-span-1 sm:block sm:text-end">
                      <p className="font-medium tabular-nums">{formatMoney(r.revenue)}</p>
                      <p className={cn("tabular-nums text-muted-foreground", cancel >= 20 && "text-rose-700 dark:text-rose-400")}>
                        {r.canceled > 0 ? `${pct(cancel)} اتلغى` : "مفيش إلغاء"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
