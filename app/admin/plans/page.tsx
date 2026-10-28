import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Layers, ListChecks } from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";

import { GetPlanSubscriptionsOverviewAction, GetPlansForAdminAction } from "@/actions/admin/admin-plans.actions";
import { Unavailable, PageHeader, StatusText } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_META, fmtMoney, fmtNum } from "../_lib/format";
import { CreatePlanDialog } from "./_components/create-plan-dialog";

export const metadata: Metadata = { title: "الباقات" };

export default async function AdminPlansPage() {
  const [plans, overview] = await Promise.all([GetPlansForAdminAction(), GetPlanSubscriptionsOverviewAction()]);

  const statsByPlan = new Map(
    overview.map(({ plan, byStatus }) => {
      const byState: Partial<Record<SubscriptionStatus, number>> = {};
      let yearly = 0;
      for (const row of byStatus) {
        byState[row.subscriptionStatus] = (byState[row.subscriptionStatus] ?? 0) + row._count._all;
        if (row.billingCycle === "YEARLY" && row.subscriptionStatus === "ACTIVE") yearly += row._count._all;
      }
      return [plan.id, { byState, yearly }];
    }),
  );
  const nextSortOrder = plans.reduce((m, p) => Math.max(m, p.sortOrder), 0) + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الباقات"
        description="الأسعار والمميزات اللي التجار بيشتركوا عليها. أي تعديل بيتسجل في سجل الباقات."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/features">
                <ListChecks className="size-4" />
                الميزات
              </Link>
            </Button>
            <CreatePlanDialog nextSortOrder={nextSortOrder} />
          </>
        }
      />

      {plans.length === 0 ? (
        <div className="apple-card">
          <Unavailable icon={Layers} title="مفيش باقات لسه" description="اعمل أول باقة وبعدين حدّد مميزاتها." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const stats = statsByPlan.get(plan.id);
            const active = stats?.byState.ACTIVE ?? 0;
            const atRisk = (stats?.byState.GRACE_PERIOD ?? 0) + (stats?.byState.PAST_DUE ?? 0);
            return (
              <article key={plan.id} className="apple-card apple-press relative flex flex-col">
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[17px] leading-[22px] font-semibold">
                        <Link href={`/admin/plans/${plan.id}`} className="after:absolute after:inset-0">
                          {plan.name}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        <span className="block text-right">{plan.key}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusText tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "ظاهرة" : "مخفية"}</StatusText>
                      {!plan.pricingConfigured && <StatusText tone="warning">السعر مش مؤكد</StatusText>}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] leading-[34px] font-bold tabular-nums">{fmtMoney(plan.monthlyPrice)}</span>
                    <span className="text-[15px] text-muted-foreground">/ شهر</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {fmtMoney(plan.yearlyPrice)} / سنة
                    {plan.discountPercent ? ` · خصم ${fmtNum(plan.discountPercent)}٪` : ""}
                  </p>
                  {plan.description && <p className="line-clamp-2 text-[15px] leading-[21px] text-muted-foreground">{plan.description}</p>}
                </div>

                <dl className="mx-5 mt-auto grid grid-cols-3 divide-x-[0.5px] divide-x-reverse divide-border border-t-[0.5px] border-border text-center">
                  <div className="p-3">
                    <dt className="text-[12px] text-muted-foreground">{SUBSCRIPTION_META.ACTIVE.label}</dt>
                    <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{fmtNum(active)}</dd>
                  </div>
                  <div className="p-3">
                    <dt className="text-[12px] text-muted-foreground">منهم سنوي</dt>
                    <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{fmtNum(stats?.yearly ?? 0)}</dd>
                  </div>
                  <div className="p-3">
                    <dt className="text-[12px] text-muted-foreground">متعثرين</dt>
                    <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{fmtNum(atRisk)}</dd>
                  </div>
                </dl>
                <div className="mx-5 flex items-center justify-between border-t-[0.5px] border-border py-3 text-[13px] text-muted-foreground">
                  <span>{fmtNum(plan._count.stores)} متجر إجمالًا · ترتيب {fmtNum(plan.sortOrder)}</span>
                  <span className="inline-flex items-center gap-0.5 text-primary">
                    تعديل <ChevronLeft className="size-4" strokeWidth={2.2} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
