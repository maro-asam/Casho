import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Store, XCircle } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Unavailable, appleButton, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getBillingPeriodDays } from "@/lib/subscriptions";
import { getPlatformPaymobCredentials } from "@/lib/paymob";
import { TopupStudio } from "../_components/topup-studio";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("شحن الرصيد"),
};
}

type TopupRouteProps = { searchParams?: Promise<SearchParamsRecord> };

export default async function TopupRoute({ searchParams }: TopupRouteProps) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, balance: true, monthlyPrice: true, billingCycle: true, subscriptionEndsAt: true },
  });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اشحن رصيده.")} />
      </div>
    );
  }

  const requested = Number(readParam(params, "amount"));
  const failed = readParam(params, "topup");

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        eyebrow={
          <Link href="/balance" className={cn(appleButton.plain, "-ms-1 h-8 gap-0.5 px-1")}>
            <ChevronRight className="size-[18px] ltr:-scale-x-100" strokeWidth={2.4} />
            {tr("الرصيد")}
          </Link>
        }
        title={tr("شحن الرصيد")}
        subtitle={tr("الرصيد بيتخصم منه الاشتراك تلقائي في ميعاده.")}
      />
      {(failed === "failed" || failed === "invalid") && (
        <div className="apple-card flex items-center gap-3 px-5 py-4 text-[15px]" role="status">
          <XCircle className="size-6 shrink-0 text-(--sys-red)" />
          {failed === "failed" ? tr("الدفع ما تمش ومفيش أي مبلغ اتخصم. جرّب تاني أو استخدم تحويل يدوي.") : tr("مقدرناش نتأكد من عملية الدفع. لو المبلغ اتخصم كلّمنا من الدعم.")}
        </div>
      )}
      <TopupStudio
        storeId={store.id}
        balance={store.balance}
        price={store.monthlyPrice}
        periodDays={getBillingPeriodDays(store.billingCycle)}
        cycleWord={store.billingCycle === "YEARLY" ? tr("سنة") : tr("شهر")}
        nextRenewal={store.subscriptionEndsAt?.toISOString() ?? null}
        initialAmount={Number.isFinite(requested) && requested > 0 ? Math.ceil(requested) : null}
        onlineAvailable={getPlatformPaymobCredentials() !== null}
      />
    </div>
  );
}
