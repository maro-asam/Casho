import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, ExternalLink, XCircle } from "lucide-react";

import { GetPaymentMethodsSettingsAction } from "@/actions/payment-methods/payment-methods.actions";
import { PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
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

const TEST_RESULT = {
  ok: {
    icon: CheckCircle2,
    tone: "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
    get text() { return tr("الربط مع Kashier سليم — العملية التجريبية رجعت وإمضاؤها صحيح. حوّل للايف لما تكون جاهز."); },
  },
  declined: {
    icon: AlertTriangle,
    tone: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
    get text() { return tr("الربط سليم، بس العملية التجريبية اترفضت أو اتلغت. ده طبيعي لو قفلت الصفحة أو استخدمت كارت تجربة مرفوض."); },
  },
  invalid: {
    icon: XCircle,
    tone: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300",
    get text() { return tr("مقدرناش نتأكد من رد Kashier — غالبًا الـ API Key مش بتاع نفس الـ Merchant ID. انسخهم تاني من لوحة Kashier."); },
  },
} as const;

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export default async function PaymentMethodsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const params = await searchParams;
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

  const testParam = readParam(params, "kashier_test");
  const test = testParam && testParam in TEST_RESULT ? TEST_RESULT[testParam as keyof typeof TEST_RESULT] : null;

  return (
    <div className="space-y-8" dir={tdir()}>
      <PageHeader
        title={tr("بوابات الدفع")}
        description={tr("اختار إزاي عملاءك يدفعوا ورتّب ظهورهم — أي تغيير بيوصل صفحة الدفع في متجرك على طول.")}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={buildStoreUrl(settings.storeSlug, "/products")} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {tr("افتح متجرك")}
            </a>
          </Button>
        }
      />

      {test && (
        <div role="status" className={cn("flex items-start gap-2.5 rounded-xl border p-4 text-sm leading-6", test.tone)}>
          <test.icon className="mt-0.5 size-4 shrink-0" />
          {test.text}
        </div>
      )}

      <PaymentsStudio initial={settings} />

      <MethodPerformance stats={[...byMethod.values()]} periodDays={PERIOD_DAYS} />
    </div>
  );
}
