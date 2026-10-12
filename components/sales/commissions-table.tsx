import type { ReactNode } from "react";
import { StatusPill } from "@/components/saas-page";
import type { listCommissions } from "@/lib/sales/queries";
import { TIER_LABELS, formatRateBps, type SalesTier } from "@/lib/sales/rules";
import { COMMISSION_STATUS_META, KIND_LABELS, fmtCohort, fmtDate, fmtEligibleThrough, fmtMoney } from "@/lib/sales/format";

type Row = Awaited<ReturnType<typeof listCommissions>>["rows"][number];

const netOf = (row: Row) => row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0);

/** Commission snapshots with the qualifying payment reference. */
export function CommissionsTable({ rows, showRep = false, actions }: { rows: Row[]; showRep?: boolean; actions?: (row: Row) => ReactNode }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 bg-muted/40 text-right text-xs text-muted-foreground">
              <th className="ps-4 font-medium">العميل / الدفعة</th>
              {showRep && <th className="font-medium">المندوب</th>}
              <th className="font-medium">النوع والنسبة</th>
              <th className="hidden font-medium lg:table-cell">الأهلية</th>
              <th className="font-medium">الحالة</th>
              <th className="text-left font-medium">الأساس</th>
              <th className={actions ? "text-left font-medium" : "pe-4 text-left font-medium"}>العمولة</th>
              {actions && <th className="pe-4" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const net = netOf(row);
              const customer = row.attribution.customer;
              return (
                <tr key={row.id} className="align-top transition hover:bg-muted/30">
                  <td className="py-3 ps-4">
                    <p className="font-medium">{customer.stores[0]?.name ?? customer.name ?? customer.email}</p>
                    <p className="text-xs text-muted-foreground">دفعة {fmtDate(row.paymentAt)}</p>
                    <p dir="ltr" className="text-right font-mono text-[11px] text-muted-foreground" title="مرجع حركة الرصيد (SUBSCRIPTION_CHARGE)">
                      {row.balanceTransactionId.slice(0, 8)}
                    </p>
                  </td>
                  {showRep && <td className="py-3 text-xs">{row.salesRep.user.name ?? row.salesRep.user.email}</td>}
                  <td className="py-3">
                    <p>
                      {KIND_LABELS[row.kind]} · <span className="font-medium tabular-nums">{formatRateBps(row.rateBps)}</span>
                    </p>
                    {row.tier && (
                      <p className="text-xs text-muted-foreground">
                        {TIER_LABELS[row.tier as SalesTier]} · العميل رقم {row.customerPosition}
                      </p>
                    )}
                  </td>
                  <td className="hidden py-3 text-xs text-muted-foreground lg:table-cell">
                    دفعة {fmtCohort(row.cohortMonth)}
                    <span className="block">لحد {fmtEligibleThrough(row.eligibleUntil)}</span>
                  </td>
                  <td className="py-3">
                    <StatusPill tone={COMMISSION_STATUS_META[row.status].tone}>{COMMISSION_STATUS_META[row.status].label}</StatusPill>
                    {row.statusReason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{row.statusReason}</p>}
                    {row.payout && <p className="mt-1 text-xs text-muted-foreground">اتصرفت {fmtDate(row.payout.paidAt)}</p>}
                  </td>
                  <td className="py-3 text-left tabular-nums text-muted-foreground">{fmtMoney(row.basisAmount)}</td>
                  <td className={actions ? "py-3 text-left" : "py-3 pe-4 text-left"}>
                    <p className="font-medium tabular-nums">{fmtMoney(net)}</p>
                    {row.adjustments.length > 0 && (
                      <p className="text-xs text-muted-foreground tabular-nums" title={row.adjustments.map((a) => `${fmtMoney(a.amount)} — ${a.reason}`).join("\n")}>
                        أصلية {fmtMoney(row.amount)} · {row.adjustments.length} تسوية
                      </p>
                    )}
                  </td>
                  {actions && <td className="py-3 pe-4 text-left">{actions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y md:hidden">
        {rows.map((row) => {
          const customer = row.attribution.customer;
          return (
            <li key={row.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium">{customer.stores[0]?.name ?? customer.name ?? customer.email}</p>
                <p className="font-medium tabular-nums">{fmtMoney(netOf(row))}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {KIND_LABELS[row.kind]} {formatRateBps(row.rateBps)} من {fmtMoney(row.basisAmount)} · {fmtDate(row.paymentAt)}
                {showRep && ` · ${row.salesRep.user.name ?? row.salesRep.user.email}`}
              </p>
              <div className="flex items-center justify-between gap-2">
                <StatusPill tone={COMMISSION_STATUS_META[row.status].tone}>{COMMISSION_STATUS_META[row.status].label}</StatusPill>
                {actions?.(row)}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
