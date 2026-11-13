import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Banknote, ChevronLeft, KeyRound, Link2 } from "lucide-react";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { BackLink, KpiStrip } from "@/app/admin/_components/admin-ui";
import { Card, StatusText, appleButton } from "@/components/saas-page";
import { LinkField, ReferralLinkBox } from "@/components/sales/copy-button";
import { CommissionsTable } from "@/components/sales/commissions-table";
import { CustomersTable } from "@/components/sales/customers-table";
import { AuditRows, CardEmpty, CommissionBreakdown, ExpiringCohorts, Monogram, TierLadder } from "@/components/sales/sales-summary";
import { TIER, TierTag } from "@/components/sales/tier";
import { prisma } from "@/lib/prisma";
import { buildReferralLink, buildSalesLoginLink } from "@/lib/sales/attribution";
import { fmtDate, fmtMoney, fmtNum, fmtPct } from "@/lib/sales/format";
import { formatRateBps } from "@/lib/sales/rules";
import {
  getRepMonthlyTrend,
  getSalesSummary,
  listAttributedCustomers,
  listCommissions,
  listPayouts,
  listRepAdjustments,
  listSalesAuditLog,
} from "@/lib/sales/queries";
import { canCancelRepAdjustment } from "@/lib/sales/workflow";
import { RepAdjustmentRows } from "@/components/sales/rep-adjustments";
import { cn } from "@/lib/utils";
import { AUDIT_LABELS } from "../../_components/audit-labels";
import {
  CancelRepAdjustmentButton,
  CommissionActions,
  EditRepDialog,
  RecordPayoutDialog,
  RepAdjustmentDialog,
  RepStatusDialog,
} from "../../_components/sales-dialogs";
import { TeamTrendCard } from "../../_components/team";

