import Link from "next/link";
import Image from "next/image";
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
  CircleDollarSign,
  Hash,
  ShoppingCart,
  Truck,
  Tag,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { Metadata } from "next";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import DashboardSectionHeader from "@/app/(merchant)/_components/main/DashboardSectionHeader";
import ExportInvoiceButton from "@/app/(merchant)/dashboard/orders/_components/export-invoice-button";
import { OrderStatusSelect } from "@/app/(merchant)/dashboard/orders/_components/order-status-select";

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
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusConfig(status: OrderStatus) {
  const config: Record<
    OrderStatus,
    { label: string; className: string; dot: string }
  > = {
    PENDING: {
      label: "معلق",
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    PAID: {
      label: "مدفوع",
      className:
        "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      dot: "bg-sky-500",
    },
    SHIPPED: {
      label: "تم الشحن",
      className:
        "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      dot: "bg-violet-500",
    },
    DELIVERED: {
      label: "تم التوصيل",
      className:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    CANCELED: {
      label: "ملغي",
      className:
        "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      dot: "bg-rose-500",
    },
  };
  return config[status];
}

function getPaymentMethodLabel(method: string) {
  const map: Record<string, string> = {
    cash_on_delivery: "الدفع عند الاستلام",
    instapay: "إنستاباي",
    vodafone_cash: "فودافون كاش",
    bank_transfer: "تحويل بنكي",
  };
  return map[method] ?? method;
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    include: {
      store: { select: { id: true, name: true, slug: true } },
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

  if (!order) notFound();

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <DashboardSectionHeader
        icon={ShoppingCart}
        title={`طلب #${order.id.slice(0, 8).toUpperCase()}`}
        description={`مُقدَّم بتاريخ ${formatDate(order.createdAt)}`}
      />

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              statusConfig.dot,
            )}
          />
          <span className="text-sm font-medium">{statusConfig.label}</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <OrderStatusSelect
            orderId={order.id}
            storeId={store.id}
            currentStatus={order.status}
          />
        </div>

        <div className="flex items-center gap-2">
          <ExportInvoiceButton
            order={{
              id: order.id,
              createdAt: order.createdAt,
              fullName: order.fullName,
              phone: order.phone,
              address: order.address,
              paymentMethod: order.paymentMethod,
              subtotal: order.subtotal,
              shipping: order.shipping,
              total: order.total,
              status: order.status,
              store: { name: order.store.name, slug: order.store.slug },
              items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                product: { name: item.product.name, slug: item.product.slug },
              })),
            }}
          />
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/orders">
              <ArrowRight className="me-1.5 size-4" />
              الطلبات
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "رقم الطلب",
            value: `#${order.id.slice(0, 8).toUpperCase()}`,
            icon: Hash,
            accent: "bg-primary/10 text-primary",
          },
          {
            label: "حالة الطلب",
            value: statusConfig.label,
            icon: ShoppingBag,
            accent: cn("border", statusConfig.className),
            isStatus: true,
          },
          {
            label: "طريقة الدفع",
            value: getPaymentMethodLabel(order.paymentMethod),
            icon: CreditCard,
            accent: "bg-primary/10 text-primary",
          },
          {
            label: "إجمالي الطلب",
            value: formatPrice(order.total),
            icon: CircleDollarSign,
            accent: "bg-primary/10 text-primary",
            highlight: true,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-xl shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    card.isStatus ? card.accent : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm font-bold",
                      card.highlight && "text-primary",
                    )}
                  >
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customer + Order meta */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Customer info */}
        <Card className="rounded-xl shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </span>
              بيانات العميل
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">الاسم الكامل</p>
                  <p className="truncate font-semibold">{order.fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  <p className="truncate font-semibold" dir="ltr">
                    {order.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">عنوان التوصيل</p>
                <p className="mt-0.5 font-semibold leading-relaxed">
                  {order.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order meta */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="size-4" />
              </span>
              تفاصيل الطلب
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {[
              {
                icon: ShoppingBag,
                label: "المتجر",
                value: order.store.name,
              },
              {
                icon: CalendarDays,
                label: "تاريخ الطلب",
                value: formatDate(order.createdAt),
              },
              {
                icon: CreditCard,
                label: "طريقة الدفع",
                value: getPaymentMethodLabel(order.paymentMethod),
              },
              {
                icon: Package,
                label: "عدد المنتجات",
                value: `${order.items.length} ${order.items.length === 1 ? "منتج" : "منتجات"}`,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="truncate text-sm font-semibold">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}

            {order.couponCode && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  <Tag className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">كوبون خصم</p>
                  <p className="truncate font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {order.couponCode}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </span>
            منتجات الطلب
            <Badge variant="secondary" className="ms-auto rounded-lg text-xs">
              {order.items.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {order.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              لا توجد منتجات داخل هذا الطلب
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
                >
                  {/* Product image */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {item.product.name}
                    </p>
                    {item.selectedFeatures &&
                      Object.keys(
                        item.selectedFeatures as Record<string, string>,
                      ).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(
                            item.selectedFeatures as Record<string, string>,
                          ).map(([key, val]) => (
                            <span
                              key={key}
                              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {key === "size"
                                ? "المقاس"
                                : key === "color"
                                  ? "اللون"
                                  : key}
                              : {val}
                            </span>
                          ))}
                        </div>
                      )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Line total */}
                  <div className="shrink-0 rounded-xl bg-primary/10 px-3.5 py-2 text-center">
                    <p className="text-[11px] text-muted-foreground">
                      الإجمالي
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial summary */}
      <div className="flex justify-end">
        <Card className="w-full rounded-xl shadow-sm xl:max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-4" />
              </span>
              الملخص المالي
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                المجموع الفرعي
              </span>
              <span className="font-semibold">{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">رسوم الشحن</span>
              <span className="font-semibold">{formatPrice(order.shipping)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                  <Tag className="size-3.5" />
                  خصم
                  {order.couponCode && (
                    <span className="font-mono text-xs">
                      ({order.couponCode})
                    </span>
                  )}
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  -{formatPrice(order.discount)}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
              <span className="font-bold">الإجمالي النهائي</span>
              <span className="text-xl font-extrabold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
