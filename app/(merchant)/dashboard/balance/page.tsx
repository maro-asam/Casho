import Link from "next/link";
import { Metadata } from "next";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarClock,
  Gift,
  Plus,
  RefreshCcw,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  BalanceTransactionType,
  SubscriptionStatus,
} from "@prisma/client";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import RenewSubscriptionModal from "./_components/RenewSubscriptionModal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "إدارة الرصيد",
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

function getSubscriptionStatusVariant(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "success";
    case SubscriptionStatus.GRACE_PERIOD:
      return "warning";
    case SubscriptionStatus.PAST_DUE:
      return "danger";
    case SubscriptionStatus.CANCELED:
      return "neutral";
    case SubscriptionStatus.INACTIVE:
    default:
      return "default";
  }
}

function getSubscriptionStatusBadgeClass(status: SubscriptionStatus) {
  const variant = getSubscriptionStatusVariant(status);

  switch (variant) {
    case "success":
      return "border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400";
    case "warning":
      return "border-amber-200 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400";
    case "danger":
      return "border-rose-200 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400";
    case "neutral":
      return "border-zinc-200 bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/10 dark:text-zinc-400";
    default:
      return "border-primary/20 bg-primary/10 text-primary hover:bg-primary/10";
  }
}

function getTransactionLabel(type: BalanceTransactionType) {
  switch (type) {
    case BalanceTransactionType.TOPUP:
      return "شحن رصيد";
    case BalanceTransactionType.SUBSCRIPTION_CHARGE:
      return "خصم اشتراك";
    case BalanceTransactionType.BONUS:
      return "رصيد إضافي";
    case BalanceTransactionType.MANUAL_ADJUSTMENT:
      return "تعديل يدوي";
    case BalanceTransactionType.REFUND:
      return "استرجاع رصيد";
    default:
      return type;
  }
}

function getTransactionStyles(type: BalanceTransactionType): {
  icon: LucideIcon;
  iconClass: string;
  badgeClass: string;
} {
  switch (type) {
    case BalanceTransactionType.TOPUP:
      return {
        icon: ArrowDownLeft,
        iconClass: "text-emerald-600",
        badgeClass:
          "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };

    case BalanceTransactionType.SUBSCRIPTION_CHARGE:
      return {
        icon: ArrowUpRight,
        iconClass: "text-rose-600",
        badgeClass:
          "border-rose-200 bg-rose-500/10 text-rose-700 dark:text-rose-400",
      };

    case BalanceTransactionType.BONUS:
      return {
        icon: Gift,
        iconClass: "text-primary",
        badgeClass:
          "border-primary/20 bg-primary/10 text-primary dark:text-primary",
      };

    case BalanceTransactionType.REFUND:
      return {
        icon: RefreshCcw,
        iconClass: "text-amber-600",
        badgeClass:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };

    case BalanceTransactionType.MANUAL_ADJUSTMENT:
    default:
      return {
        icon: RefreshCcw,
        iconClass: "text-muted-foreground",
        badgeClass:
          "border-border bg-muted text-muted-foreground dark:text-muted-foreground",
      };
  }
}

type QuickStatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
};

function QuickStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: QuickStatCardProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-xl font-bold md:text-2xl">
            {value}
          </CardTitle>
        </div>

        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary",
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

