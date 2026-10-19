import { Metadata } from "next";
import { Sparkles } from "lucide-react";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import { GetCRMAnalyticsAction, GetCRMDashboardStatsAction } from "@/actions/crm/crm-analytics.actions";
import { CRMAnalyticsClient } from "./_components/CRMAnalyticsClient";
import { isEntitlementError } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("تحليلات العملاء — CRM") };
}

export default async function CRMAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  await loadDashboardLocale();
  const sp = await searchParams;
  const period = (Number(sp?.period ?? 30) as 30 | 60 | 90 | 365) || 30;

  let analytics: Awaited<ReturnType<typeof GetCRMAnalyticsAction>>;
  let stats: Awaited<ReturnType<typeof GetCRMDashboardStatsAction>>;

  try {
    [analytics, stats] = await Promise.all([
      GetCRMAnalyticsAction(period),
      GetCRMDashboardStatsAction(),
    ]);
  } catch (error) {
    if (isEntitlementError(error)) {
      return (
        <div className="space-y-6" dir={tdir()}>
          <DashboardSectionHeader icon={Sparkles} title={tr("تحليلات العملاء")} description={tr("فهم عمق سلوك عملائك واتجاهات نموهم")} />
          <UpgradeRequiredCard
            title={tr("تحليلات متقدمة")}
            description={tr("التحليلات المتقدمة غير متاحة في باقتك الحالية.")}
            requiredPlanSlug={error.requiredPlan}
          />
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6" dir={tdir()}>
      <DashboardSectionHeader
        icon={Sparkles}
        title={tr("تحليلات العملاء")}
        description={tr("فهم عمق سلوك عملائك واتجاهات نموهم")}
      />
      <CRMAnalyticsClient analytics={analytics} stats={stats} currentPeriod={period} />
    </div>
  );
}
