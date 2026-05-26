import Link from "next/link";
import { Metadata } from "next";
import {
  FolderOpen,
  ShoppingCart,
  Store,
  Phone,
  CreditCard,
  Eye,
  ChevronRight,
  ChevronLeft,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { OrderStatusSelect } from "./_components/order-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الطلبات",
};

const PAGE_SIZE = 10;

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "معلق",
    PAID: "مدفوع",
    SHIPPED: "تم الشحن",
    DELIVERED: "وصل",
    CANCELED: "ملغي",
  };
  return labels[status];
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash_on_delivery":
      return "كاش عند الاستلام";
    case "instapay":
      return "إنستاباي";
    case "vodafone_cash":
      return "فودافون كاش";
    default:
      return method;
  }
}

function getStatusClassName(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING:
      "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
    PAID: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
    SHIPPED:
      "bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300",
    DELIVERED:
      "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
    CANCELED:
      "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
  };
  return classes[status];
}

type OrdersRouteProps = {
  searchParams?: Promise<{ page?: string }>;
};

const OrdersRoute = async ({ searchParams }: OrdersRouteProps) => {
  const userId = await requireUserId();
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="border-dashed border-border/40">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Store className="size-6" />
            </div>
            <h2 className="text-xl font-bold">لم يتم العثور على متجر</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              يجب إنشاء متجر أولًا حتى تتمكن من متابعة الطلبات وإدارتها.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [totalOrders, pendingCount, deliveredCount, canceledCount, orders] =
    await Promise.all([
      prisma.order.count({ where: { storeId: store.id } }),
      prisma.order.count({ where: { storeId: store.id, status: "PENDING" } }),
      prisma.order.count({ where: { storeId: store.id, status: "DELIVERED" } }),
      prisma.order.count({ where: { storeId: store.id, status: "CANCELED" } }),
      prisma.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

  const statCards = [
    {
      label: "إجمالي الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "معلق",
      value: pendingCount,
      icon: Clock3,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "مكتمل",
      value: deliveredCount,
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "ملغي",
      value: canceledCount,
      icon: XCircle,
      className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={ShoppingCart}
        title="الطلبات"
        badge={totalOrders}
        description={
          <>
            متابعة وإدارة طلبات متجر{" "}
            <span className="font-semibold text-foreground">{store.name}</span>
          </>
        }
        actionLabel="تصدير CSV"
        actionHref="/api/export/orders"
      />

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

      {orders.length === 0 ? (
        <Card className=" border-dashed border-border/40 shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen className="size-7" />
            </div>
            <h2 className="text-xl font-bold">لا توجد طلبات حتى الآن</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              لما العملاء يبدأوا يطلبوا من المتجر، الطلبات هتظهر هنا وتقدر
              تتابع حالتها بسهولة.
            </p>
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
                        الطلب
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        العميل
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        المنتجات
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        المبلغ
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        الحالة
                      </TableHead>
                      <TableHead className="pe-6" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-border/30 transition-colors hover:bg-muted/20"
                      >
                        <TableCell className="py-4 ps-6">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-sm font-bold text-primary hover:underline"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-sm font-medium">{order.fullName}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3 shrink-0" />
                            <span>{order.phone}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-sm font-medium">
                            {order.items.length} منتج
                          </p>
                          {order.items[0] && (
                            <p className="mt-0.5 max-w-44 truncate text-xs text-muted-foreground">
                              {order.items[0].product.name}
                              {order.items.length > 1 &&
                                ` +${order.items.length - 1}`}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="py-4">
                          <p className="text-sm font-bold">
                            {formatPrice(order.total)}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-1 gap-1 rounded-full border-border px-2 py-0 text-[11px]"
                          >
                            <CreditCard className="size-2.5" />
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Badge
                              className={cn(
                                "rounded-full border-0 text-xs",
                                getStatusClassName(order.status),
                              )}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                            <div>
                              <OrderStatusSelect
                                orderId={order.id}
                                storeId={store.id}
                                currentStatus={order.status}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="pe-6 py-4">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                          >
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/30 bg-background px-5 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                الصفحة{" "}
                <span className="font-bold text-foreground">{currentPage}</span>{" "}
                من{" "}
                <span className="font-bold text-foreground">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  className="rounded-xl"
                >
                  <Link
                    href={
                      currentPage > 1
                        ? `/dashboard/orders?page=${currentPage - 1}`
                        : "#"
                    }
                  >
                    <ChevronRight className="ml-1 size-4" />
                    السابق
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    const isActive = page === currentPage;
                    return (
                      <Button
                        key={page}
                        asChild
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 rounded-xl p-0"
                      >
                        <Link href={`/dashboard/orders?page=${page}`}>
                          {page}
                        </Link>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  className="rounded-xl"
                >
                  <Link
                    href={
                      currentPage < totalPages
                        ? `/dashboard/orders?page=${currentPage + 1}`
                        : "#"
                    }
                  >
                    التالي
                    <ChevronLeft className="mr-1 size-4" />
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

export default OrdersRoute;
