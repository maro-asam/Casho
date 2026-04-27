import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  CreditCard,
  Landmark,
  MapPinHouse,
  Package,
  Phone,
  Receipt,
  Smartphone,
  Store,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import { MustSession } from "@/actions/auth/auth-helpers.actions";
import { prisma } from "@/lib/prisma";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

function formatEGPFromCents(cents: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function getStatusMeta(status?: string | null) {
  const normalized = status?.toLowerCase();

  switch (normalized) {
    case "pending":
      return {
        label: "قيد المراجعة",
        badgeClass:
          "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
        currentStep: 2,
      };

    case "processing":
      return {
        label: "جاري التجهيز",
        badgeClass:
          "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10",
        currentStep: 3,
      };

    case "shipped":
      return {
        label: "تم الشحن",
        badgeClass:
          "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/10",
        currentStep: 4,
      };

    case "delivered":
      return {
        label: "تم التسليم",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
        currentStep: 4,
      };

    case "paid":
    case "confirmed":
      return {
        label: "تم تأكيد الطلب",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
        currentStep: 2,
      };

    default:
      return {
        label: "تم استلام الطلب",
        badgeClass:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
        currentStep: 1,
      };
  }
}

function getPaymentMethodLabel(method?: string | null) {
  switch (method) {
    case "cash_on_delivery":
      return "الدفع عند الاستلام";
    case "vodafone_cash":
      return "فودافون كاش";
    case "instapay":
      return "InstaPay";
    case "bank_transfer":
      return "تحويل بنكي";
    case "kashier":
      return "Kashier";
    default:
      return method || "غير محدد";
  }
}

function getPaymentStatusLabel(status?: string | null) {
  const normalized = status?.toLowerCase();

  switch (normalized) {
    case "paid":
    case "success":
    case "successful":
      return {
        label: "مدفوع",
        className:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };

    case "failed":
    case "cancelled":
    case "canceled":
      return {
        label: "فشل الدفع",
        className: "bg-red-500/10 text-red-600 border-red-500/20",
      };

    case "pending":
    default:
      return {
        label: "بانتظار الدفع",
        className:
          "bg-amber-500/10 text-amber-600 border-amber-500/20",
      };
  }
}

function getPaymentBanner(payment?: string) {
  switch (payment) {
    case "success":
      return {
        title: "تم الدفع بنجاح",
        description: "تم تأكيد عملية الدفع وتسجيلها على الطلب.",
        icon: CheckCircle2,
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
      };

    case "failed":
      return {
        title: "لم تكتمل عملية الدفع",
        description:
          "لم يتم تأكيد الدفع. يمكنك التواصل مع المتجر أو المحاولة مرة أخرى.",
        icon: XCircle,
        className: "border-red-500/20 bg-red-500/10 text-red-700",
      };

    case "invalid":
      return {
        title: "تعذر التحقق من الدفع",
        description:
          "وصلنا رد من بوابة الدفع، لكن لم نتمكن من التحقق منه بشكل آمن.",
        icon: AlertTriangle,
        className: "border-amber-500/20 bg-amber-500/10 text-amber-700",
      };

    default:
      return null;
  }
}

type ManualPaymentSettings = {
  vodafoneCashNumber?: string | null;
  instapayAddress?: string | null;
  bankTransferDetails?: string | null;
} | null;

function manualInstructionFor(
  method?: string | null,
  settings?: ManualPaymentSettings,
) {
  switch (method) {
    case "vodafone_cash":
      return settings?.vodafoneCashNumber
        ? {
            title: "حول على فودافون كاش",
            description: "بعد التحويل احتفظ بصورة الإيصال للتواصل مع المتجر.",
            value: settings.vodafoneCashNumber,
            icon: Smartphone,
          }
        : null;

    case "instapay":
      return settings?.instapayAddress
        ? {
            title: "حول عن طريق InstaPay",
            description: "استخدم بيانات InstaPay التالية لإتمام التحويل.",
            value: settings.instapayAddress,
            icon: Building2,
          }
        : null;

    case "bank_transfer":
      return settings?.bankTransferDetails
        ? {
            title: "بيانات التحويل البنكي",
            description:
              "استخدم بيانات الحساب التالية، ثم تواصل مع المتجر بصورة التحويل.",
            value: settings.bankTransferDetails,
            icon: Landmark,
          }
        : null;

    case "cash_on_delivery":
      return {
        title: "الدفع عند الاستلام",
        description: "هتدفع قيمة الطلب لمندوب الشحن عند الاستلام.",
        value: null,
        icon: Banknote,
      };

    default:
      return null;
  }
}

function ManualPaymentInstructions({
  paymentMethod,
  settings,
}: {
  paymentMethod?: string | null;
  settings?: ManualPaymentSettings;
}) {
  const instruction = manualInstructionFor(paymentMethod, settings);

  if (!instruction) return null;

  const Icon = instruction.icon;

  return (
    <Card className="rounded-[28px] border-primary/20 bg-primary/5 text-right">
      <CardHeader>
        <CardTitle className="flex items-center justify-end gap-2 text-lg">
          {instruction.title}
          <Icon className="size-5 text-primary" />
        </CardTitle>
        <CardDescription>{instruction.description}</CardDescription>
      </CardHeader>

      {instruction.value ? (
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-xl border bg-background p-4 text-sm leading-7">
            {instruction.value}
          </pre>
        </CardContent>
      ) : null}
    </Card>
  );
}

const ORDER_STEPS = ["تم الطلب", "قيد المراجعة", "جاري التجهيز", "تم التسليم"];

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams?: Promise<{ payment?: string }>;
}) {
  const { slug, orderId } = await params;
  const query = searchParams ? await searchParams : {};
  const paymentBanner = getPaymentBanner(query.payment);

  const { guestSessionId } = await MustSession();

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      guestSessionId,
      store: { slug },
    },
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
      store: {
        select: {
          name: true,
          storePaymentSettings: {
            select: {
              vodafoneCashNumber: true,
              instapayAddress: true,
              bankTransferDetails: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="wrapper py-16" dir="rtl">
        <Card className="mx-auto max-w-xl rounded-xl border-dashed">
          <CardContent className="flex min-h-70 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl bg-muted">
              <Package className="size-7 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">لم يتم العثور على الطلب</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                يبدو أن الطلب غير موجود أو لا تملك صلاحية عرض تفاصيله.
              </p>
            </div>

            <Button asChild className="rounded-xl">
              <Link href={`/store/${slug}`}>العودة إلى المتجر</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = getStatusMeta(order.status);
  const paymentStatusMeta = getPaymentStatusLabel(order.paymentStatus);

  return (
    <div className="wrapper py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        {paymentBanner ? (
          <Card className={cn("rounded-[28px] border", paymentBanner.className)}>
            <CardContent className="flex items-start gap-4 p-5 text-right">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/70">
                <paymentBanner.icon className="size-6" />
              </div>

              <div className="space-y-1">
                <h2 className="font-semibold">{paymentBanner.title}</h2>
                <p className="text-sm leading-6 opacity-90">
                  {paymentBanner.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden rounded-[28px] border-0 bg-linear-to-br from-primary/10 via-background to-background shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <CheckCircle2 className="size-7" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                        {statusMeta.label}
                      </h1>

                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-xl px-3 py-1",
                          statusMeta.badgeClass,
                        )}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                      تم استلام طلبك بنجاح، وهيتم التواصل معاك قريبًا لتأكيد
                      التفاصيل ومتابعة التجهيز أو الشحن.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:min-w-75 md:grid-cols-1">
                  <div className="rounded-xl border bg-background/80 p-4 backdrop-blur">
                    <p className="mb-1 text-sm text-muted-foreground">
                      رقم الطلب
                    </p>
                    <p className="font-mono text-sm break-all">{order.id}</p>
                  </div>

                  <div className="rounded-xl border bg-background/80 p-4 backdrop-blur">
                    <p className="mb-1 text-sm text-muted-foreground">
                      تاريخ الطلب
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-background/70 p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-4">
                  {ORDER_STEPS.map((step, index) => {
                    const stepNumber = index + 1;
                    const isDone = stepNumber <= statusMeta.currentStep;
                    const isCurrent = stepNumber === statusMeta.currentStep;

                    return (
                      <div key={step} className="relative">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                              isDone
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/20 bg-muted text-muted-foreground",
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <CircleDashed className="size-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isCurrent
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {step}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              المرحلة {stepNumber}
                            </p>
                          </div>
                        </div>

                        {index !== ORDER_STEPS.length - 1 && (
                          <div className="absolute -left-4.5 top-5 hidden h-px w-9 bg-border md:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="size-5 text-primary" />
                  تفاصيل الطلب
                </CardTitle>
                <CardDescription>
                  راجع بيانات الطلب والمنتجات المطلوبة
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="size-4" />
                      المتجر
                    </div>
                    <div className="font-semibold">{order.store.name}</div>
                  </div>

                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="size-4" />
                      عدد المنتجات
                    </div>
                    <div className="font-semibold">{order.items.length}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-base font-semibold">بيانات العميل</h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {order.fullName ? (
                      <div className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <UserRound className="size-4" />
                          الاسم
                        </div>
                        <p className="font-medium">{order.fullName}</p>
                      </div>
                    ) : null}

                    {order.phone ? (
                      <div className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="size-4" />
                          رقم الموبايل
                        </div>
                        <p className="font-medium" dir="ltr">
                          {order.phone}
                        </p>
                      </div>
                    ) : null}

                    {order.address ? (
                      <div className="rounded-xl border p-4 sm:col-span-2">
                        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPinHouse className="size-4" />
                          عنوان التوصيل
                        </div>
                        <p className="font-medium leading-7">
                          {order.address}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-base font-semibold">المنتجات</h3>

                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Package className="size-5" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold md:text-base">
                            {it.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground md:text-sm">
                            الكمية: {it.quantity} ×{" "}
                            {formatEGPFromCents(it.price)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-left">
                        <p className="text-sm text-muted-foreground">
                          الإجمالي
                        </p>
                        <p className="text-sm font-semibold md:text-base">
                          {formatEGPFromCents(it.quantity * it.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <ManualPaymentInstructions
              paymentMethod={order.paymentMethod}
              settings={order.store.storePaymentSettings}
            />

            <Card className="rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">ملخص الدفع</CardTitle>
                <CardDescription>نظرة سريعة على قيمة الطلب</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="size-4" />
                    طريقة الدفع
                  </div>
                  <p className="font-semibold">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="size-4" />
                    حالة الدفع
                  </div>

                  <Badge
                    variant="outline"
                    className={cn("rounded-xl", paymentStatusMeta.className)}
                  >
                    {paymentStatusMeta.label}
                  </Badge>
                </div>

                {order.paymentReference ? (
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="mb-1 text-sm text-muted-foreground">
                      مرجع الدفع
                    </div>
                    <p className="break-all font-mono text-xs">
                      {order.paymentReference}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">عدد المنتجات</span>
                    <span className="font-semibold">{order.items.length}</span>
                  </div>
                </div>

                <div className="rounded-xl border bg-primary/5 p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    الإجمالي النهائي
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {formatEGPFromCents(order.total)}
                  </div>
                </div>

                <div className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                  احتفظ برقم الطلب لمتابعة الحالة بسهولة عند التواصل مع المتجر.
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button asChild className="h-11 rounded-xl">
                    <Link href={`/store/${slug}`}>العودة إلى المتجر</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl bg-transparent"
                  >
                    <Link
                      href={`/store/${slug}`}
                      className="flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="size-4" />
                      متابعة التسوق
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}