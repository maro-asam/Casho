import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/saas-page";
import type { listAttributedCustomers } from "@/lib/sales/queries";
import {
  ELIGIBILITY_META,
  SUBSCRIPTION_META,
  eligibilityState,
  fmtCohort,
  fmtDate,
  fmtEligibleThrough,
} from "@/lib/sales/format";

type Row = Awaited<ReturnType<typeof listAttributedCustomers>>["rows"][number];

/** Attributed customers. `showRep` for admins; `actions` renders per-row controls (admin). */
export function CustomersTable({
  rows,
  detailBase,
  showRep = false,
  actions,
}: {
  rows: Row[];
  detailBase: string;
  showRep?: boolean;
  actions?: (row: Row) => ReactNode;
}) {
  const now = new Date();
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 bg-muted/40 text-right text-xs text-muted-foreground">
              <th className="ps-4 font-medium">العميل</th>
              {showRep && <th className="font-medium">المندوب</th>}
              <th className="font-medium">التسجيل</th>
              <th className="font-medium">الاشتراك</th>
              <th className="hidden font-medium lg:table-cell">أول دفعة</th>
              <th className="font-medium">الأهلية</th>
              {actions && <th className="pe-4 font-medium" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const store = row.customer.stores[0];
              const state = eligibilityState(row, now);
              return (
                <tr key={row.id} className="relative transition hover:bg-muted/30">
                  <td className="py-3 ps-4">
                    <Link href={`${detailBase}/${row.customer.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                      {store?.name ?? row.customer.name ?? row.customer.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.customer.name ?? "—"} · <span dir="ltr">{row.customer.email}</span>
                    </p>
                  </td>
                  {showRep && (
                    <td className="py-3 text-xs">
                      {row.salesRep.user.name ?? row.salesRep.user.email}
                      {row._count.changes > 0 && <span className="block text-muted-foreground">اتنقل {row._count.changes} مرة</span>}
                    </td>
                  )}
                  <td className="py-3 text-muted-foreground">{fmtDate(row.signedUpAt)}</td>
                  <td className="py-3">
                    {store ? (
                      <div className="space-y-1">
                        <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>
                        <p className="text-xs text-muted-foreground">
                          {store.plan?.name ?? "بدون باقة"} · {store.billingCycle === "YEARLY" ? "سنوي" : "شهري"} · يتجدد {fmtDate(store.subscriptionEndsAt)}
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden py-3 text-muted-foreground lg:table-cell">
                    {row.acquiredAt ? (
                      <>
                        {fmtDate(row.acquiredAt)}
                        <span className="block text-xs">دفعة {fmtCohort(row.cohortMonth)}</span>
                      </>
                    ) : (
                      "لم يدفع بعد"
                    )}
                  </td>
                  <td className="py-3">
                    <StatusPill tone={ELIGIBILITY_META[state].tone}>{ELIGIBILITY_META[state].label}</StatusPill>
                    {state === "eligible" && <p className="mt-1 text-xs text-muted-foreground">لحد {fmtEligibleThrough(row.eligibleUntil)}</p>}
                  </td>
                  {actions && <td className="relative z-10 py-3 pe-4 text-left">{actions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y md:hidden">
        {rows.map((row) => {
          const store = row.customer.stores[0];
          const state = eligibilityState(row, now);
          return (
            <li key={row.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`${detailBase}/${row.customer.id}`} className="min-w-0 font-medium hover:underline">
                  {store?.name ?? row.customer.name ?? row.customer.email}
                </Link>
                <StatusPill tone={ELIGIBILITY_META[state].tone}>{ELIGIBILITY_META[state].label}</StatusPill>
              </div>
              <p className="text-xs text-muted-foreground">
                تسجيل {fmtDate(row.signedUpAt)}
                {row.acquiredAt && ` · أول دفعة ${fmtDate(row.acquiredAt)}`}
                {showRep && ` · ${row.salesRep.user.name ?? row.salesRep.user.email}`}
              </p>
              {store && <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>}
              {actions && <div>{actions(row)}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
