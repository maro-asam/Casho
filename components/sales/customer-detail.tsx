import type { ReactNode } from "react";
import { BadgeDollarSign, CalendarDays, History, Receipt, Store } from "lucide-react";
import { Card, Row, Rows, StatusText, Tag, initialOf } from "@/components/saas-page";
import type { getAttributedCustomer } from "@/lib/sales/queries";
import { CAMPAIGN_REASON_LABELS, type CampaignReason } from "@/lib/sales/campaign";
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
  const title = customer.stores[0]?.name ?? customer.name ?? customer.email;
  // The admin shell already has the page's h1.
  const Heading = repNames ? "h2" : "h1";
  const earned = commissions
    .filter((c) => c.status !== "REJECTED" && c.status !== "REVERSED")
    .reduce((s, c) => s + c.amount + c.adjustments.reduce((t, a) => t + a.amount, 0), 0);

  return (
    <div className="space-y-5">
      <section className="apple-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-linear-to-b from-primary/80 to-primary text-[22px] font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.3)]"
          >
            {initialOf(title)}
          </span>
          <div className="min-w-0 space-y-1">
            <Heading className="truncate text-[28px] leading-[34px] font-bold">{title}</Heading>
            <p className="text-[15px] text-muted-foreground">
              {customer.name ?? "—"} · <span dir="ltr">{customer.email}</span>
              {customer.phone_number && (
                <>
                  {" · "}
                  <span dir="ltr">{customer.phone_number}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Tag tone={ELIGIBILITY_META[state].tone}>{ELIGIBILITY_META[state].label}</Tag>
              {earned > 0 && <Tag tone="info">{repNames ? "عمولات منه" : "عمولاتك منه"} {fmtMoney(earned)}</Tag>}
              {repNames && (
                <span className="text-[13px] text-muted-foreground">
                  المندوب الحالي: {attribution.salesRep.user.name ?? attribution.salesRep.user.email}
                </span>
              )}
            </div>
          </div>
        </div>
        {headerActions && <div className="flex flex-wrap items-center gap-2">{headerActions}</div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="التواريخ والأهلية" icon={CalendarDays}>
          <Rows>
            <Row label="التسجيل">{fmtDate(attribution.signedUpAt)}</Row>
            <Row label="مصدر النسب">{attribution.source === "SIGNUP_LINK" ? "رابط إحالة" : "قرار إداري"}</Row>
            <Row label="أول دفعة (الاكتساب)">{attribution.acquiredAt ? fmtDateTime(attribution.acquiredAt) : "لم يدفع بعد"}</Row>
            <Row label="دفعة الشهر">{fmtCohort(attribution.cohortMonth)}</Row>
            <Row label="مؤهل لحد">{fmtEligibleThrough(attribution.eligibleUntil)}</Row>
          </Rows>
        </Card>

        <Card title="المتاجر والاشتراك" icon={Store}>
          {customer.stores.length === 0 ? (
            <p className="px-5 pb-5 text-[15px] text-muted-foreground">لسه معملش متجر.</p>
          ) : (
            <ul className="apple-rows pb-2 [--row-inset:20px]">
              {customer.stores.map((store) => (
                <li key={store.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{store.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {store.plan?.name ?? "بدون باقة"} · {store.billingCycle === "YEARLY" ? "سنوي" : "شهري"} · يتجدد {fmtDate(store.subscriptionEndsAt)}
                    </p>
                  </div>
                  <StatusText tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusText>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="العمولات على العميل ده" icon={BadgeDollarSign}>
        {commissions.length === 0 ? (
          <p className="px-5 pb-5 text-[15px] text-muted-foreground">مفيش عمولات لسه — بتبدأ مع أول دفعة اشتراك.</p>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            {commissions.map((c) => (
              <li key={c.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[15px]">
                    {c.kind === "BONUS" ? (
                      CAMPAIGN_REASON_LABELS.BONUS
                    ) : (
                      <>
                        {KIND_LABELS[c.kind]} · <span dir="ltr">{formatRateBps(c.rateBps)}</span> من {fmtMoney(c.basisAmount)}
                      </>
                    )}
                  </p>
                  {c.campaignReason && c.kind !== "BONUS" && (
                    <p className="text-[12px] font-semibold text-foreground/70">{CAMPAIGN_REASON_LABELS[c.campaignReason as CampaignReason]}</p>
                  )}
                  <p className="text-[13px] text-muted-foreground">
                    {fmtDate(c.paymentAt)}
                    {repNames && ` · ${repNames.get(c.salesRepId) ?? "—"}`}
                  </p>
                </div>
                <div className="space-y-0.5 text-end">
                  <p className="text-[17px] font-semibold tabular-nums">{fmtMoney(c.amount + c.adjustments.reduce((s, a) => s + a.amount, 0))}</p>
                  <StatusText tone={COMMISSION_STATUS_META[c.status].tone} className="text-[12px]">
                    {COMMISSION_STATUS_META[c.status].label}
                  </StatusText>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="سجل المدفوعات الموثّقة" subtitle="خصومات الاشتراك من رصيد المتجر ومرتجعات تخفيض الباقة." icon={Receipt}>
        {payments.length === 0 ? (
          <p className="px-5 pb-5 text-[15px] text-muted-foreground">مفيش مدفوعات اشتراك لسه.</p>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            {payments.map((p) => (
              <li key={p.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[15px]">
                    {p.type === "REFUND" ? "مرتجع رصيد" : "خصم اشتراك"} · {fmtDateTime(p.createdAt)}
                  </p>
                  {p.note && <p className="text-[13px] text-muted-foreground">{p.note}</p>}
                  <p dir="ltr" className="text-right font-mono text-[11px] text-muted-foreground">
                    {p.id.slice(0, 8)}
                  </p>
                </div>
                <span className="text-[15px] font-semibold tabular-nums">{fmtMoney(Math.abs(p.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {repNames && (
        <Card title="سجل النسب" icon={History}>
          <ul className="apple-rows pb-2 [--row-inset:20px]">
            <li className="px-5 py-2.5 text-[15px]">
              النسب الأصلي: {repNames.get(attribution.originalSalesRepId) ?? "—"}
              <span className="ms-2 text-[13px] text-muted-foreground">{fmtDateTime(attribution.createdAt)}</span>
            </li>
            {attribution.changes.map((ch) => (
              <li key={ch.id} className="px-5 py-2.5 text-[15px]">
                {ch.fromSalesRepId ? `${repNames.get(ch.fromSalesRepId) ?? "—"} ← ` : ""}
                {repNames.get(ch.toSalesRepId) ?? "—"}
                <span className="ms-2 text-[13px] text-muted-foreground">
                  {repNames.get(ch.actorUserId) ?? "أدمن"} · {fmtDateTime(ch.createdAt)}
                </span>
                <p className="text-[13px] text-muted-foreground">السبب: {ch.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
