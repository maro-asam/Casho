import Link from "next/link";
import {
  ArrowRightLeft,
  Wallet,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { SubscriptionStatus } from "@prisma/client";
import { getAllActivePlans, getEntitlementsSnapshot } from "@/lib/entitlements";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsageBar } from "@/components/entitlements/UsageBar";
import { PlanComparisonClient } from "./_components/PlanComparisonClient";
import type { PlanForUI } from "./_components/PlanCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الباقات والأسعار",
};

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSubscriptionStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "نشط";
    case SubscriptionStatus.GRACE_PERIOD:
      return "فترة سماح";
    case SubscriptionStatus.PAST_DUE:
      return "متأخر";
    case SubscriptionStatus.CANCELED:
      return "ملغي";
    case SubscriptionStatus.INACTIVE:
    default:
      return "غير مفعل";
  }
}

type SearchParams = {
  onboarding?: string | string[];
};

export default async function ChangePlanRoute({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);

  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      monthlyPrice: true,
      billingCycle: true,
      planId: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      planSelected: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const isOnboarding = params?.onboarding === "1" || !store?.planSelected;

  if (!store) {
    return (
      <div className="min-h-[calc(100vh-120px)] " dir="rtl">
        <Card>
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft className="size-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">لا يوجد متجر بعد</h1>
              <p className="text-sm text-muted-foreground">
                لازم يكون عندك متجر أولًا عشان تقدر تغيّر الباقة.
              </p>
            </div>

            <Button asChild>
              <Link href="/">الرجوع للداشبورد</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [allPlans, snapshot] = await Promise.all([
    getAllActivePlans(),
    getEntitlementsSnapshot(store.id),
  ]);

  const plansForUI: PlanForUI[] = allPlans.map((plan) => ({
    id: plan.id,
    key: plan.key,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    originalMonthlyPrice: plan.originalMonthlyPrice,
    originalYearlyPrice: plan.originalYearlyPrice,
    discountPercent: plan.discountPercent,
    sortOrder: plan.sortOrder,
    features: plan.planFeatures
      .filter((pf) => pf.feature.isActive)
      .sort((a, b) => a.feature.sortOrder - b.feature.sortOrder)
      .map((pf) => ({
        key: pf.feature.key,
        name: pf.feature.name,
        unit: pf.feature.unit,
        enabled: pf.enabled,
        isUnlimited: pf.isUnlimited,
        limitValue: pf.limitValue,
      })),
  }));

  const currentPlan = plansForUI.find((p) => p.id === store.planId) ?? null;
  const enoughForCurrentRenewal = store.balance >= store.monthlyPrice;

  const featureLabelByKey = new Map(
    plansForUI[0]?.features.map((f) => [f.key, { name: f.name, unit: f.unit }]) ?? [],
  );
  const usageRows = Object.entries(snapshot.usage);

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 p-4 md:p-6" dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">إدارة الباقة</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{store.name}</Badge>
            </div>

            <h1 className="text-2xl font-semibold md:text-3xl">
              {isOnboarding ? "اختيار الباقة" : "الباقات والأسعار"}
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {isOnboarding
                ? "اختار الباقة المناسبة لمتجرك عشان تكمل إعداد الحساب. الاختيار هنا مش خصم فوري."
                : "اختار الباقة المناسبة لمتجرك. التغيير هنا بيأثر على التجديد القادم، مش خصم فوري."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">الباقة الحالية</p>
                <p className="text-xl font-semibold">{currentPlan?.name ?? "—"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">سعر التجديد القادم</p>
                <p className="text-xl font-semibold">{formatMoneyFromPiasters(store.monthlyPrice)}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <PlanComparisonClient
        plans={plansForUI}
        currentPlanId={store.planId}
        currentSortOrder={currentPlan?.sortOrder ?? -1}
        initialBillingCycle={store.billingCycle}
      />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الاستخدام الحالي</CardTitle>
            <CardDescription>استخدامك من الموارد المحدودة في باقتك الحالية.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {usageRows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">لا توجد موارد محدودة في باقتك الحالية.</p>
            ) : (
              usageRows.map(([key, usage]) => (
                <UsageBar
                  key={key}
                  label={featureLabelByKey.get(key)?.name ?? key}
                  used={usage.used}
                  limit={usage.limit}
                  isUnlimited={usage.isUnlimited}
                  unit={featureLabelByKey.get(key)?.unit ?? undefined}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">وضع الاشتراك الحالي</CardTitle>
              <CardDescription>ملخص سريع لحالة اشتراك المتجر حاليًا.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">حالة الاشتراك</p>
                <p className="font-semibold">{getSubscriptionStatusLabel(store.subscriptionStatus)}</p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">نهاية الاشتراك</p>
                <p className="font-semibold">{formatDate(store.subscriptionEndsAt)}</p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">دورة الفوترة</p>
                <p className="font-semibold">{store.billingCycle === "YEARLY" ? "سنوية" : "شهرية"}</p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">التجديد التلقائي</p>
                <p className="font-semibold">{store.autoRenew ? "مفعل" : "متوقف"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حالة الرصيد</CardTitle>
              <CardDescription>هل الرصيد الحالي يكفي للتجديد على الباقة الحالية؟</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">الرصيد الحالي</p>
                <p className="font-semibold">{formatMoneyFromPiasters(store.balance)}</p>
              </div>

              <div
                className={
                  enoughForCurrentRenewal
                    ? "rounded-xl border border-emerald-200 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400"
                    : "rounded-xl border border-amber-200 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400"
                }
              >
                <div className="flex items-center gap-2">
                  {enoughForCurrentRenewal ? <RefreshCcw className="size-4" /> : <AlertTriangle className="size-4" />}
                  <p className="text-sm font-medium">
                    {enoughForCurrentRenewal ? "الرصيد الحالي يكفي للتجديد." : "الرصيد الحالي لا يكفي للتجديد."}
                  </p>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/dashboard/balance/topup">
                  <Wallet className="ms-2 size-4" />
                  شحن رصيد
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
