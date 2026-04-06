import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, RefreshCcw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";

import {
  BalanceTransactionType,
  SubscriptionStatus,
  TopupRequestStatus,
} from "@/lib/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ✅ ADMIN ACTIONS ONLY
import {
  adminTopUpStoreBalanceAction,
  adminAdjustStoreBalanceAction,
  adminActivateStoreSubscriptionAction,
  adminRefreshStoreSubscriptionStatusAction,
  adminCancelStoreSubscriptionAction,
  adminResumeStoreSubscriptionAutoRenewAction,
  adminRenewStoreSubscriptionAction,
} from "@/actions/admin/admin-store.actions";

type PageProps = {
  params: Promise<{
    storeSlug: string;
  }>;
};

// ===== helpers =====
function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSubscriptionStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "نشط";
    case SubscriptionStatus.GRACE_PERIOD:
      return "فترة سماح";
    case SubscriptionStatus.PAST_DUE:
      return "متأخر";
    case SubscriptionStatus.CANCELED:
      return "ملغي";
    case SubscriptionStatus.INACTIVE:
    default:
      return "غير مفعل";
  }
}

function getSubscriptionStatusClass(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "bg-emerald-500/10 text-emerald-700";
    case SubscriptionStatus.GRACE_PERIOD:
      return "bg-amber-500/10 text-amber-700";
    case SubscriptionStatus.PAST_DUE:
      return "bg-rose-500/10 text-rose-700";
    case SubscriptionStatus.CANCELED:
      return "bg-zinc-500/10 text-zinc-700";
    default:
      return "bg-primary/10 text-primary";
  }
}

function getTransactionLabel(type: BalanceTransactionType) {
  switch (type) {
    case BalanceTransactionType.TOPUP:
      return "شحن";
    case BalanceTransactionType.SUBSCRIPTION_CHARGE:
      return "اشتراك";
    case BalanceTransactionType.MANUAL_ADJUSTMENT:
      return "تعديل";
    case BalanceTransactionType.REFUND:
      return "استرجاع";
    case BalanceTransactionType.BONUS:
      return "بونص";
    default:
      return type;
  }
}

function getTransactionStyles(type: BalanceTransactionType) {
  switch (type) {
    case BalanceTransactionType.TOPUP:
      return {
        icon: ArrowDownLeft,
        color: "text-emerald-600",
      };
    case BalanceTransactionType.SUBSCRIPTION_CHARGE:
      return {
        icon: ArrowUpRight,
        color: "text-rose-600",
      };
    default:
      return {
        icon: RefreshCcw,
        color: "text-amber-600",
      };
  }
}

function getTopupStatusLabel(status: TopupRequestStatus) {
  switch (status) {
    case TopupRequestStatus.APPROVED:
      return "تمت الموافقة";
    case TopupRequestStatus.REJECTED:
      return "مرفوض";
    default:
      return "معلق";
  }
}

// ===== PAGE =====
export default async function AdminStoreDetailsPage({ params }: PageProps) {
  await requireAdmin();

  const { storeSlug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      monthlyPrice: true,
      autoRenew: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      createdAt: true,
      user: true,
      balanceTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      topupRequests: {
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  if (!store) return notFound();

  const enoughForRenewal = store.balance >= store.monthlyPrice;

  return (
    <div className="space-y-6" dir="rtl">
      {/* HEADER */}
      <div className="rounded-2xl border p-6">
        <h1 className="text-3xl font-bold">{store.name}</h1>
        <p className="text-sm text-muted-foreground">{store.user.email}</p>
        <p className="text-sm text-muted-foreground">Slug: {store.slug}</p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>الرصيد</CardDescription>
            <CardTitle>{formatPrice(store.balance)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>الاشتراك</CardDescription>
            <CardTitle>
              {getSubscriptionStatusLabel(store.subscriptionStatus)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>ينتهي في</CardDescription>
            <CardTitle>{formatDate(store.subscriptionEndsAt)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* TOPUP */}
          <form
            action={async (formData) => {
              "use server";

              await adminTopUpStoreBalanceAction({
                storeId: store.id,
                amount: Number(formData.get("amount")),
                note: formData.get("note")?.toString(),
              });
            }}
            className="flex gap-2"
          >
            <input
              name="amount"
              placeholder="amount"
              className="border p-2 rounded"
            />
            <Button>شحن</Button>
          </form>

          {/* ADJUST */}
          <form
            action={async (formData) => {
              "use server";

              await adminAdjustStoreBalanceAction({
                storeId: store.id,
                amount: Number(formData.get("amount")),
                note: formData.get("note")?.toString(),
              });
            }}
            className="flex gap-2"
          >
            <input
              name="amount"
              placeholder="+ أو -"
              className="border p-2 rounded"
            />
            <Button variant="outline">تعديل</Button>
          </form>

          {/* BUTTONS */}
          <div className="grid grid-cols-2 gap-2">
            <form
              action={async () => {
                "use server";
                await adminActivateStoreSubscriptionAction(store.id);
              }}
            >
              <Button className="w-full">تفعيل</Button>
            </form>

            <form
              action={async () => {
                "use server";
                await adminRenewStoreSubscriptionAction(store.id);
              }}
            >
              <Button className="w-full">تجديد</Button>
            </form>

            <form
              action={async () => {
                "use server";
                await adminRefreshStoreSubscriptionStatusAction(store.id);
              }}
            >
              <Button variant="outline" className="w-full">
                تحديث
              </Button>
            </form>

            {store.autoRenew ? (
              <form
                action={async () => {
                  "use server";
                  await adminCancelStoreSubscriptionAction(store.id);
                }}
              >
                <Button variant="destructive" className="w-full">
                  إلغاء
                </Button>
              </form>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await adminResumeStoreSubscriptionAutoRenewAction(store.id);
                }}
              >
                <Button variant="outline" className="w-full">
                  تفعيل Auto
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TRANSACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>الحركات</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {store.balanceTransactions.map((t) => {
            const config = getTransactionStyles(t.type);
            const Icon = config.icon;

            return (
              <div
                key={t.id}
                className="border p-3 rounded flex items-center gap-2"
              >
                <Icon className={config.color} />
                {getTransactionLabel(t.type)} - {formatPrice(t.amount)}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* TOPUP REQUESTS */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الشحن</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {store.topupRequests.map((r) => (
            <div key={r.id} className="border p-3 rounded">
              {getTopupStatusLabel(r.status)} - {formatPrice(r.amount)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
