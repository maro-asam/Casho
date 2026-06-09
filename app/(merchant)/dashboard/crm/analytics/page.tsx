import { Metadata } from "next";
import { Sparkles } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetCRMAnalyticsAction, GetCRMDashboardStatsAction } from "@/actions/crm/crm-analytics.actions";
import { CRMAnalyticsClient } from "./_components/CRMAnalyticsClient";

export const metadata: Metadata = { title: "تحليلات العملاء — CRM" };

export default async function CRMAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period = (Number(sp?.period ?? 30) as 30 | 60 | 90 | 365) || 30;

  const [analytics, stats] = await Promise.all([
    GetCRMAnalyticsAction(period),
    GetCRMDashboardStatsAction(),
  ]);

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={Sparkles}
        title="تحليلات العملاء"
        description="فهم عمق سلوك عملائك واتجاهات نموهم"
      />
      <CRMAnalyticsClient analytics={analytics} stats={stats} currentPeriod={period} />
    </div>
  );
}
