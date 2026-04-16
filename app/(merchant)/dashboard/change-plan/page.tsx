import Link from "next/link";
import {
  ArrowRightLeft,
  Wallet,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChangePlanForm from "./_components/ChangePlanForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تغيير الخطة",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

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

function getPlanKeyFromPrice(
  price: number,
): "STARTER" | "GROWTH" | "PRO" | "CUSTOM" {
  if (price === 29900) return "STARTER";
  if (price === 49900) return "GROWTH";
  if (price === 99900) return "PRO";
  return "CUSTOM";
}

export default async function ChangePlanRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      monthlyPrice: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!store) {
    return (
      <div className="min-h-[calc(100vh-120px)] p-4 md:p-6" dir="rtl">
        <Card>
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft className="size-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">لا يوجد متجر بعد</h1>
              <p className="text-sm text-muted-foreground">
                لازم يكون عندك متجر أولًا عشان تقدر تغيّر الباقة.
              </p>
            </div>

            <Button asChild>
              <Link href="/dashboard">الرجوع للداشبورد</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = getPlanKeyFromPrice(store.monthlyPrice);
  const enoughForCurrentRenewal = store.balance >= store.monthlyPrice;

  return (
    <div
      className="min-h-[calc(100vh-120px)] bg-background p-4 md:p-6"
      dir="rtl"
    >
      <div className="mx-auto flex w-full flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">إدارة الباقة</Badge>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  {store.name}
                </Badge>
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">تغيير الباقة</h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                اختار الباقة المناسبة لمتجرك، وحدد هل التجديد التلقائي يفضل شغال
                ولا لا. التغيير هنا بيأثر على التجديد القادم، مش خصم فوري.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    الباقة الحالية
                  </p>
                  <p className="text-xl font-bold">{currentPlan}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    السعر الشهري الحالي
                  </p>
                  <p className="text-xl font-bold">
                    {formatPrice(store.monthlyPrice)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <ChangePlanForm
              currentPlan={currentPlan}
              currentMonthlyPrice={store.monthlyPrice}
              currentBalance={store.balance}
              autoRenew={store.autoRenew}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">وضع الاشتراك الحالي</CardTitle>
                <CardDescription>
                  ملخص سريع لحالة اشتراك المتجر حاليًا.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    حالة الاشتراك
                  </p>
                  <p className="font-semibold">
                    {getSubscriptionStatusLabel(store.subscriptionStatus)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    نهاية الاشتراك
                  </p>
                  <p className="font-semibold">
                    {formatDate(store.subscriptionEndsAt)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    نهاية فترة السماح
                  </p>
                  <p className="font-semibold">
                    {formatDate(store.gracePeriodEndsAt)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    التجديد التلقائي
                  </p>
                  <p className="font-semibold">
                    {store.autoRenew ? "مفعل" : "متوقف"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">حالة الرصيد</CardTitle>
                <CardDescription>
                  هل الرصيد الحالي يكفي للتجديد على الباقة الحالية؟
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    الرصيد الحالي
                  </p>
                  <p className="font-semibold">{formatPrice(store.balance)}</p>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    تكلفة التجديد الحالية
                  </p>
                  <p className="font-semibold">
                    {formatPrice(store.monthlyPrice)}
                  </p>
                </div>

                <div
                  className={
                    enoughForCurrentRenewal
                      ? "rounded-xl border border-emerald-200 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400"
                      : "rounded-xl border border-amber-200 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400"
                  }
                >
                  <div className="flex items-center gap-2">
                    {enoughForCurrentRenewal ? (
                      <RefreshCcw className="size-4" />
                    ) : (
                      <AlertTriangle className="size-4" />
                    )}

                    <p className="text-sm font-medium">
                      {enoughForCurrentRenewal
                        ? "الرصيد الحالي يكفي للتجديد."
                        : "الرصيد الحالي لا يكفي للتجديد."}
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
    </div>
  );
}
