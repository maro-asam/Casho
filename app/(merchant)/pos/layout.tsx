import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/lib/store/store-guard";
import { hasPermission } from "@/lib/store/permissions";
import { hasFeature, checkLimit, FEATURE_KEYS } from "@/lib/entitlements";
import { UpgradeRequiredCard } from "@/components/entitlements/UpgradeRequiredCard";
import { tdir, tr } from "@/lib/i18n/dashboard";
import DashboardI18nProvider from "@/lib/i18n/dashboard/provider";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("نقطة البيع | كاشو"),
  description: tr("نظام نقطة البيع لإدارة المبيعات المباشرة"),
};
}

export default async function PosLayout({ children }: { children: ReactNode }) {
  const locale = await loadDashboardLocale();
  // Owners and team members (cashiers) alike; branch access is checked per action.
  const ctx = await requireStoreContext({ usePicked: true });
  if (!ctx.isOwner && !hasPermission(ctx.role, "use_pos")) redirect("/dashboard");

  const store = await prisma.store.findUnique({
    where: { id: ctx.storeId },
    select: { id: true, name: true, slug: true },
  });

  if (!store) redirect("/");

  const posEnabled = await hasFeature(store.id, FEATURE_KEYS.POS);

  if (!posEnabled) {
    const { requiredPlan } = await checkLimit(store.id, FEATURE_KEYS.POS);
    return (
      <DashboardI18nProvider locale={locale}>
      <div dir={tdir()} className="flex h-screen items-center justify-center bg-background p-6 text-foreground">
        <UpgradeRequiredCard
          title={tr("نقطة البيع (POS)")}
          description={tr("نظام نقطة البيع غير متاح في باقتك الحالية.")}
          requiredPlanSlug={requiredPlan}
          className="max-w-md"
        />
      </div>
      </DashboardI18nProvider>
    );
  }

  return (
    <DashboardI18nProvider locale={locale}>
      <div dir={tdir()} className="h-screen overflow-hidden bg-background text-foreground">
        {children}
      </div>
    </DashboardI18nProvider>
  );
}
