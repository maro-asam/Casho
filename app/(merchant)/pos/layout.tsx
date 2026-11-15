import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ScanBarcode } from "lucide-react";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/lib/store/store-guard";
import { requireVerifiedEmail } from "@/lib/auth/email-verification";
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
  await requireVerifiedEmail(ctx.userId);
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
        <div dir={tdir()} className="apple-ui apple-auto flex min-h-dvh flex-col bg-background text-foreground">
          <header className="flex items-center px-4 pt-4 sm:px-6">
            <Link
              href="/"
              className="apple-press inline-flex h-9 items-center gap-1 rounded-full px-2 text-[15px] text-primary hover:bg-primary/8"
            >
              <ChevronRight className="size-5 ltr:rotate-180" strokeWidth={2} />
              {tr("رجوع للوحة التحكم")}
            </Link>
          </header>
          <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
            <UpgradeRequiredCard
              icon={ScanBarcode}
              title={tr("نظام نقطة البيع")}
              description={tr("شغّل أي لابتوب أو تابلت ككاشير لمحلك، وكل بيعة بتتسجل طلب في متجرك.")}
              highlights={[
                tr("بيع في المحل بالباركود، بنفس منتجات متجرك ومخزون كل فرع."),
                tr("كاش وكارت وانستاباي، وتقسيم الدفع على أكتر من طريقة"),
                tr("ورديات وتسوية للدرج النقدي في آخر اليوم"),
                tr("مرتجعات واستبدال، وفاتورة تتطبع أو تتبعت واتساب"),
              ]}
              requiredPlanSlug={requiredPlan}
              canUpgrade={ctx.isOwner}
            />
          </main>
        </div>
      </DashboardI18nProvider>
    );
  }

  return (
    <DashboardI18nProvider locale={locale}>
      {/* Apple tokens + auto-styling, like the dashboard shell (the POS is full-screen, outside it). */}
      <div dir={tdir()} className="apple-ui apple-auto apple-form h-screen overflow-hidden bg-background text-foreground">
        {children}
      </div>
    </DashboardI18nProvider>
  );
}
