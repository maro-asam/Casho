import { ReactNode } from "react";
import { Metadata } from "next";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { requireVerifiedEmail } from "@/lib/auth/email-verification";
import { tr } from "@/lib/i18n/dashboard";
import DashboardI18nProvider from "@/lib/i18n/dashboard/provider";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("محرر المتجر المرئي"),
};
}

export default async function BuilderLayout({ children }: { children: ReactNode }) {
  const locale = await loadDashboardLocale();
  await requireVerifiedEmail(await requireUserId());
  return (
    <DashboardI18nProvider locale={locale}>
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
    </DashboardI18nProvider>
  );
}
