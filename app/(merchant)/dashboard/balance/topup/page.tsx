import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Wallet,
  Landmark,
  Smartphone,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TOPUP_METHODS } from "@/constants/topup";
import BalanceTopupForm from "@/app/(merchant)/_components/BalanceTopupForm";
import { requireUserId } from "@/actions/auth/require-user-id.actions";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function getMethodIcon(method: string) {
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
      <div className="min-h-[calc(100vh-120px)] p-4 md:p-6" dir="rtl">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">لا يوجد متجر بعد</h1>
              <p className="text-sm text-muted-foreground">
                لازم يكون عندك متجر أولًا عشان تقدر تبعت طلب شحن رصيد.
              </p>
            </div>

            <Button asChild className="rounded-lg">
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

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background p-4 md:p-6" dir="rtl">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/50 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                شحن الرصيد
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                {store.name}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">
              طلب شحن رصيد جديد
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              اختار طريقة الدفع، اكتب المبلغ، وابعت بيانات التحويل. بعد المراجعة
              هيتم إضافة الرصيد لمحفظة متجرك.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="min-w-45 border-border/60 shadow-none">
              <CardContent className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  الرصيد الحالي
                </p>
                <p className="text-xl font-bold">{formatPrice(store.balance)}</p>
              </CardContent>
            </Card>

            <Card className="min-w-45 border-border/60 shadow-none">
              <CardContent className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">
                  الاشتراك الشهري
                </p>
                <p className="text-xl font-bold">
                  {formatPrice(store.monthlyPrice)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <BalanceTopupForm
            storeId={store.id}
            currentBalance={store.balance}
            monthlyPrice={store.monthlyPrice}
          />

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">طرق الشحن المتاحة</CardTitle>
                <CardDescription>
                  استخدم واحدة من الطرق دي، وبعد التحويل ابعت رقم العملية أو
                  ملاحظة توضح التحويل.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {TOPUP_METHODS.map((item) => {
                  const Icon = getMethodIcon(item.value);

                  return (
                    <div
                      key={item.value}
                      className="rounded-lg border border-border/60 bg-muted/30 p-4"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
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
                  آخر الطلبات اللي اتبعتت من متجرك.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {store.topupRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-6 text-center">
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
                        className="rounded-lg border border-border/60 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="font-semibold">
                            {formatPrice(request.amount)}
                          </p>

                          <Badge
                            className={
                              request.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                                : request.status === "REJECTED"
                                  ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
                                  : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                            }
                          >
                            {request.status === "APPROVED"
                              ? "تمت الموافقة"
                              : request.status === "REJECTED"
                                ? "مرفوض"
                                : "قيد المراجعة"}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>الطريقة: {request.method}</p>
                          <p>
                            التاريخ:{" "}
                            {new Intl.DateTimeFormat("ar-EG", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(request.createdAt)}
                          </p>
                          <p>رقم التحويل: {request.transferRef || "—"}</p>
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