import { BarChart3, Lightbulb } from "lucide-react";
import { Card, Unavailable } from "@/components/saas-page";
import { PAYMENT_METHODS_BY_KEY, type PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { formatMoney } from "@/lib/balance-ui/meta";
import { cn } from "@/lib/utils";
import { MethodLogo } from "./shared";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type MethodStat = { key: string; orders: number; revenue: number; canceled: number };

const nf = lazyIntl.number();
const pct = (n: number) => tr("{0}٪", nf.format(Math.round(n)));

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
    insight = tr("الطلبات الكاش بتتلغي {0} مقابل {1} بس للمدفوع مقدمًا — شجّع عملاءك يدفعوا أونلاين.", pct(codCancel), pct(prepaidCancel));
  } else if (cod && total && cod.orders / total >= 0.8) {
    insight = tr("{0} من طلباتك كاش عند الاستلام. الدفع الأونلاين بيقلل المرتجع ويوصّل فلوسك أسرع.", pct((cod.orders / total) * 100));
  }

  return (
    <Card title={tr("العملاء بيدفعوا إزاي؟")} subtitle={<>{tr("آخر {0} يوم", nf.format(periodDays))}{total > 0 && tr(" · {0} طلب", nf.format(total))}</>}>
      {total === 0 ? (
        <Unavailable icon={BarChart3} title={tr("لسه مفيش طلبات")} description={tr("أول ما توصلك طلبات، هتشوف هنا كل طريقة دفع جابت كام وكام اتلغى منها.")} className="py-10" />
      ) : (
        <>
          {insight && (
            <p className="mx-5 mb-3 flex items-start gap-2.5 rounded-[12px] bg-(--sys-orange)/10 px-4 py-3 text-[15px] leading-[21px]">
              <Lightbulb className="mt-0.5 size-[18px] shrink-0 text-(--sys-orange)" />
              {insight}
            </p>
          )}
          <ul className="apple-rows pb-2 [--row-inset:64px]">
            {rows.map((r) => {
              const m = PAYMENT_METHODS_BY_KEY[r.key as PaymentMethodKey];
              const share = (r.orders / total) * 100;
              const cancel = r.orders ? (r.canceled / r.orders) * 100 : 0;
              return (
                <li key={r.key} className="flex items-center gap-3 px-5 py-3">
                  {m ? <MethodLogo src={m.logo} alt="" size="sm" /> : <span className="size-8 shrink-0" />}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[15px] font-medium">{m?.label ?? r.key}</p>
                      <p className="shrink-0 text-[15px] font-semibold tabular-nums">{formatMoney(r.revenue)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-(--fill-3)">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, share)}%` }} />
                    </div>
                    <div className="flex justify-between gap-3 text-[12px] text-muted-foreground tabular-nums">
                      <span>
                        {tr("{0} طلب", nf.format(r.orders))} · {pct(share)}
                      </span>
                      <span className={cn(cancel >= 20 && "font-semibold text-(--sys-red)")}>
                        {r.canceled > 0 ? tr("{0} اتلغى", pct(cancel)) : tr("مفيش إلغاء")}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
