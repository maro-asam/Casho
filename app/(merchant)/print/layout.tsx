import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { tdir } from "@/lib/i18n/dashboard";
import DashboardI18nProvider from "@/lib/i18n/dashboard/provider";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Printable documents (invoices…): no dashboard chrome, always light, paper-sized.
export default async function PrintLayout({ children }: { children: ReactNode }) {
  const locale = await loadDashboardLocale();
  await requireUserId();

  return (
    <DashboardI18nProvider locale={locale}>
    <div dir={tdir()} className="min-h-screen bg-neutral-100 py-8 text-neutral-900 print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { html, body { background: #fff !important; } }
      `}</style>
      {children}
    </div>
    </DashboardI18nProvider>
  );
}