const BalanceRoute = async () => {
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
      balanceTransactions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          note: true,
          createdAt: true,
          balanceBefore: true,
          balanceAfter: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="min-h-[calc(100vh-120px)]" dir="rtl">
        <div className="mx-auto p-4 md:p-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex min-h-105 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-6" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">لا يوجد متجر بعد</h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  أنشئ متجرك أولًا عشان تقدر تتابع الرصيد، الاشتراك، وسجل
                  الحركات المالية.
                </p>
              </div>

              <Button asChild className="rounded-xl">
                <Link href="/dashboard">الرجوع للوحة التحكم</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusLabel = getSubscriptionStatusLabel(store.subscriptionStatus);
  const enoughForRenewal = store.balance >= store.monthlyPrice;
  const remainingAfterRenewal = store.balance - store.monthlyPrice;
  const amountNeeded = Math.max(store.monthlyPrice - store.balance, 0);

  const renewalProgress =
    store.monthlyPrice > 0
      ? Math.min(100, Math.round((store.balance / store.monthlyPrice) * 100))
      : 0;

  return (
    <div className="min-h-[calc(100vh-120px)]" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-xl px-3 py-1">
                  إدارة الرصيد
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-xl px-3 py-1",
                    getSubscriptionStatusBadgeClass(store.subscriptionStatus),
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  تابع رصيد متجرك بسهولة
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  راقب الرصيد، اعرف موعد التجديد، وشوف آخر الحركات المالية بشكل
                  منظم وواضح.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href={`/dashboard/balance/topup?storeId=${store.id}`}>
                  شحن رصيد
                  <Plus className="ms-2 size-4" />
                </Link>
              </Button>

              <RenewSubscriptionModal
                storeId={store.id}
                balance={store.balance}
                monthlyPrice={store.monthlyPrice}
                subscriptionStatus={store.subscriptionStatus}
                subscriptionEndsAt={store.subscriptionEndsAt}
                gracePeriodEndsAt={store.gracePeriodEndsAt}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 shadow-sm lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {formatPrice(store.balance)}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {enoughForRenewal
                      ? `بعد التجديد القادم هيتبقى ${formatPrice(
                          remainingAfterRenewal,
                        )}`
                      : `محتاج ${formatPrice(
                          amountNeeded,
                        )} إضافية عشان التجديد القادم`}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                    enoughForRenewal
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600",
                  )}
                >
                  {enoughForRenewal ? (
                    <Wallet className="size-6" />
                  ) : (
                    <AlertTriangle className="size-6" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    جاهزية الرصيد للتجديد
                  </span>
                  <span className="font-medium text-foreground">
                    {renewalProgress}%
                  </span>
                </div>

                <Progress value={renewalProgress} className="h-2.5" />

                <p className="text-sm leading-6 text-muted-foreground">
                  {enoughForRenewal
                    ? "ممتاز، رصيدك الحالي يكفي للتجديد القادم بدون أي مشكلة."
                    : "الرصيد الحالي أقل من المطلوب. اشحن رصيدًا إضافيًا قبل موعد التجديد لتجنب توقف المتجر."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <QuickStatCard
              title="سعر التجديد الشهري"
              value={formatPrice(store.monthlyPrice)}
              description="المبلغ المطلوب لتجديد اشتراك المتجر."
              icon={BadgeDollarSign}
            />

            <QuickStatCard
              title="التجديد القادم"
              value={formatDate(store.subscriptionEndsAt)}
              description={
                store.autoRenew
                  ? "التجديد التلقائي مفعل حاليًا."
                  : "التجديد التلقائي متوقف حاليًا."
              }
              icon={CalendarClock}
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل الاشتراك</CardTitle>
              <CardDescription>
                ملخص سريع لأهم بيانات الرصيد والاشتراك.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <InfoRow label="اسم المتجر" value={store.name} />
              <InfoRow label="حالة الاشتراك" value={statusLabel} />
              <InfoRow
                label="التجديد التلقائي"
                value={store.autoRenew ? "مفعل" : "متوقف"}
              />
              <InfoRow
                label="المبلغ المطلوب للتجديد"
                value={formatPrice(store.monthlyPrice)}
              />
              <InfoRow
                label="موعد التجديد القادم"
                value={formatDate(store.subscriptionEndsAt)}
              />
              <InfoRow
                label="نهاية فترة السماح"
                value={formatDate(store.gracePeriodEndsAt)}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
              <CardDescription>
                أهم العمليات اللي ممكن تحتاجها بسرعة.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                asChild
                className="h-12 w-full justify-between rounded-xl"
              >
                <Link href={`/dashboard/balance/topup?storeId=${store.id}`}>
                  <span>شحن رصيد جديد</span>
                  <Plus className="size-4" />
                </Link>
              </Button>

              <RenewSubscriptionModal
                className="w-full"
                storeId={store.id}
                balance={store.balance}
                monthlyPrice={store.monthlyPrice}
                subscriptionStatus={store.subscriptionStatus}
                subscriptionEndsAt={store.subscriptionEndsAt}
                gracePeriodEndsAt={store.gracePeriodEndsAt}
              />

              <Button
                asChild
                variant="outline"
                className="h-12 w-full justify-between rounded-xl"
              >
                <Link href={`/store/${store.slug}`}>
                  <span>فتح المتجر</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>

              {!enoughForRenewal && (
                <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4">
                  <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    تنبيه مهم
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    الرصيد الحالي لا يكفي للتجديد. اشحن{" "}
                    <span className="font-medium text-foreground">
                      {formatPrice(amountNeeded)}
                    </span>{" "}
                    على الأقل قبل الموعد القادم.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">آخر الحركات المالية</CardTitle>
              <CardDescription>
                آخر عمليات الشحن والخصم والتعديلات على الرصيد.
              </CardDescription>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/balance/history">عرض الكل</Link>
            </Button>
          </CardHeader>

          <CardContent>
            {store.balanceTransactions.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Wallet className="size-5" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold">لا توجد حركات مالية بعد</h3>
                  <p className="text-sm text-muted-foreground">
                    أول ما تضيف رصيد أو يتم خصم اشتراك، هتظهر الحركات هنا.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
                  <div className="grid grid-cols-[1.3fr_1fr_1fr_2fr] items-center border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
                    <div>النوع</div>
                    <div>المبلغ</div>
                    <div>التاريخ</div>
                    <div>ملاحظة</div>
                  </div>

                  <div className="divide-y">
                    {store.balanceTransactions.map((transaction) => {
                      const styles = getTransactionStyles(transaction.type);
                      const Icon = styles.icon;
                      const isPositive = transaction.amount > 0;

                      return (
                        <div
                          key={transaction.id}
                          className="grid grid-cols-[1.3fr_1fr_1fr_2fr] items-center gap-3 px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                              <Icon
                                className={cn("size-4", styles.iconClass)}
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {getTransactionLabel(transaction.type)}
                              </span>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "w-fit rounded-xl",
                                  styles.badgeClass,
                                )}
                              >
                                {transaction.type}
                              </Badge>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "text-sm font-semibold md:text-base",
                              isPositive ? "text-emerald-600" : "text-rose-600",
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {formatPrice(transaction.amount)}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {transaction.note || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:hidden">
                  {store.balanceTransactions.map((transaction) => {
                    const styles = getTransactionStyles(transaction.type);
                    const Icon = styles.icon;
                    const isPositive = transaction.amount > 0;

                    return (
                      <Card
                        key={transaction.id}
                        className="border-border/60 shadow-none"
                      >
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                <Icon
                                  className={cn("size-4", styles.iconClass)}
                                />
                              </div>

                              <div className="space-y-1">
                                <p className="font-medium">
                                  {getTransactionLabel(transaction.type)}
                                </p>

                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-fit rounded-xl",
                                    styles.badgeClass,
                                  )}
                                >
                                  {transaction.type}
                                </Badge>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "text-sm font-semibold",
                                isPositive
                                  ? "text-emerald-600"
                                  : "text-rose-600",
                              )}
                            >
                              {isPositive ? "+" : ""}
                              {formatPrice(transaction.amount)}
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{formatDate(transaction.createdAt)}</p>
                            <p>{transaction.note || "—"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceRoute;
