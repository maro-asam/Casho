import { Metadata } from "next";
import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./_components/OnboardingWizard";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("إعداد المتجر | كاشو"),
  robots: { index: false, follow: false },
};
}

export default async function OnboardingPage() {
  await loadDashboardLocale();
  const user = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      businessCategory: true,
      trialEndDate: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <OnboardingWizard
      storeName={store?.name ?? ""}
      businessCategory={store?.businessCategory ?? ""}
      trialEndDate={store?.trialEndDate?.toISOString() ?? null}
    />
  );
}
