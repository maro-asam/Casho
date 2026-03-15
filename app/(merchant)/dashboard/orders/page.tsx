import { requireAuth } from "@/actions/auth/require.actions";
import { GetOrdersAction } from "@/actions/store/orders.actions";
import { prisma } from "@/lib/prisma";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import { OrderStatusSelect } from "../../_components/order-status-select";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الطلبات",
};

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

const OrdersRoute = async () => {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return (
      <div className="wrapper py-10" dir="rtl">
        <Card>
          <CardContent className="py-10 text-center">
            لم يتم العثور على متجر
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = await GetOrdersAction(store.id);

  return (
    <div className="wrapper py-10 space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">الطلبات</CardTitle>
          <CardDescription>
            متجر:{" "}
            <span className="font-medium text-foreground">{store.name}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="mb-2 text-lg font-semibold">
              لا توجد طلبات حتى الآن
            </h2>
            <p className="text-sm text-muted-foreground">
              لما العملاء يبدأوا يطلبوا من المتجر، الطلبات هتظهر هنا.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>كل الطلبات</CardTitle>
            <CardDescription>تابع الطلبات وغيّر حالتها من هنا</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الدفع</TableHead>
                    <TableHead className="text-right">المنتجات</TableHead>
                    <TableHead className="text-right">الشحن</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تغيير الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="hover:underline text-primary"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </TableCell>

                      <TableCell>{order.fullName}</TableCell>

                      <TableCell>{order.phone}</TableCell>

                      <TableCell className="min-w-[220px]">
                        {order.address}
                      </TableCell>

                      <TableCell className="text-primary">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </TableCell>

                      <TableCell className="min-w-[240px]">
                        <div className="space-y-1">
                          {order.items.length > 0 ? (
                            order.items.map((item) => (
                              <div
                                key={item.id}
                                className="text-sm text-muted-foreground"
                              >
                                {item.product.name} × {item.quantity}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              لا توجد منتجات
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{formatPrice(order.shipping)}</TableCell>

                      <TableCell className="font-semibold">
                        {formatPrice(order.total)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
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

                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrdersRoute;
