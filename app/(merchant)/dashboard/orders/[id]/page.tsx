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
  Receipt,
  CircleDollarSign,
  Hash,
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

function getStatusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
    case "PAID":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "SHIPPED":
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100";
    case "CANCELED":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    default:
      return "bg-muted text-muted-foreground border-border hover:bg-muted";
  }
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
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-22xl border bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Receipt className="h-5 w-5" />
            <span className="text-sm font-semibold">إدارة الطلبات</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            تفاصيل الطلب
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            عرض كامل لبيانات الطلب والعميل والمنتجات مع ملخص مالي واضح وسريع.
          </p>
        </div>

        <Button asChild variant="outline" className="w-fit rounded-xl">
          <Link href="/dashboard/orders" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            رجوع للطلبات
          </Link>
        </Button>
      </div>

      {/* Top Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-22xl border-primary/15 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Hash className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="mt-2 text-lg font-bold ">
              #{order.id.slice(0, 8)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-22xl border-primary/15 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">حالة الطلب</p>
            <div className="mt-2">
              <Badge className={`${getStatusBadgeClass(order.status)} p-3`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-22xl border-primary/15 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">طريقة الدفع</p>
            <p className="mt-2 text-lg font-bold text-foreground">
              {getPaymentMethodLabel(order.paymentMethod)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-22xl border-primary/15 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">إجمالي الطلب</p>
            <p className="mt-2 text-lg font-bold ">
              {formatPrice(order.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Customer Info */}
        <Card className="rounded-22xl shadow-sm xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              بيانات العميل
            </CardTitle>
            <CardDescription>
              المعلومات الأساسية الخاصة بصاحب الطلب
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-22xl border bg-primary/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-semibold text-foreground">
                    {order.fullName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-22xl border bg-primary/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-semibold text-foreground">{order.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-22xl border bg-primary/5 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-semibold leading-relaxed text-foreground">
                  {order.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Meta */}
        <Card className="rounded-22xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-primary" />
              معلومات إضافية
            </CardTitle>
            <CardDescription>بيانات مرتبطة بالطلب نفسه</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-22xl border p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-sm font-medium">المتجر</span>
              </div>
              <p className="font-semibold">{order.store.name}</p>
            </div>

            <div className="rounded-22xl border p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">تاريخ الطلب</span>
              </div>
              <p className="font-semibold leading-6">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="rounded-22xl border p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">طريقة الدفع</span>
              </div>
              <p className="font-semibold">
                {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            </div>

            <div className="rounded-22xl border p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">عدد المنتجات</span>
              </div>
              <p className="font-semibold text-primary">{order.items.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card className="rounded-22xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5 text-primary" />
            منتجات الطلب
          </CardTitle>
          <CardDescription>كل المنتجات الموجودة داخل هذا الطلب</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {order.items.length === 0 ? (
            <div className="rounded-22xl border border-dashed p-8 text-center text-muted-foreground">
              لا توجد منتجات داخل هذا الطلب
            </div>
          ) : (
            order.items.map((item, index) => {
              const itemTotal = item.price * item.quantity;

              return (
                <div key={item.id}>
                  <div className="flex flex-col gap-4 rounded-22xl border p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-foreground">
                        {item.product.name}
                      </h3>

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>الكمية: {item.quantity}</span>
                        <span>•</span>
                        <span>سعر القطعة: {formatPrice(item.price)}</span>
                      </div>

                      <p className="text-xs text-primary">
                        {item.product.slug}
                      </p>
                    </div>

                    <div className="rounded-xl bg-primary/5 px-4 py-3 text-right">
                      <p className="text-sm text-muted-foreground">الإجمالي</p>
                      <p className="text-lg font-bold text-primary">
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
      <Card className="rounded-22xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            الملخص المالي
          </CardTitle>
          <CardDescription>تفاصيل الحساب النهائي للطلب</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-22xl border p-4">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-semibold text-foreground">
              {formatPrice(order.subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-22xl border p-4">
            <span className="text-muted-foreground">الشحن</span>
            <span className="font-semibold text-foreground">
              {formatPrice(order.shipping)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-22xl border border-primary/20 bg-primary/5 p-4">
            <span className="text-base font-bold text-foreground">
              الإجمالي النهائي
            </span>
            <span className="text-lg font-extrabold text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
