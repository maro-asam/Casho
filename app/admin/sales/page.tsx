import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { KpiStrip } from "@/app/admin/_components/admin-ui";
import { CommissionBreakdown, ExpiringCohorts } from "@/components/sales/sales-summary";
import { prisma } from "@/lib/prisma";
import { getCampaignAdmin } from "@/lib/sales/campaign-queries";
import { fmtMoney, fmtNum } from "@/lib/sales/format";
import { getMonthlyTrend, getPayableItems, getSalesSummary, listSalesReps } from "@/lib/sales/queries";
import { RepsCard, TeamFunnelCard, TeamTrendCard } from "./_components/team";

async function listRepsWithPayable() {
  const reps = await listSalesReps();
  const payables = await Promise.all(reps.map((r) => getPayableItems(prisma, r.id)));
  return reps.map((rep, i) => ({ ...rep, payable: payables[i].total }));
}

export default async function AdminSalesPage() {
  await requireAdmin();
  const [summary, reps, campaign, trend] = await Promise.all([
    getSalesSummary({ all: true }),
    listRepsWithPayable(),
    getCampaignAdmin(),
    getMonthlyTrend({ all: true }, 6),
  ]);
  const now = new Date();
  const campaignSeat =
    campaign && campaign.campaign.endsAt > now
      ? { name: campaign.campaign.name, seatsLeft: campaign.campaign.maxMembers - campaign.members.length }
      : null;

  const payable = reps.reduce((s, r) => s + Math.max(0, r.payable), 0);
  const owed = reps.filter((r) => r.payable > 0).length;
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          {
            label: "مستحق للصرف",
            value: fmtMoney(payable),
            hint: owed > 0 ? `لـ ${fmtNum(owed)} ${owed === 1 ? "مندوب" : "مندوبين"} — المعتمد ± التسويات` : "مفيش مستحقات دلوقتي",
            href: "/admin/sales/payouts",
          },
          {
            label: "عمولات الشهر ده",
            value: fmtMoney(current.commissions),
            hint: previous ? `الشهر اللي فات ${fmtMoney(previous.commissions)}` : undefined,
            href: `/admin/sales/commissions?month=${current.month}`,
          },
          {
            label: "عملاء مؤهلين",
            value: fmtNum(summary.eligible),
            hint: `${fmtNum(summary.acquired)} دفعوا من ${fmtNum(summary.signups)} سجّلوا`,
            href: "/admin/sales/customers?state=eligible",
          },
          {
            label: "إيراد اشتراكات العملاء",
            value: fmtMoney(summary.revenue.net),
            hint: "خصم الاشتراك ناقص المرتجع — من أول يوم",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TeamTrendCard trend={trend} className="lg:col-span-2" />
        <TeamFunnelCard summary={summary} />
      </div>

      <RepsCard reps={reps} campaign={campaignSeat} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommissionBreakdown summary={summary} />
        <ExpiringCohorts summary={summary} />
      </div>
    </div>
  );
}
