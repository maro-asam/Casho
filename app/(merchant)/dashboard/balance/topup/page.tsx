import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowRight,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { TOPUP_METHODS } from "@/constants/topup";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BalanceTopupForm from "@/app/(merchant)/dashboard/balance/_components/BalanceTopupForm";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "شحن الرصيد",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getMethodIcon(method: string): LucideIcon {
  switch (method) {
    case "VODAFONE_CASH":
      return Smartphone;
    case "INSTAPAY":
      return Wallet;
    case "BANK_TRANSFER":
      return Landmark;
    default:
      return CreditCard;
  }
}

function getMethodLabel(method: string) {
  switch (method) {
    case "VODAFONE_CASH":
      return "فودافون كاش";
    case "INSTAPAY":
      return "إنستاباي";
    case "BANK_TRANSFER":
      return "تحويل بنكي";
    default:
      return "طريقة أخرى";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "تمت الموافقة";
    case "REJECTED":
      return "مرفوض";
    default:
      return "قيد المراجعة";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400";
    case "REJECTED":
      return "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400";
    default:
      return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400";
  }
}

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  highlighted?: boolean;
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  highlighted = false,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-border/60 shadow-sm",
        highlighted && "border-primary/20 bg-primary/5",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary",
              iconClassName,
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function BalanceTopupRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      balance: true,
      monthlyPrice: true,
      topupRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          transferRef: true,
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="min-h-[calc(100vh-120px)]" dir="rtl">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex min-h-[340px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">لا يوجد متجر بعد</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                لازم يكون عندك متجر أولًا عشان تقدر تبعت طلب شحن رصيد.
              </p>
            </div>

            <Button asChild className="rounded-xl">
              <Link href="/dashboard">
                <ArrowRight className="ms-2 size-4" />
                الرجوع للداشبورد
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const amountNeededForRenewal = Math.max(store.monthlyPrice - store.balance, 0);
  const enoughForRenewal = store.balance >= store.monthlyPrice;

  return (
    <div className="min-h-[calc(100vh-120px)] p-4 md:p-6" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-xl px-3 py-1">
                  شحن الرصيد
                </Badge>

                <Badge className="rounded-xl bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                  {store.name}
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  أضف رصيد لمتجرك
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  اختار طريقة الدفع، اكتب المبلغ، وابعت بيانات التحويل. بعد
                  المراجعة هيتم إضافة الرصيد لمحفظة متجرك.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/balance">
                <ArrowRight className="ms-2 size-4" />
                الرجوع لإدارة الرصيد
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <StatCard
            title="الرصيد الحالي"
            value={formatPrice(store.balance)}
            description="الرصيد المتاح حاليًا داخل محفظة المتجر."
            icon={Wallet}
            highlighted
          />

          <StatCard
            title="الاشتراك الشهري"
            value={formatPrice(store.monthlyPrice)}
            description="المبلغ المطلوب لتجديد الاشتراك الشهري."
            icon={CreditCard}
          />

          <StatCard
            title={enoughForRenewal ? "الرصيد كافي" : "المبلغ الناقص للتجديد"}
            value={
              enoughForRenewal
                ? "جاهز للتجديد"
                : formatPrice(amountNeededForRenewal)
            }
            description={
              enoughForRenewal
                ? "رصيدك الحالي يكفي لتجديد الاشتراك القادم."
                : "اشحن هذا المبلغ على الأقل لتفادي أي مشكلة وقت التجديد."
            }
            icon={enoughForRenewal ? CheckCircle2 : AlertTriangle}
            iconClassName={
              enoughForRenewal
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">بيانات طلب الشحن</CardTitle>
                <CardDescription>
                  اكتب تفاصيل الطلب بدقة عشان تتم مراجعته بشكل أسرع.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <BalanceTopupForm
                  storeId={store.id}
                  currentBalance={store.balance}
                  monthlyPrice={store.monthlyPrice}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">معلومة سريعة</CardTitle>
                <CardDescription>
                  قبل ما تبعت طلب الشحن، راجع النقطة دي.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-amber-200 bg-amber-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Clock3 className="size-5" />
                    <p className="font-semibold">مراجعة الطلب يدويًا</p>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    بعد إرسال الطلب، هيتم مراجعته أولًا ثم إضافة الرصيد للمحفظة.
                    تأكد من كتابة رقم العملية أو أي ملاحظة تساعد في التحقق من
                    التحويل.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">طرق الشحن المتاحة</CardTitle>
                <CardDescription>
                  اختر الطريقة المناسبة لك، وبعد التحويل ابعت البيانات داخل
                  النموذج.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {TOPUP_METHODS.map((item) => {
                  const Icon = getMethodIcon(item.value);

                  return (
                    <div
                      key={item.value}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {item.instructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">آخر طلبات الشحن</CardTitle>
                <CardDescription>
                  آخر الطلبات المرسلة من متجرك.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {store.topupRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center">
                    <p className="font-medium">لا توجد طلبات شحن بعد</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      أول طلب شحن هتعمله هيظهر هنا.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {store.topupRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-border/60 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-lg font-bold">
                            {formatPrice(request.amount)}
                          </p>

                          <Badge className={cn("rounded-xl", getStatusClass(request.status))}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              الطريقة:
                            </span>{" "}
                            {getMethodLabel(request.method)}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">
                              التاريخ:
                            </span>{" "}
                            {formatDate(request.createdAt)}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">
                              رقم التحويل:
                            </span>{" "}
                            {request.transferRef || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}