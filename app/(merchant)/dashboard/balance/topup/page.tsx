import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { EmptyState, PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getBillingPeriodDays } from "@/lib/subscriptions";
import { TopupStudio } from "../_components/topup-studio";

export const metadata: Metadata = {
  title: "شحن الرصيد",
};

type TopupRouteProps = { searchParams?: Promise<SearchParamsRecord> };

export default async function TopupRoute({ searchParams }: TopupRouteProps) {
  const userId = await requireUserId();
  const params = await searchParams;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, balance: true, monthlyPrice: true, billingCycle: true, subscriptionEndsAt: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول وبعدها اشحن رصيده."
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const requested = Number(readParam(params, "amount"));
  const failed = readParam(params, "topup");

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="شحن الرصيد"
        description="الرصيد بيتخصم منه الاشتراك تلقائي في ميعاده."
        actions={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/balance">
              <ArrowRight className="size-4" />
              الرصيد
            </Link>
          </Button>
        }
      />
      {(failed === "failed" || failed === "invalid") && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-800 dark:text-rose-300" role="status">
          {failed === "failed" ? "الدفع ما تمش ومفيش أي مبلغ اتخصم. جرّب تاني أو استخدم تحويل يدوي." : "مقدرناش نتأكد من عملية الدفع. لو المبلغ اتخصم كلّمنا من الدعم."}
        </p>
      )}
      <TopupStudio
        storeId={store.id}
        balance={store.balance}
        price={store.monthlyPrice}
        periodDays={getBillingPeriodDays(store.billingCycle)}
        cycleWord={store.billingCycle === "YEARLY" ? "سنة" : "شهر"}
        nextRenewal={store.subscriptionEndsAt?.toISOString() ?? null}
        initialAmount={Number.isFinite(requested) && requested > 0 ? Math.ceil(requested) : null}
      />
    </div>
  );
}
