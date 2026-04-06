import Link from "next/link";
import { Store, Eye } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(value / 100);
}

function statusLabel(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "نشط";
    case SubscriptionStatus.GRACE_PERIOD:
      return "فترة سماح";
    case SubscriptionStatus.PAST_DUE:
      return "متأخر";
    case SubscriptionStatus.CANCELED:
      return "ملغي";
    default:
      return "غير مفعل";
  }
}

function statusClass(status: SubscriptionStatus) {
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

export default async function AdminStoresPage() {
  await requireAdmin();

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      balance: true,
      subscriptionStatus: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">كل المتاجر</h1>
        <p className="text-sm text-muted-foreground">
          إدارة كل المتاجر في المنصة
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المتاجر</CardTitle>
          <CardDescription>
            قائمة بكل المتاجر المسجلة
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا يوجد متاجر
            </p>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-lg">{store.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {store.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    slug: {store.slug}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(store.subscriptionStatus)}>
                    {statusLabel(store.subscriptionStatus)}
                  </Badge>

                  <Badge variant="secondary">
                    {formatPrice(store.balance)}
                  </Badge>

                  <Button asChild className="rounded-md">
                    <Link href={`/admin/stores/${store.slug}`}>
                      <Eye className="ms-2 size-4" />
                      عرض
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}