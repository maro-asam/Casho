import { buildReferralLink } from "@/lib/sales/attribution";
import { requireSalesRep } from "@/lib/sales/guard";
import { isWithinCampaign } from "@/lib/sales/campaign";
import { getRepCampaign, listActiveAnnouncements } from "@/lib/sales/campaign-queries";
import { getRepMonthlyTrend, getSalesSummary, listFollowUps } from "@/lib/sales/queries";
import { AnnouncementsBoard } from "./_components/announcements-board";
import { CampaignCard } from "./_components/campaign-card";
import { EarningsCard, FollowUpsCard, FunnelCard, LevelCard, RepHero, TrendCard } from "./_components/overview";
import { ReferralCard } from "./_components/referral-card";

export default async function SalesOverviewPage() {
  const rep = await requireSalesRep();
  const name = rep.name?.trim() || rep.email.split("@")[0];
  const now = new Date();
  const [summary, trend, followUps, campaign, announcements] = await Promise.all([
    getSalesSummary({ salesRepId: rep.salesRepId }),
    getRepMonthlyTrend(rep.salesRepId, 6),
    listFollowUps(rep.salesRepId, 5),
    getRepCampaign(rep.salesRepId, now),
    listActiveAnnouncements(now),
  ]);
  const promo = campaign && isWithinCampaign(campaign, now) ? { rateBps: campaign.baseRateBps, name: campaign.name } : null;

  return (
    <div className="space-y-4 md:space-y-5">
      <RepHero name={name} summary={summary} trend={trend} />

      <AnnouncementsBoard items={announcements} />

      {campaign && <CampaignCard campaign={campaign} renewalRateBps={summary.rule.renewalRateBps} now={now} />}

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <ReferralCard link={buildReferralLink(rep.referralCode)} code={rep.referralCode} repName={name} />
        <EarningsCard summary={summary} />
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <LevelCard summary={summary} promo={promo} />
        <TrendCard trend={trend} />
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <FunnelCard summary={summary} />
        <FollowUpsCard rows={followUps.rows} total={followUps.total} repName={name} />
      </div>
    </div>
  );
}
