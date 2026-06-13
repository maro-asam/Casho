import { Metadata } from "next";
import { GetReferralStatsAction } from "@/actions/referral/referral.actions";
import { ReferralPageClient } from "./_components/ReferralPageClient";

export const metadata: Metadata = {
  title: "نظام المكافأت",
};

export default async function ReferralPage() {
  const stats = await GetReferralStatsAction();

  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://casho.store";

  const baseUrl = appUrl.replace(/\/$/, "");
  const referralLink = `${baseUrl}/register?ref=${stats.referralCode}`;

  return (
    <ReferralPageClient
      referralCode={stats.referralCode}
      referralLink={referralLink}
      totalEarnedPiasters={stats.totalEarnedPiasters}
      successfulReferrals={stats.successfulReferrals}
      referrals={stats.referrals}
      referralSuccessfulPayments={stats.referralSuccessfulPayments}
      freeMonthsEarned={stats.freeMonthsEarned}
      referralLevel={stats.referralLevel}
      nextLevelThreshold={stats.nextLevelThreshold}
      currentLevelThreshold={stats.currentLevelThreshold}
      freeMonthProgress={stats.freeMonthProgress}
    />
  );
}
