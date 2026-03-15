import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";

import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تفاصيل الطلب",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(price / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
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
      return "تم التوصيل";
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

export default async function OrderDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      storeId: store.id,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="wrapper py-10 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
          <p className="text-sm text-muted-foreground">
            عرض كامل لبيانات الطلب والعميل والمنتجات
          </p>
        </div>

        <Button asChild variant="outline" className="w-fit">
          <Link href="/dashboard/orders" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            رجوع للطلبات
          </Link>
        </Button>
      </div>

      {/* Top Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>رقم الطلب</CardDescription>
            <CardTitle className="text-lg">#{order.id.slice(0, 8)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>حالة الطلب</CardDescription>
            <div>
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>طريقة الدفع</CardDescription>
            <CardTitle className="text-lg">
              {getPaymentMethodLabel(order.paymentMethod)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي الطلب</CardDescription>
            <CardTitle className="text-lg">
              {formatPrice(order.total)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
            <CardDescription>
              المعلومات الأساسية الخاصة بصاحب الطلب
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border p-4">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{order.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border p-4">
                <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium leading-relaxed">{order.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Meta */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات إضافية</CardTitle>
            <CardDescription>بيانات مرتبطة بالطلب نفسه</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <ShoppingBag className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المتجر</p>
                <p className="font-medium">{order.store.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4">
              <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                <p className="font-medium">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4">
              <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                <p className="font-medium">{order.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>منتجات الطلب</CardTitle>
          <CardDescription>كل المنتجات الموجودة داخل هذا الطلب</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {order.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              لا توجد منتجات داخل هذا الطلب
            </div>
          ) : (
            order.items.map((item, index) => {
              const itemTotal = item.price * item.quantity;

              return (
                <div key={item.id}>
                  <div className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold">
                        {item.product.name}
                      </h3>

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>الكمية: {item.quantity}</span>
                        <span>•</span>
                        <span>سعر القطعة: {formatPrice(item.price)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">الإجمالي</p>
                      <p className="text-base font-bold">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>
                  </div>

                  {index < order.items.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>الملخص المالي</CardTitle>
          <CardDescription>تفاصيل الحساب النهائي للطلب</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-medium">{formatPrice(order.subtotal)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <span className="text-muted-foreground">الشحن</span>
            <span className="font-medium">{formatPrice(order.shipping)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
            <span className="text-base font-semibold">الإجمالي النهائي</span>
            <span className="text-base font-bold">
              {formatPrice(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
