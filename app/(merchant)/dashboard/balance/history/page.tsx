import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCcw,
  Search,
  Download,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Filter,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { BalanceTransactionType } from "@/lib/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

const PAGE_SIZE = 10;

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

function buildHistoryUrl(params: {
  type?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number | string;
}) {
  const search = new URLSearchParams();

  if (params.type) search.set("type", params.type);
  if (params.q) search.set("q", params.q);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.page && String(params.page) !== "1") {
    search.set("page", String(params.page));
  }

  const query = search.toString();
  return `/dashboard/balance/history${query ? `?${query}` : ""}`;
}

function buildExportUrl(params: {
  type?: string;
  q?: string;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();

  if (params.type) search.set("type", params.type);
  if (params.q) search.set("q", params.q);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);

  const query = search.toString();
  return `/dashboard/balance/history/export${query ? `?${query}` : ""}`;
}

type BalanceHistoryProps = {
  searchParams?: Promise<{
    type?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

const BalanceHistory = async ({ searchParams }: BalanceHistoryProps) => {
  const userId = await requireUserId();
  const params = searchParams ? await searchParams : undefined;

  const selectedType = params?.type?.trim() || "";
  const searchQuery = params?.q?.trim() || "";
  const fromDate = params?.from?.trim() || "";
  const toDate = params?.to?.trim() || "";
  const currentPage = Math.max(Number(params?.page || 1), 1);

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
    },
  });

  if (!store) {
    return (
      <div className="min-h-[calc(100vh-120px)]" dir="rtl">
        <div className="mx-auto p-4 md:p-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Wallet className="size-6" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold">لا يوجد متجر بعد</h1>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  أنشئ متجرك أولًا عشان تقدر تتابع سجل الرصيد والحركات المالية.
                </p>
              </div>

              <Button asChild className="rounded-md">
                <Link href="/dashboard">الرجوع للداشبورد</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const validTypes = Object.values(BalanceTransactionType);
  const typeFilter = validTypes.includes(selectedType as BalanceTransactionType)
    ? (selectedType as BalanceTransactionType)
    : undefined;

  const createdAtFilter: { gte?: Date; lte?: Date } = {};

  if (fromDate) {
    createdAtFilter.gte = new Date(`${fromDate}T00:00:00`);
  }

  if (toDate) {
    createdAtFilter.lte = new Date(`${toDate}T23:59:59.999`);
  }

  const baseWhere = {
    storeId: store.id,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(fromDate || toDate ? { createdAt: createdAtFilter } : {}),
    ...(searchQuery
      ? {
          note: {
            contains: searchQuery,
          },
        }
      : {}),
  };

  const [transactions, totalCount, allMatchingTransactions] = await Promise.all(
    [
      prisma.balanceTransaction.findMany({
        where: baseWhere,
        orderBy: {
          createdAt: "desc",
        },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          type: true,
          amount: true,
          note: true,
          reference: true,
          createdAt: true,
          balanceBefore: true,
          balanceAfter: true,
        },
      }),

      prisma.balanceTransaction.count({
        where: baseWhere,
      }),

      prisma.balanceTransaction.findMany({
        where: baseWhere,
        select: {
          type: true,
          amount: true,
        },
      }),
    ],
  );

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  const totalTopups = allMatchingTransactions
    .filter((item) => item.type === BalanceTransactionType.TOPUP)
    .reduce((acc, item) => acc + item.amount, 0);

  const totalRefunds = allMatchingTransactions
    .filter((item) => item.type === BalanceTransactionType.REFUND)
    .reduce((acc, item) => acc + item.amount, 0);

  const totalCharges = allMatchingTransactions
    .filter((item) => item.amount < 0)
    .reduce((acc, item) => acc + Math.abs(item.amount), 0);

  const tabs = [
    { label: "الكل", value: "" },
    { label: "شحن", value: BalanceTransactionType.TOPUP },
    { label: "خصومات", value: BalanceTransactionType.SUBSCRIPTION_CHARGE },
    { label: "استرجاع", value: BalanceTransactionType.REFUND },
    { label: "إضافي", value: BalanceTransactionType.BONUS },
    { label: "تعديل يدوي", value: BalanceTransactionType.MANUAL_ADJUSTMENT },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-md border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-md px-3 py-1 text-xs font-medium"
              >
                سجل الرصيد
              </Badge>

              <Badge className="rounded-md bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                {store.name}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              سجل الحركات المالية
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              كل عمليات الشحن والخصم والاسترجاع والتعديلات الخاصة برصيد متجرك.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-md">
              <Link href={`/dashboard/balance/topup?storeId=${store.id}`}>
                شحن رصيد
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-md">
              <Link
                href={buildExportUrl({
                  type: selectedType,
                  q: searchQuery,
                  from: fromDate,
                  to: toDate,
                })}
              >
                <Download className="ms-2 size-4" />
                تصدير CSV
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription>الرصيد الحالي</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {formatPrice(store.balance)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription>إجمالي الشحن</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                {formatPrice(totalTopups)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription>إجمالي الخصومات</CardDescription>
              <CardTitle className="text-2xl font-bold text-rose-600">
                {formatPrice(totalCharges)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription>إجمالي الاسترجاع</CardDescription>
              <CardTitle className="text-2xl font-bold text-violet-600">
                {formatPrice(totalRefunds)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">الأنواع</CardTitle>
            <CardDescription>فلترة سريعة حسب نوع الحركة.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = selectedType === tab.value;

                return (
                  <Button
                    key={tab.label}
                    asChild
                    variant={isActive ? "default" : "outline"}
                    className="rounded-md"
                  >
                    <Link
                      href={buildHistoryUrl({
                        type: tab.value,
                        q: searchQuery,
                        from: fromDate,
                        to: toDate,
                        page: 1,
                      })}
                    >
                      {tab.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">بحث وفلترة</CardTitle>
            <CardDescription>
              ابحث بالملاحظة أو حدّد فترة زمنية معينة.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
              <div className="relative">
                <Search className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="ابحث في الملاحظات..."
                  className="rounded-md pe-10"
                />
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="from"
                  type="date"
                  defaultValue={fromDate}
                  className="rounded-md pe-10"
                />
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="to"
                  type="date"
                  defaultValue={toDate}
                  className="rounded-md pe-10"
                />
              </div>

              <input type="hidden" name="type" value={selectedType} />

              <Button type="submit" className="rounded-md">
                <Filter className="ms-2 size-4" />
                تطبيق
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">كل الحركات</CardTitle>
              <CardDescription>
                إجمالي النتائج: {totalCount} • الصفحة {currentPage} من{" "}
                {totalPages}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border/70 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Wallet className="size-5" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold">لا توجد حركات مطابقة</h3>
                  <p className="text-sm text-muted-foreground">
                    جرّب تغيّر الفلاتر أو ابحث بكلمة مختلفة.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-md border border-border/60">
                  <div className="hidden grid-cols-[1.2fr_0.9fr_1fr_1.2fr_1fr_1fr] items-center border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground lg:grid">
                    <div>النوع</div>
                    <div>المبلغ</div>
                    <div>التاريخ</div>
                    <div>الملاحظة</div>
                    <div>قبل</div>
                    <div>بعد</div>
                  </div>

                  <div className="divide-y">
                    {transactions.map((transaction) => {
                      const styles = getTransactionStyles(transaction.type);
                      const Icon = styles.icon;
                      const isPositive = transaction.amount > 0;

                      return (
                        <div
                          key={transaction.id}
                          className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.9fr_1fr_1.2fr_1fr_1fr] lg:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                              <Icon className={`size-4 ${styles.iconClass}`} />
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {getTransactionLabel(transaction.type)}
                              </span>

                              <Badge
                                variant="outline"
                                className={`w-fit rounded-md ${styles.badgeClass}`}
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

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{transaction.note || "—"}</p>
                            {transaction.reference ? (
                              <p className="text-xs text-muted-foreground/80">
                                Ref: {transaction.reference}
                              </p>
                            ) : null}
                          </div>

                          <div className="text-sm font-medium text-muted-foreground">
                            {formatPrice(transaction.balanceBefore)}
                          </div>

                          <div className="text-sm font-medium">
                            {formatPrice(transaction.balanceAfter)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    بتشوف {transactions.length} حركة في الصفحة الحالية
                  </p>

                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Button asChild variant="outline" className="rounded-md">
                        <Link
                          href={buildHistoryUrl({
                            type: selectedType,
                            q: searchQuery,
                            from: fromDate,
                            to: toDate,
                            page: currentPage - 1,
                          })}
                        >
                          <ChevronRight className="ms-2 size-4" />
                          السابق
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="rounded-md"
                        disabled
                      >
                        <ChevronRight className="ms-2 size-4" />
                        السابق
                      </Button>
                    )}

                    <div className="rounded-md border border-border/60 px-4 py-2 text-sm">
                      {currentPage} / {totalPages}
                    </div>

                    {currentPage < totalPages ? (
                      <Button asChild variant="outline" className="rounded-md">
                        <Link
                          href={buildHistoryUrl({
                            type: selectedType,
                            q: searchQuery,
                            from: fromDate,
                            to: toDate,
                            page: currentPage + 1,
                          })}
                        >
                          التالي
                          <ChevronLeft className="me-2 size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="rounded-md"
                        disabled
                      >
                        التالي
                        <ChevronLeft className="me-2 size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceHistory;
