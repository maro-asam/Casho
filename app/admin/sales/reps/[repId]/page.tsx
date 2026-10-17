import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { StatusPill } from "@/components/saas-page";
import { CopyButton, ReferralLinkBox } from "@/components/sales/copy-button";
import { CommissionsTable } from "@/components/sales/commissions-table";
import { CustomersTable } from "@/components/sales/customers-table";
import { CommissionBreakdown, ExpiringCohorts, Panel, SalesKpis, TierPanel } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { buildReferralLink, buildSalesLoginLink } from "@/lib/sales/attribution";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/sales/format";
import { getSalesSummary, listAttributedCustomers, listCommissions, listPayouts, listSalesAuditLog } from "@/lib/sales/queries";
import { CommissionActions, EditRepDialog, RecordPayoutDialog, RepStatusDialog } from "../../_components/sales-dialogs";
import { AUDIT_LABELS } from "../../_components/audit-labels";

export default async function AdminSalesRepPage({ params }: { params: Promise<{ repId: string }> }) {
  await requireAdmin();
  const { repId } = await params;

  const rep = await prisma.salesRep.findUnique({
    where: { id: repId },
    select: {
      id: true,
      status: true,
      notes: true,
      createdAt: true,
      disabledAt: true,
      user: { select: { name: true, email: true, phone_number: true, referralCode: true } },
    },
  });
  if (!rep) notFound();

  const scope = { salesRepId: rep.id };
  const [summary, customers, commissions, payouts, audit] = await Promise.all([
    getSalesSummary(scope),
    listAttributedCustomers(scope, { page: 1 }),
    listCommissions(scope, { page: 1 }),
    listPayouts(scope, 10),
    listSalesAuditLog({ salesRepId: rep.id }, 20),
  ]);
  const repName = rep.user.name ?? rep.user.email;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{repName}</h2>
            <StatusPill tone={rep.status === "ACTIVE" ? "success" : "danger"}>{rep.status === "ACTIVE" ? "نشط" : "موقوف"}</StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">
            <span dir="ltr">{rep.user.email}</span>
            {rep.user.phone_number && (
              <>
                {" · "}
                <span dir="ltr">{rep.user.phone_number}</span>
              </>
            )}
            {" · "}انضم {fmtDate(rep.createdAt)}
            {rep.disabledAt && ` · اتوقف ${fmtDate(rep.disabledAt)}`}
          </p>
          {rep.notes && <p className="text-sm">{rep.notes}</p>}
          <div className="grid max-w-3xl gap-4 pt-3 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">دخول المندوب — ابعتهوله هو</p>
              <p className="text-xs text-muted-foreground">
                يسجّل دخول بالبريد ده وكلمة المرور المؤقتة اللي عملتها، وهيتحوّل على لوحة المبيعات. مش محتاج يعمل متجر.
              </p>
              <div className="flex items-center gap-2">
                <code dir="ltr" className="min-w-0 flex-1 truncate rounded-md bg-muted/40 px-2 py-1.5 text-left font-mono text-xs">
                  {buildSalesLoginLink()}
                </code>
                <CopyButton value={buildSalesLoginLink()} label="نسخ" />
              </div>
              <p className="text-xs">
                البريد:{" "}
                <span dir="ltr" className="font-mono">
                  {rep.user.email}
                </span>
              </p>
            </div>
            {rep.user.referralCode && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">رابط الإحالة — للتجار مش للمندوب</p>
                <p className="text-xs text-muted-foreground">ده فورم إنشاء متجر. المندوب بيبعته للتجار، وأي حد يسجل منه بيتنسب له.</p>
                <ReferralLinkBox link={buildReferralLink(rep.user.referralCode)} code={rep.user.referralCode} />
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <EditRepDialog rep={{ id: rep.id, name: rep.user.name, phone: rep.user.phone_number, notes: rep.notes }} />
          <RepStatusDialog salesRepId={rep.id} status={rep.status} />
        </div>
      </section>

      <SalesKpis summary={summary} scope="rep" />

      <div className="grid gap-6 lg:grid-cols-2">
        <TierPanel summary={summary} />
        <ExpiringCohorts summary={summary} />
      </div>

      <CommissionBreakdown summary={summary} />

      <Panel
        title="الصرف"
        description={`مستحق الآن ${fmtMoney(summary.payable ?? 0)} — العمولات المعتمدة غير المدفوعة ± التسويات.`}
        actions={<RecordPayoutDialog salesRepId={rep.id} repName={repName} payable={summary.payable ?? 0} />}
      >
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش صرف متسجل.</p>
        ) : (
          <ul className="divide-y text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {fmtDate(p.paidAt)} · {p.method}
                  {p.reference && (
                    <span dir="ltr" className="ms-2 font-mono text-xs text-muted-foreground">
                      {p.reference}
                    </span>
                  )}
                </span>
                <span className="font-medium tabular-nums">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="أحدث العملاء"
        description={`${customers.total} عميل منسوب`}
        actions={
          <Link href={`/admin/sales/customers?rep=${rep.id}`} className="text-sm text-primary hover:underline">
            كل العملاء
          </Link>
        }
        flush
      >
        {customers.rows.length ? (
          <CustomersTable rows={customers.rows} detailBase="/admin/sales/customers" />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">مفيش عملاء منسوبين لسه.</p>
        )}
      </Panel>

      <Panel
        title="أحدث العمولات"
        description={`${commissions.total} عمولة`}
        actions={
          <Link href={`/admin/sales/commissions?rep=${rep.id}`} className="text-sm text-primary hover:underline">
            كل العمولات
          </Link>
        }
        flush
      >
        {commissions.rows.length ? (
          <CommissionsTable
            rows={commissions.rows}
            actions={(row) => (
              <CommissionActions commissionId={row.id} status={row.status} net={row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0)} />
            )}
          />
        ) : (
          <p className="p-4 text-sm text-muted-foreground">مفيش عمولات لسه.</p>
        )}
      </Panel>

      <Panel title="سجل الإجراءات">
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش إجراءات.</p>
        ) : (
          <ul className="divide-y text-sm">
            {audit.map((log) => (
              <li key={log.id} className="py-2">
                <p>
                  {AUDIT_LABELS[log.action] ?? log.action}
                  <span className="ms-2 text-xs text-muted-foreground">
                    {log.actor ? log.actor.name ?? log.actor.email : "النظام"} · {fmtDateTime(log.createdAt)}
                  </span>
                </p>
                {log.reason && <p className="text-xs text-muted-foreground">السبب: {log.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
