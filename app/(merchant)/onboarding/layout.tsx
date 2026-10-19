import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import DashboardI18nProvider from "@/lib/i18n/dashboard/provider";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await loadDashboardLocale();
  const user = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId: user.id },
    select: { onboardingCompleted: true, planSelected: true },
    orderBy: { createdAt: "asc" },
  });

  // If onboarding was already completed (either flag), send to dashboard
  if (store?.onboardingCompleted || store?.planSelected) {
    redirect("/dashboard");
  }

  return <DashboardI18nProvider locale={locale}>{children}</DashboardI18nProvider>;
}
