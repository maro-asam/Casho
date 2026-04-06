import {
  Wallet,
  CalendarClock,
  BadgeDollarSign,
  RefreshCcw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  AlertTriangle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  BalanceTransactionType,
  SubscriptionStatus,
} from "@/lib/generated/prisma/enums";
import RenewSubscriptionModal from "../../_components/RenewSubscriptionModal";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

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

function getSubscriptionStatusBadgeClass(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400";
    case SubscriptionStatus.GRACE_PERIOD:
      return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400";
    case SubscriptionStatus.PAST_DUE:
      return "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400";
    case SubscriptionStatus.CANCELED:
      return "bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/10 dark:text-zinc-400";
    case SubscriptionStatus.INACTIVE:
    default:
      return "bg-primary/10 text-primary hover:bg-primary/10";
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

function getTransactionStyles(type: BalanceTransactionType) {
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
        iconClass: "text-sky-600",
        badgeClass:
          "border-sky-200 bg-sky-500/10 text-sky-700 dark:text-sky-400",
      };

    case BalanceTransactionType.REFUND:
      return {
        icon: RefreshCcw,
        iconClass: "text-violet-600",
        badgeClass:
          "border-violet-200 bg-violet-500/10 text-violet-700 dark:text-violet-400",
      };

    case BalanceTransactionType.MANUAL_ADJUSTMENT:
    default:
      return {
        icon: RefreshCcw,
        iconClass: "text-amber-600",
        badgeClass:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
  }
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
          <Card className=" border-border/60 shadow-sm">
            <CardContent className="flex min-h-75 flex-col items-center justify-center gap-4 p-8 text-center">
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const enoughForRenewal = store.balance >= store.monthlyPrice;
  const remainingAfterRenewal = store.balance - store.monthlyPrice;
  const renewalProgress = Math.min(
    100,
    Math.round((store.balance / store.monthlyPrice) * 100),
  );

  const statusLabel = getSubscriptionStatusLabel(store.subscriptionStatus);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
        <div className="rounded-xl flex flex-col gap-4  border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                إدارة الرصيد والاشتراك
              </Badge>

              <Badge
                className={`rounded-full px-3 py-1 ${getSubscriptionStatusBadgeClass(
                  store.subscriptionStatus,
                )}`}
              >
                {statusLabel}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              الرصيد والاشتراك
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              تابع رصيد متجرك، حالة الاشتراك، موعد التجديد، وآخر الحركات المالية
              بشكل واضح ومنظم.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-2xl">
              <Link href={`/dashboard/balance/topup?storeId=${store.id}`}>
                <Plus className="ms-2 size-4" />
                شحن رصيد
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className=" border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription>الرصيد الحالي</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatPrice(store.balance)}
                </CardTitle>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                الرصيد المتاح للتجديد والاستخدام داخل المنصة.
              </p>
            </CardContent>
          </Card>

          <Card className=" border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription>سعر التجديد الشهري</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatPrice(store.monthlyPrice)}
                </CardTitle>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BadgeDollarSign className="size-5" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                يتم خصم هذا المبلغ تلقائيًا عند التجديد.
              </p>
            </CardContent>
          </Card>

          <Card className=" border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription>التجديد القادم</CardDescription>
                <CardTitle className="text-lg font-bold leading-7">
                  {formatDate(store.subscriptionEndsAt)}
                </CardTitle>
              </div>

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarClock className="size-5" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                {store.autoRenew
                  ? "التجديد التلقائي مفعل"
                  : "التجديد التلقائي متوقف"}
              </p>
            </CardContent>
          </Card>

          <Card className=" border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription>بعد التجديد القادم</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {enoughForRenewal
                    ? formatPrice(remainingAfterRenewal)
                    : "الرصيد غير كافٍ"}
                </CardTitle>
              </div>

              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${
                  enoughForRenewal
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {enoughForRenewal ? (
                  <RefreshCcw className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                {enoughForRenewal
                  ? "رصيدك الحالي يكفي للتجديد القادم."
                  : "اشحن الرصيد قبل موعد التجديد لتجنب توقف المتجر."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className=" border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">ملخص الاشتراك</CardTitle>
              <CardDescription>
                نظرة سريعة على حالة الاشتراك الحالية لمتجرك.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    اسم المتجر
                  </p>
                  <p className="font-semibold">{store.name}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    حالة الاشتراك
                  </p>
                  <p className="font-semibold">{statusLabel}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    التجديد التلقائي
                  </p>
                  <p className="font-semibold">
                    {store.autoRenew ? "مفعل" : "متوقف"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-1 text-sm text-muted-foreground">
                    المبلغ المطلوب للتجديد
                  </p>
                  <p className="font-semibold">
                    {formatPrice(store.monthlyPrice)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:col-span-2">
                  <p className="mb-1 text-sm text-muted-foreground">
                    نهاية فترة السماح
                  </p>
                  <p className="font-semibold">
                    {formatDate(store.gracePeriodEndsAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    جاهزية الرصيد للتجديد
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {renewalProgress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      enoughForRenewal ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${renewalProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {enoughForRenewal
                    ? "ممتاز، رصيدك الحالي يكفي لتجديد الاشتراك القادم."
                    : "الرصيد الحالي أقل من المطلوب. اشحن رصيدًا إضافيًا قبل موعد التجديد."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className=" border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
              <CardDescription>
                أهم العمليات الخاصة بالرصيد والاشتراك.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                asChild
                className="h-12 w-full justify-between rounded-2xl"
              >
                <Link href="/dashboard/balance/topup">
                  <span>شحن رصيد جديد</span>
                  <Plus className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full justify-between rounded-2xl"
              >
                <Link href="/dashboard/balance/renew">
                  <span>تجديد الاشتراك الآن</span>
                  <RefreshCcw className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 w-full justify-between rounded-2xl"
              >
                <Link href={`/store/${store.slug}`}>
                  <span>فتح المتجر</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>

              <div className="rounded-2xl border border-amber-200 bg-amber-500/5 p-4">
                <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  تنبيه
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  لو الرصيد ما كفاش وقت التجديد، المتجر ممكن يدخل فترة سماح قبل
                  الإيقاف.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className=" border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">آخر الحركات المالية</CardTitle>
              <CardDescription>
                آخر عمليات الشحن والخصم والتعديلات على الرصيد.
              </CardDescription>
            </div>

            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/dashboard/balance/history">عرض الكل</Link>
            </Button>
          </CardHeader>

          <CardContent>
            {store.balanceTransactions.length === 0 ? (
              <div className="flex min-h-55 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
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
              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="hidden grid-cols-[1.3fr_1fr_1fr_2fr] items-center border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
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
                        className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_1fr_1fr_2fr] md:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-2xl bg-muted">
                            <Icon className={`size-4 ${styles.iconClass}`} />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {getTransactionLabel(transaction.type)}
                            </span>

                            <Badge
                              variant="outline"
                              className={`w-fit rounded-full ${styles.badgeClass}`}
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                        </div>

                        <div
                          className={`text-sm font-semibold md:text-base ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceRoute;
