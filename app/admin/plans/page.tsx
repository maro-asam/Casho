import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers, ListChecks } from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";

import { GetPlanSubscriptionsOverviewAction, GetPlansForAdminAction } from "@/actions/admin/admin-plans.actions";
import { EmptyState, PageHeader, StatusPill } from "@/components/saas-page";
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
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={Layers} title="مفيش باقات لسه" description="اعمل أول باقة وبعدين حدّد مميزاتها." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const stats = statsByPlan.get(plan.id);
            const active = stats?.byState.ACTIVE ?? 0;
            const atRisk = (stats?.byState.GRACE_PERIOD ?? 0) + (stats?.byState.PAST_DUE ?? 0);
            return (
              <article key={plan.id} className="relative flex flex-col rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link href={`/admin/plans/${plan.id}`} className="after:absolute after:inset-0">
                          {plan.name}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        <span className="block text-right">{plan.key}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "ظاهرة" : "مخفية"}</StatusPill>
                      {!plan.pricingConfigured && <StatusPill tone="warning">السعر مش مؤكد</StatusPill>}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight tabular-nums">{fmtMoney(plan.monthlyPrice)}</span>
                    <span className="text-sm text-muted-foreground">/ شهر</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fmtMoney(plan.yearlyPrice)} / سنة
                    {plan.discountPercent ? ` · خصم ${fmtNum(plan.discountPercent)}٪` : ""}
                  </p>
                  {plan.description && <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>}
                </div>

                <dl className="mt-auto grid grid-cols-3 divide-x divide-x-reverse divide-border border-t border-border text-center">
                  <div className="p-3">
                    <dt className="text-xs text-muted-foreground">{SUBSCRIPTION_META.ACTIVE.label}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{fmtNum(active)}</dd>
                  </div>
                  <div className="p-3">
                    <dt className="text-xs text-muted-foreground">منهم سنوي</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{fmtNum(stats?.yearly ?? 0)}</dd>
                  </div>
                  <div className="p-3">
                    <dt className="text-xs text-muted-foreground">متعثرين</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{fmtNum(atRisk)}</dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
                  <span>{fmtNum(plan._count.stores)} متجر إجمالًا · ترتيب {fmtNum(plan.sortOrder)}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    تعديل <ArrowUpRight className="size-3" />
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
