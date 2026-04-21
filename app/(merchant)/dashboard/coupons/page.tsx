import Link from "next/link";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FolderOpen,
  MoveLeft,
  MoveRight,
  Percent,
  Plus,
  ShieldCheck,
  Store,
  TicketPercent,
  Trash2,
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
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!store) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Store className="size-6 text-muted-foreground" />
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

  const totalCoupons = await prisma.coupon.count({
    where: {
      storeId: store.id,
    },
  });

  const totalPages = Math.ceil(totalCoupons / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const skip = (safePage - 1) * PAGE_SIZE;

  const coupons = await prisma.coupon.findMany({
    where: {
      storeId: store.id,
    },
    orderBy: {
      createdAt: "desc",
    },
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

  return (
    <div className="space-y-6 " dir="rtl">
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
        actionHref="/dashboard/coupons/new"
      />

      {totalCoupons === 0 ? (
        <Card className="rounded-xl border-dashed shadow-sm">
          <CardContent className="flex min-h-90 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد كوبونات بعد</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              ابدأ بإضافة أول كوبون خصم لمتجرك علشان تشجع العملاء على الشراء
              وتزود المبيعات.
            </p>

            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/coupons/new">
                <Plus className="ms-2 size-4" />
                إضافة أول كوبون
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden rounded-xl shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-40 text-right">
                        الكود
                      </TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">القيمة</TableHead>
                      <TableHead className="text-right">الحد الأدنى</TableHead>
                      <TableHead className="text-right">الاستخدام</TableHead>
                      <TableHead className="text-right">المدة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {coupons.map((coupon) => {
                      const isExpired =
                        coupon.expiresAt &&
                        new Date(coupon.expiresAt) < new Date();

                      return (
                        <TableRow
                          key={coupon.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="py-4">
                            <div className="flex min-w-32 items-center gap-2">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted">
                                <BadgePercent className="size-5 text-primary" />
                              </div>

                              <div className="space-y-1">
                                <p className="font-semibold uppercase tracking-wide">
                                  {coupon.code}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(coupon.createdAt)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {coupon.type === "PERCENTAGE" ? (
                              <Badge
                                variant="outline"
                                className="gap-1 whitespace-nowrap rounded-xl"
                              >
                                <Percent className="size-3.5" />
                                نسبة مئوية
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 whitespace-nowrap rounded-xl"
                              >
                                <CircleDollarSign className="size-3.5" />
                                خصم ثابت
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-semibold">
                            {coupon.type === "PERCENTAGE"
                              ? `${coupon.value}%`
                              : formatPrice(coupon.value)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {coupon.minSubtotal
                              ? formatPrice(coupon.minSubtotal)
                              : "—"}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="space-y-1 text-sm">
                              <p>
                                تم الاستخدام:{" "}
                                <span className="font-semibold">
                                  {coupon.usedCount}
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                الحد:{" "}
                                <span className="font-medium">
                                  {coupon.usageLimit ?? "غير محدود"}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="space-y-1 text-sm">
                              <p>
                                من:{" "}
                                <span className="font-medium">
                                  {formatDate(coupon.startsAt)}
                                </span>
                              </p>
                              <p>
                                إلى:{" "}
                                <span className="font-medium">
                                  {formatDate(coupon.expiresAt)}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            {coupon.isActive && !isExpired ? (
                              <Badge className="gap-1 whitespace-nowrap rounded-xl">
                                <ShieldCheck className="size-3.5" />
                                نشط
                              </Badge>
                            ) : isExpired ? (
                              <Badge
                                variant="secondary"
                                className="whitespace-nowrap rounded-xl"
                              >
                                منتهي
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="whitespace-nowrap rounded-xl"
                              >
                                غير نشط
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <form
                                action={async () => {
                                  "use server";
                                  await ToggleCouponStatusAction(coupon.id);
                                  revalidatePath("/dashboard/coupons");
                                }}
                              >
                                <Button
                                  type="submit"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                >
                                  {coupon.isActive ? (
                                    <MoveRight className="ms-1 size-4" />
                                  ) : (
                                    <MoveLeft className="ms-1 size-4" />
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
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-xl"
                                >
                                  <Trash2 className="ms-1 size-4" />
                                  حذف
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
            <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                الصفحة{" "}
                <span className="font-medium text-foreground">{safePage}</span>{" "}
                من{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
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
                    <ChevronRight className="me-2 size-4" />
                    السابق
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === safePage;

                    return (
                      <Button
                        key={page}
                        asChild
                        variant={isActive ? "default" : "outline"}
                        size="icon"
                        className="rounded-xl"
                      >
                        <Link href={`/dashboard/coupons?page=${page}`}>
                          {page}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  asChild
                  variant="outline"
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
                    <ChevronLeft className="ms-2 size-4" />
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