/** Card header action: "See All" in the tint, chevron trailing. */
function SeeAll({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={appleButton.plain}>
      {children}
      <ChevronLeft className="size-4" strokeWidth={2.2} />
    </Link>
  );
}

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
  const [summary, trend, customers, commissions, payouts, adjustments, audit] = await Promise.all([
    getSalesSummary(scope),
    getRepMonthlyTrend(rep.id, 6),
    listAttributedCustomers(scope, { page: 1 }),
    listCommissions(scope, { page: 1 }),
    listPayouts(scope, 10),
    listRepAdjustments(scope, 30),
    listSalesAuditLog({ salesRepId: rep.id }, 20),
  ]);
  const repName = rep.user.name ?? rep.user.email;
  const active = rep.status === "ACTIVE";
  const c = summary.commissions;
  const earned = c.acquisitionEarned + c.renewalEarned + c.bonusEarned;
  const payable = summary.payable ?? 0;
  const loginLink = buildSalesLoginLink();
  const ra = summary.repAdjustments;
  const adjustmentsSubtitle =
    ra.bonusCount || ra.deductionCount
      ? `مكافآت ${fmtMoney(ra.bonuses)} · خصومات ${fmtMoney(Math.abs(ra.deductions))} — من أول يوم، من غير الملغي`
      : "مبلغ ثابت تضيفه أو تخصمه من حسابه — بيدخل في الصرف الجاي";

  return (
    <div className="space-y-6">
      <BackLink href="/admin/sales">الفريق</BackLink>

      {/* Hero: who the rep is, where they stand, and the two account actions. */}
      <section aria-labelledby="rep-name" className="apple-card relative isolate -mt-3 overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className={cn("pointer-events-none absolute -top-28 -start-20 -z-10 size-80 rounded-full bg-(--tier)/12 blur-3xl", TIER[summary.level].color)}
        />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Monogram name={repName} muted={!active} size="lg" />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 id="rep-name" className="truncate text-[28px] leading-[34px] font-bold">
                  {repName}
                </h2>
                <StatusText tone={active ? "success" : "danger"}>{active ? "نشط" : "موقوف"}</StatusText>
              </div>
              <p className="text-[15px] text-muted-foreground">
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
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <TierTag tier={summary.level} />
                <span className="inline-flex h-7 items-center rounded-full bg-(--fill-3) px-3 text-[13px] text-foreground/80 tabular-nums">
                  {fmtNum(summary.eligible)} عميل مؤهل
                </span>
              </div>
              {rep.notes && <p className="max-w-2xl pt-1 text-[15px] leading-[22px] text-foreground/85">{rep.notes}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <EditRepDialog rep={{ id: rep.id, name: rep.user.name, email: rep.user.email, phone: rep.user.phone_number, notes: rep.notes }} />
            <RepStatusDialog salesRepId={rep.id} status={rep.status} />
          </div>
        </div>
      </section>

      {/* The two links an admin hands out: one to the rep, one the rep hands to merchants. */}
      <section aria-label="الدخول والإحالة" className="apple-card grid grid-cols-1 overflow-hidden md:grid-cols-2">
        <div className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-(--sys-gray) text-white">
              <KeyRound className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold">دخول المندوب — ابعتهوله هو</h3>
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                يسجّل بالبريد <span dir="ltr" className="font-mono text-foreground/85">{rep.user.email}</span> وكلمة المرور المؤقتة، ويتحوّل على لوحة
                المبيعات. مش محتاج متجر.
              </p>
            </div>
          </div>
          <LinkField link={loginLink} />
        </div>
        <div className="space-y-3 border-t-[0.5px] border-border p-5 md:border-s-[0.5px] md:border-t-0">
          <div className="flex items-start gap-3">
            <span className="grid size-[29px] shrink-0 place-items-center rounded-[7px] bg-primary text-white">
              <Link2 className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold">رابط الإحالة — للتجار</h3>
              <p className="text-[13px] leading-[18px] text-muted-foreground">فورم إنشاء متجر. المندوب بيبعته للتجار، وأي حد يسجل منه بيتنسب له.</p>
            </div>
          </div>
          {rep.user.referralCode ? (
            <ReferralLinkBox link={buildReferralLink(rep.user.referralCode)} code={rep.user.referralCode} />
          ) : (
            <p className="text-[13px] text-muted-foreground">الحساب ده مالوش كود إحالة.</p>
          )}
        </div>
      </section>

      <KpiStrip
        items={[
          { label: "مستحق للصرف", value: fmtMoney(payable), hint: `اتصرف له ${fmtMoney(summary.payouts.total)} على ${fmtNum(summary.payouts.count)} تحويل` },
          {
            label: "العمولات من أول يوم",
            value: fmtMoney(earned),
            hint: `اكتساب ${fmtMoney(c.acquisitionEarned)} · تجديد ${fmtMoney(c.renewalEarned)}${c.bonusEarned ? ` · بونص ${fmtMoney(c.bonusEarned)}` : ""}`,
            href: `/admin/sales/commissions?rep=${rep.id}`,
          },
          {
            label: "عملاء مؤهلين",
            value: fmtNum(summary.eligible),
            hint: `${fmtNum(summary.acquired)} دفعوا · ${fmtNum(summary.expired)} خلصت أهليتهم`,
            href: `/admin/sales/customers?rep=${rep.id}&state=eligible`,
          },
          { label: "نسبة التحويل", value: fmtPct(summary.conversionRate), hint: `${fmtNum(summary.acquired)} دفعوا من ${fmtNum(summary.signups)} سجّلوا` },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <TeamTrendCard trend={trend} title="عمولاته" className="lg:col-span-3" />
        <TierLadder
          rule={summary.rule}
          allocation={summary.allocation}
          current={summary.nextAcquisition.tier}
          subtitle={`عميله الجاي بـ ${formatRateBps(summary.nextAcquisition.rateBps)} — العمولات اللي اتسجلت قبل كده مبتتغيرش`}
          className="lg:col-span-2"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <CommissionBreakdown summary={summary} />
        <ExpiringCohorts summary={summary} />
      </div>

      <Card
        title="الصرف"
        subtitle={
          payable > 0
            ? `مستحق دلوقتي ${fmtMoney(payable)} — المعتمد اللي لسه متصرفش ± التسويات والمكافآت والخصومات`
            : payable < 0
              ? `عليه ${fmtMoney(-payable)} خصومات أكبر من المستحق — هتتخصم من عمولاته الجاية`
              : "مفيش مستحقات دلوقتي"
        }
        action={<RecordPayoutDialog salesRepId={rep.id} repName={repName} payable={payable} />}
      >
        {payouts.length === 0 ? (
          <CardEmpty>مفيش صرف متسجل.</CardEmpty>
        ) : (
          <ul className="apple-rows pb-2 [--row-inset:72px]">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-(--sys-green)/14 text-[#248a3d] dark:text-(--sys-green)">
                  <Banknote className="size-[18px]" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">
                    {fmtDate(p.paidAt)} · {p.method}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {fmtNum(p._count.commissions)} عمولة{p._count.adjustments ? ` · ${fmtNum(p._count.adjustments)} تسوية` : ""}
                    {p._count.repAdjustments ? ` · ${fmtNum(p._count.repAdjustments)} مكافأة/خصم` : ""}
                    {p.reference && (
                      <>
                        {" · "}
                        <span dir="ltr" className="font-mono text-[12px]">
                          {p.reference}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-[17px] font-bold tabular-nums">{fmtMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="المكافآت والخصومات"
        subtitle={adjustmentsSubtitle}
        action={
          <div className="flex shrink-0 gap-2">
            <RepAdjustmentDialog salesRepId={rep.id} repName={repName} kind="BONUS" />
            <RepAdjustmentDialog salesRepId={rep.id} repName={repName} kind="DEDUCTION" />
          </div>
        }
      >
        <RepAdjustmentRows
          rows={adjustments}
          empty="مفيش مكافآت أو خصومات لسه."
          action={(row) => (canCancelRepAdjustment({ canceledAt: row.canceledAt, payoutId: row.payout?.id ?? null }) ? <CancelRepAdjustmentButton adjustmentId={row.id} kind={row.kind} /> : null)}
        />
      </Card>

      <Card
        title="أحدث العملاء"
        subtitle={`${fmtNum(customers.total)} عميل منسوب`}
        action={customers.total > 0 && <SeeAll href={`/admin/sales/customers?rep=${rep.id}`}>الكل</SeeAll>}
      >
        {customers.rows.length ? (
          <CustomersTable rows={customers.rows} detailBase="/admin/sales/customers" className="pb-2" />
        ) : (
          <CardEmpty>مفيش عملاء لسه — أول ما تاجر يسجل من رابطه هيظهر هنا.</CardEmpty>
        )}
      </Card>

      <Card
        title="أحدث العمولات"
        subtitle={`${fmtNum(commissions.total)} عمولة`}
        action={commissions.total > 0 && <SeeAll href={`/admin/sales/commissions?rep=${rep.id}`}>الكل</SeeAll>}
      >
        {commissions.rows.length ? (
          <div className="pb-2">
            <CommissionsTable
              rows={commissions.rows}
              actions={(row) => (
                <CommissionActions commissionId={row.id} status={row.status} net={row.amount + row.adjustments.reduce((s, a) => s + a.amount, 0)} />
              )}
            />
          </div>
        ) : (
          <CardEmpty>مفيش عمولات لسه — بتتسجل تلقائيًا مع أول دفعة اشتراك لعميل منسوب له.</CardEmpty>
        )}
      </Card>

      <Card title="سجل الإجراءات" subtitle="آخر ٢٠ إجراء على المندوب ده.">
        <AuditRows logs={audit} labels={AUDIT_LABELS} />
      </Card>
    </div>
  );
}
