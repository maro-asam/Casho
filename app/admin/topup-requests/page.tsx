import Link from "next/link";
import { CheckCircle2, Clock3, Eye, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  TopupMethod,
  TopupRequestStatus,
} from "@/lib/generated/prisma/enums";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import {
  approveTopupRequestAction,
  rejectTopupRequestAction,
} from "@/actions/admin/admin-topup.actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: TopupRequestStatus) {
  switch (status) {
    case TopupRequestStatus.APPROVED:
      return "تمت الموافقة";
    case TopupRequestStatus.REJECTED:
      return "مرفوض";
    case TopupRequestStatus.PENDING:
    default:
      return "معلق";
  }
}

function getStatusClass(status: TopupRequestStatus) {
  switch (status) {
    case TopupRequestStatus.APPROVED:
      return "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400";
    case TopupRequestStatus.REJECTED:
      return "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400";
    case TopupRequestStatus.PENDING:
    default:
      return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400";
  }
}

function getMethodLabel(method: TopupMethod) {
  switch (method) {
    case TopupMethod.VODAFONE_CASH:
      return "فودافون كاش";
    case TopupMethod.INSTAPAY:
      return "إنستا باي";
    case TopupMethod.BANK_TRANSFER:
      return "تحويل بنكي";
    default:
      return method;
  }
}

export default async function AdminTopupRequestsPage() {
  await requireAdmin();

  const requests = await prisma.topupRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      note: true,
      transferRef: true,
      receiptImage: true,
      createdAt: true,
      storeId: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          balance: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  const pendingCount = requests.filter(
    (item) => item.status === TopupRequestStatus.PENDING,
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === TopupRequestStatus.APPROVED,
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === TopupRequestStatus.REJECTED,
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">طلبات الشحن</h1>
        <p className="text-sm text-muted-foreground">
          راجع طلبات شحن التجار واعتمد أو ارفض الطلبات من مكان واحد.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>طلبات معلقة</CardDescription>
              <CardTitle className="text-2xl">{pendingCount}</CardTitle>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock3 className="size-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>تمت الموافقة</CardDescription>
              <CardTitle className="text-2xl">{approvedCount}</CardTitle>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>مرفوضة</CardDescription>
              <CardTitle className="text-2xl">{rejectedCount}</CardTitle>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <XCircle className="size-5" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>كل الطلبات</CardTitle>
          <CardDescription>
            أحدث طلبات الشحن من المتاجر على المنصة.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد طلبات شحن حتى الآن.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const isPending =
                  request.status === TopupRequestStatus.PENDING;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-border/60 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`rounded-full px-3 py-1 ${getStatusClass(
                              request.status,
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </Badge>

                          <Badge variant="outline" className="rounded-full">
                            {getMethodLabel(request.method)}
                          </Badge>

                          <Badge variant="secondary" className="rounded-full">
                            {formatPrice(request.amount)}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">
                            {request.store.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.store.user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            الرصيد الحالي: {formatPrice(request.store.balance)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            تاريخ الطلب: {formatDate(request.createdAt)}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="mb-1 text-xs text-muted-foreground">
                              رقم التحويل / المرجع
                            </p>
                            <p className="text-sm font-medium">
                              {request.transferRef || "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="mb-1 text-xs text-muted-foreground">
                              ملاحظة التاجر
                            </p>
                            <p className="text-sm font-medium">
                              {request.note || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-55">
                        <Button asChild variant="outline" className="rounded-2xl">
                          <Link href={`/admin/stores/${request.store.slug}`}>
                            <Eye className="ms-2 size-4" />
                            عرض المتجر
                          </Link>
                        </Button>

                        {request.receiptImage && (
                          <Button asChild variant="outline" className="rounded-2xl">
                            <a
                              href={request.receiptImage}
                              target="_blank"
                              rel="noreferrer"
                            >
                              عرض الإيصال
                            </a>
                          </Button>
                        )}

                        {isPending && (
                          <>
                            <form
                              action={async () => {
                                "use server";
                                await approveTopupRequestAction(request.id);
                              }}
                            >
                              <Button className="w-full rounded-2xl">
                                <CheckCircle2 className="ms-2 size-4" />
                                اعتماد الطلب
                              </Button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await rejectTopupRequestAction(request.id);
                              }}
                            >
                              <Button
                                variant="destructive"
                                className="w-full rounded-2xl"
                              >
                                <XCircle className="ms-2 size-4" />
                                رفض الطلب
                              </Button>
                            </form>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}