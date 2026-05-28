import Link from "next/link";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FolderOpen,
  Percent,
  Plus,
  ShieldCheck,
  Store,
  TicketPercent,
  Trash2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  DeleteCouponAction,
  ToggleCouponStatusAction,
} from "@/actions/coupons/coupons.actions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الكوبونات",
};

const PAGE_SIZE = 6;

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

type MerchantCouponsRouteProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const Coupons = async ({ searchParams }: MerchantCouponsRouteProps) => {
  const userId = await requireUserId();
  const resolvedSearchParams = await searchParams;

  const currentPage = Math.max(Number(resolvedSearchParams?.page || "1"), 1);

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true, slug: true },
  });

  if (!store) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Store className="size-6" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              لازم يكون عندك متجر أولًا علشان تقدر تنشئ وتدير كوبونات الخصم.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();

  const [totalCoupons, activeCoupons, inactiveCoupons, expiredCoupons] =
    await Promise.all([
      prisma.coupon.count({ where: { storeId: store.id } }),
      prisma.coupon.count({
        where: {
          storeId: store.id,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.coupon.count({
        where: { storeId: store.id, isActive: false },
      }),
      prisma.coupon.count({
        where: {
          storeId: store.id,
          expiresAt: { lte: now },
        },
      }),
    ]);

  const totalPages = Math.ceil(totalCoupons / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const skip = (safePage - 1) * PAGE_SIZE;

  const coupons = await prisma.coupon.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      isActive: true,
      minSubtotal: true,
      maxDiscount: true,
      usageLimit: true,
      usedCount: true,
      startsAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const statCards = [
    {
      label: "إجمالي الكوبونات",
      value: totalCoupons,
      icon: TicketPercent,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "نشط",
      value: activeCoupons,
      icon: ShieldCheck,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "غير نشط",
      value: inactiveCoupons,
      icon: XCircle,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "منتهي الصلاحية",
      value: expiredCoupons,
      icon: Clock,
      className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={TicketPercent}
        title="الكوبونات"
        badge={totalCoupons}
        description={
          <>
            إدارة كوبونات الخصم الخاصة بمتجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="إضافة كوبون جديد"
        actionHref="/coupons/new"
      />

      {totalCoupons > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border bg-card shadow-sm"
              >
                <div className="p-5">
                  <div
                    className={cn(
                      "mb-3 grid size-9 place-items-center rounded-xl",
                      stat.className,
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("ar-EG").format(stat.value)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalCoupons === 0 ? (
        <Card className="rounded-xl border-dashed border-border/40 shadow-sm">
          <CardContent className="flex min-h-90 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen className="size-7" />
            </div>
            <h2 className="text-xl font-bold">لا توجد كوبونات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول كوبون خصم لمتجرك علشان تشجع العملاء على الشراء
              وتزود المبيعات.
            </p>
            <Button asChild className="mt-6 ">
              <Link href="/coupons/new">
                <Plus className="ms-2 size-4" />
                إضافة أول كوبون
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="ps-6 text-right text-xs font-medium text-muted-foreground">
                        الكوبون
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        النوع والقيمة
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        الشروط
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        الاستخدام
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        المدة
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        الحالة
                      </TableHead>
                      <TableHead className="pe-6" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {coupons.map((coupon) => {
                      const isExpired =
                        coupon.expiresAt && new Date(coupon.expiresAt) < now;
                      const isActiveAndValid = coupon.isActive && !isExpired;

                      return (
                        <TableRow
                          key={coupon.id}
                          className="border-border/30 transition-colors hover:bg-muted/20"
                        >
                          <TableCell className="py-4 ps-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "grid size-10 shrink-0 place-items-center rounded-xl",
                                  isActiveAndValid
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                <BadgePercent className="size-5" />
                              </div>
                              <div>
                                <p className="font-bold uppercase tracking-wider">
                                  {coupon.code}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatDate(coupon.createdAt)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1.5">
                              {coupon.type === "PERCENTAGE" ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 rounded-full border-border px-2 py-0 text-[11px]"
                                >
                                  <Percent className="size-2.5" />
                                  نسبة مئوية
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="gap-1 rounded-full border-border px-2 py-0 text-[11px]"
                                >
                                  <CircleDollarSign className="size-2.5" />
                                  خصم ثابت
                                </Badge>
                              )}
                              <p className="text-sm font-bold">
                                {coupon.type === "PERCENTAGE"
                                  ? `${coupon.value}%`
                                  : formatPrice(coupon.value)}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>
                                الحد الأدنى:{" "}
                                <span className="font-medium text-foreground">
                                  {coupon.minSubtotal
                                    ? formatPrice(coupon.minSubtotal)
                                    : "—"}
                                </span>
                              </p>
                              <p>
                                أقصى خصم:{" "}
                                <span className="font-medium text-foreground">
                                  {coupon.maxDiscount
                                    ? formatPrice(coupon.maxDiscount)
                                    : "—"}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1 text-xs">
                              <p>
                                <span className="font-bold text-foreground">
                                  {coupon.usedCount}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  مرة
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                الحد:{" "}
                                <span className="font-medium text-foreground">
                                  {coupon.usageLimit ?? "غير محدود"}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>
                                من:{" "}
                                <span className="font-medium text-foreground">
                                  {formatDate(coupon.startsAt)}
                                </span>
                              </p>
                              <p>
                                إلى:{" "}
                                <span className="font-medium text-foreground">
                                  {formatDate(coupon.expiresAt)}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            {isActiveAndValid ? (
                              <Badge className="gap-1 rounded-full border-0 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
                                <ShieldCheck className="size-3" />
                                نشط
                              </Badge>
                            ) : isExpired ? (
                              <Badge className="rounded-full border-0 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400">
                                منتهي
                              </Badge>
                            ) : (
                              <Badge className="rounded-full border-0 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400">
                                غير نشط
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="pe-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <form
                                action={async () => {
                                  "use server";
                                  await ToggleCouponStatusAction(coupon.id);
                                  revalidatePath("/dashboard/coupons");
                                }}
                              >
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-8 rounded-xl px-3 text-xs",
                                    coupon.isActive
                                      ? "text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                                      : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700",
                                  )}
                                >
                                  {coupon.isActive ? (
                                    <ToggleRight className="ms-1 size-3.5" />
                                  ) : (
                                    <ToggleLeft className="ms-1 size-3.5" />
                                  )}
                                  {coupon.isActive ? "تعطيل" : "تفعيل"}
                                </Button>
                              </form>

                              <form
                                action={async () => {
                                  "use server";
                                  await DeleteCouponAction(coupon.id);
                                  revalidatePath("/dashboard/coupons");
                                }}
                              >
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/30 bg-background px-5 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                الصفحة{" "}
                <span className="font-bold text-foreground">{safePage}</span> من{" "}
                <span className="font-bold text-foreground">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={safePage <= 1}
                >
                  <Link
                    href={`/dashboard/coupons?page=${safePage - 1}`}
                    aria-disabled={safePage <= 1}
                    className={
                      safePage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ChevronRight className="me-1 size-4" />
                    السابق
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map(
                    (_, i) => {
                      const page = i + 1;
                      const isActive = page === safePage;
                      return (
                        <Button
                          key={page}
                          asChild
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="h-8 w-8 rounded-xl p-0"
                        >
                          <Link href={`/dashboard/coupons?page=${page}`}>
                            {page}
                          </Link>
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={safePage >= totalPages}
                >
                  <Link
                    href={`/dashboard/coupons?page=${safePage + 1}`}
                    aria-disabled={safePage >= totalPages}
                    className={
                      safePage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >
                    التالي
                    <ChevronLeft className="ms-1 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Coupons;
