import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { GetPaymentMethodsSettingsAction } from "@/actions/payment-methods/payment-methods.actions";
import { LargeTitle, appleButton } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { MethodPerformance, type MethodStat } from "./_components/method-performance";
import { PaymentsStudio } from "./_components/payments-studio";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("بوابات الدفع"),
};
}

const PERIOD_DAYS = 90;

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export default async function PaymentMethodsPage() {
  await loadDashboardLocale();
  const settings = await GetPaymentMethodsSettingsAction();

  const grouped = await prisma.order.groupBy({
    by: ["paymentMethod", "status"],
    where: { storeId: settings.storeId, createdAt: { gte: daysAgo(PERIOD_DAYS) } },
    _count: { _all: true },
    _sum: { total: true },
  });

  const byMethod = new Map<string, MethodStat>();
  for (const g of grouped) {
    const s = byMethod.get(g.paymentMethod) ?? { key: g.paymentMethod, orders: 0, revenue: 0, canceled: 0 };
    s.orders += g._count._all;
    if (g.status === "CANCELED") s.canceled += g._count._all;
    else s.revenue += g._sum.total ?? 0;
    byMethod.set(g.paymentMethod, s);
  }

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("بوابات الدفع")}
        subtitle={tr("اختار إزاي عملاءك يدفعوا ورتّب ظهورهم — أي تغيير بيوصل صفحة الدفع في متجرك على طول.")}
        actions={
          <a href={buildStoreUrl(settings.storeSlug, "/products")} target="_blank" rel="noreferrer" className={appleButton.gray}>
            <ExternalLink className="size-4" />
            {tr("افتح متجرك")}
          </a>
        }
      />

      <PaymentsStudio initial={settings} />

      <div className="xl:me-[calc(23rem+1.5rem)]">
        <MethodPerformance stats={[...byMethod.values()]} periodDays={PERIOD_DAYS} />
      </div>
    </div>
  );
}
