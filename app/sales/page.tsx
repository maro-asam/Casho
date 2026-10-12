import { PageHeader } from "@/components/saas-page";
import { ReferralLinkBox } from "@/components/sales/copy-button";
import { CommissionBreakdown, ExpiringCohorts, Panel, SalesKpis, TierPanel } from "@/components/sales/sales-summary";
import { buildReferralLink } from "@/lib/sales/attribution";
import { fmtNum, fmtPct } from "@/lib/sales/format";
import { requireSalesRep } from "@/lib/sales/guard";
import { getSalesSummary } from "@/lib/sales/queries";

export default async function SalesOverviewPage() {
  const rep = await requireSalesRep();
  const summary = await getSalesSummary({ salesRepId: rep.salesRepId });

  return (
    <div className="space-y-6">
      <PageHeader title={`أهلًا ${rep.name ?? ""}`.trim()} description="أرقامك من أول يوم — بتتحدث مع كل دفعة اشتراك من عملائك." />

      <Panel
        title="رابط الإحالة بتاعك"
        description={`أي تاجر يسجل من الرابط ده بيتنسب ليك. ${fmtNum(summary.signups)} تسجيل لحد دلوقتي، دفع منهم ${fmtNum(summary.acquired)} (${fmtPct(summary.conversionRate)}).`}
      >
        <ReferralLinkBox link={buildReferralLink(rep.referralCode)} code={rep.referralCode} />
      </Panel>

      <SalesKpis summary={summary} scope="rep" />

      <div className="grid gap-6 lg:grid-cols-2">
        <TierPanel summary={summary} />
        <ExpiringCohorts summary={summary} />
      </div>

      <CommissionBreakdown summary={summary} />
    </div>
  );
}
