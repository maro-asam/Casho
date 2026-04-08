import Link from "next/link";
import { Metadata } from "next";
import {
  FolderOpen,
  ShoppingCart,
  Store,
  MapPin,
  Phone,
  CreditCard,
  CalendarClock,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { OrderStatusSelect } from "../../_components/order-status-select";
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

export const metadata: Metadata = {
  title: "الطلبات",
};

const PAGE_SIZE = 6;

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(price / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "معلق";
    case "PAID":
      return "مدفوع";
    case "SHIPPED":
      return "تم الشحن";
    case "DELIVERED":
      return "وصل";
    case "CANCELED":
      return "ملغي";
    default:
      return status;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash_on_delivery":
      return "الدفع عند الاستلام";
    case "instapay":
      return "إنستاباي";
    case "vodafone_cash":
      return "فودافون كاش";
    default:
      return method;
  }
}

function getStatusBadgeVariant(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return "default";
    case "CANCELED":
      return "destructive";
    default:
      return "secondary";
  }
}

type OrdersRouteProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
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
        <Card className="rounded-lg border-dashed border-border/60">
          <CardContent className="flex min-h-55 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
              <Store className="size-6 text-muted-foreground" />
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

  const [totalOrders, orders] = await Promise.all([
    prisma.order.count({
      where: {
        storeId: store.id,
      },
    }),
    prisma.order.findMany({
      where: {
        storeId: store.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PAGE_SIZE,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

  return (
    <div className="space-y-6 p-6" dir="rtl">
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

      {orders.length === 0 ? (
        <Card className="rounded-lg border-dashed border-border/60 shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <FolderOpen className="size-7 text-muted-foreground" />
            </div>

            <h2 className="text-xl font-bold">لا توجد طلبات حتى الآن</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              لما العملاء يبدأوا يطلبوا من المتجر، الطلبات هتظهر هنا وتقدر تتابع
              حالتها بسهولة.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-lg shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الدفع</TableHead>
                      <TableHead className="text-right">المنتجات</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تغيير الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-primary hover:underline"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-55 space-y-1">
                            <div className="font-medium">{order.fullName}</div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="size-3.5" />
                              <span>{order.phone}</span>
                            </div>

                            <div className="flex items-start gap-1 text-xs text-muted-foreground">
                              <MapPin className="mt-0.5 size-3.5 shrink-0" />
                              <span className="line-clamp-2">
                                {order.address}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="gap-1 rounded-lg">
                            <CreditCard className="size-3.5" />
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </Badge>
                        </TableCell>

                        <TableCell className="min-w-60">
                          <div className="space-y-1">
                            {order.items.length > 0 ? (
                              order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="text-sm text-muted-foreground max-w-50 truncate"
                                >
                                  {item.product.name} × {item.quantity}
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                لا توجد منتجات
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold">
                          {formatPrice(order.total)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(order.status)}
                            className="rounded-lg"
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <OrderStatusSelect
                            orderId={order.id}
                            storeId={store.id}
                            currentStatus={order.status}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                            <CalendarClock className="size-4" />
                            {formatDate(order.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="rounded-lg"
                          >
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Eye className="ml-1 size-4" />
                              تفاصيل
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
            <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-border/60 bg-background px-4 py-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  className="rounded-lg"
                >
                  <Link
                    href={
                      currentPage > 1
                        ? `/dashboard/orders?page=${currentPage - 1}`
                        : "#"
                    }
                  >
                    <ChevronRight className="size-4 ml-1" />
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
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-9 rounded-lg p-0"
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
                  className="rounded-lg"
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
