import type { ReactNode } from "react";
import { StatusPill } from "@/components/saas-page";
import type { getAttributedCustomer } from "@/lib/sales/queries";
import { formatRateBps } from "@/lib/sales/rules";
import {
  COMMISSION_STATUS_META,
  ELIGIBILITY_META,
  KIND_LABELS,
  SUBSCRIPTION_META,
  eligibilityState,
  fmtCohort,
  fmtDate,
  fmtDateTime,
  fmtEligibleThrough,
  fmtMoney,
} from "@/lib/sales/format";
import { Panel } from "./sales-summary";

type Detail = NonNullable<Awaited<ReturnType<typeof getAttributedCustomer>>>;

/** Shared by admin and Sales — the caller decides the scope and passes repNames only to admins. */
export function CustomerDetail({
  detail,
  repNames,
  headerActions,
}: {
  detail: Detail;
  /** Admin only: id → name, to render the attribution history. */
  repNames?: Map<string, string>;
  headerActions?: ReactNode;
}) {
  const { attribution, payments, commissions } = detail;
  const { customer } = attribution;
  const state = eligibilityState(attribution);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{customer.stores[0]?.name ?? customer.name ?? customer.email}</h2>
          <p className="text-sm text-muted-foreground">
            {customer.name ?? "—"} · <span dir="ltr">{customer.email}</span>
            {customer.phone_number && (
              <>
                {" · "}
                <span dir="ltr">{customer.phone_number}</span>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusPill tone={ELIGIBILITY_META[state].tone}>{ELIGIBILITY_META[state].label}</StatusPill>
            {repNames && <span className="text-xs text-muted-foreground">المندوب الحالي: {attribution.salesRep.user.name ?? attribution.salesRep.user.email}</span>}
          </div>
        </div>
        {headerActions}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="التواريخ والأهلية">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">التسجيل</dt>
            <dd>{fmtDate(attribution.signedUpAt)}</dd>
            <dt className="text-muted-foreground">مصدر النسب</dt>
            <dd>{attribution.source === "SIGNUP_LINK" ? "رابط إحالة" : "قرار إداري"}</dd>
            <dt className="text-muted-foreground">أول دفعة (الاكتساب)</dt>
            <dd>{attribution.acquiredAt ? fmtDateTime(attribution.acquiredAt) : "لم يدفع بعد"}</dd>
            <dt className="text-muted-foreground">دفعة الشهر</dt>
            <dd>{fmtCohort(attribution.cohortMonth)}</dd>
            <dt className="text-muted-foreground">مؤهل لحد</dt>
            <dd>{fmtEligibleThrough(attribution.eligibleUntil)}</dd>
          </dl>
        </Panel>

        <Panel title="المتاجر والاشتراك">
          <ul className="divide-y text-sm">
            {customer.stores.map((store) => (
              <li key={store.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {store.name}
                  <span className="ms-2 text-xs text-muted-foreground">
                    {store.plan?.name ?? "بدون باقة"} · {store.billingCycle === "YEARLY" ? "سنوي" : "شهري"} · يتجدد {fmtDate(store.subscriptionEndsAt)}
                  </span>
                </span>
                <StatusPill tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusPill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="سجل المدفوعات الموثّقة" description="خصومات الاشتراك من رصيد المتجر ومرتجعات تخفيض الباقة." flush>
        {payments.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">مفيش مدفوعات اشتراك لسه.</p>
        ) : (
          <ul className="divide-y text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span>
                  {p.type === "REFUND" ? "مرتجع رصيد" : "خصم اشتراك"} · {fmtDateTime(p.createdAt)}
                  {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                  <span dir="ltr" className="block text-right font-mono text-[11px] text-muted-foreground">
                    {p.id.slice(0, 8)}
                  </span>
                </span>
                <span className="font-medium tabular-nums">{fmtMoney(Math.abs(p.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="العمولات على العميل ده" flush>
        {commissions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">مفيش عمولات.</p>
        ) : (
          <ul className="divide-y text-sm">
            {commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span>
                  {KIND_LABELS[c.kind]} · {formatRateBps(c.rateBps)} من {fmtMoney(c.basisAmount)} · {fmtDate(c.paymentAt)}
                  {repNames && <span className="block text-xs text-muted-foreground">{repNames.get(c.salesRepId) ?? "—"}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <StatusPill tone={COMMISSION_STATUS_META[c.status].tone}>{COMMISSION_STATUS_META[c.status].label}</StatusPill>
                  <span className="font-medium tabular-nums">{fmtMoney(c.amount + c.adjustments.reduce((s, a) => s + a.amount, 0))}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {repNames && (
        <Panel title="سجل النسب">
          <ul className="divide-y text-sm">
            <li className="py-2">
              النسب الأصلي: {repNames.get(attribution.originalSalesRepId) ?? "—"}
              <span className="ms-2 text-xs text-muted-foreground">{fmtDateTime(attribution.createdAt)}</span>
            </li>
            {attribution.changes.map((ch) => (
              <li key={ch.id} className="py-2">
                {ch.fromSalesRepId ? `${repNames.get(ch.fromSalesRepId) ?? "—"} ← ` : ""}
                {repNames.get(ch.toSalesRepId) ?? "—"}
                <span className="ms-2 text-xs text-muted-foreground">
                  {repNames.get(ch.actorUserId) ?? "أدمن"} · {fmtDateTime(ch.createdAt)}
                </span>
                <p className="text-xs text-muted-foreground">السبب: {ch.reason}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
