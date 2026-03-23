import { requireAuth } from "@/actions/auth/require.actions";
import { ActivateStoreAction } from "@/actions/store/stores.actions";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import DashboardStats from "../_components/main/DashboardStats";
import RecentOrders from "../_components/main/RecentOrders";
import QuickActions from "../_components/main/QuickActions";
import StarterGuideCard from "../_components/main/StarterGuideCard";

const MerchantDashboardRoute = async () => {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      products: {
        select: {
          id: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!store) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="rounded-22xl">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium">لا يوجد متجر حاليًا</p>
            <p className="mt-2 text-sm text-muted-foreground">
              أنشئ متجرك الأول علشان تبدأ البيع
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = store.subscriptionStatus === "active";

  const shouldShowStarterGuide =
    store.products.length === 0 || store.orders.length < 1;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-22xl border bg-background p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              لوحة تحكم <span className="text-primary">{store.name}</span>
            </h1>

            <Badge variant={isActive ? "default" : "destructive"}>
              {isActive ? "نشط" : "غير نشط"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            رابط المتجر: /store/{store.slug}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isActive && (
            <form
              action={async () => {
                "use server";
                await ActivateStoreAction();
              }}
            >
              <Button type="submit" className="rounded-xl">
                تفعيل المتجر
              </Button>
            </form>
          )}

          <Link href={`/store/${store.slug}`} target="_blank">
            <Button variant="default" className="rounded-xl">
              <ExternalLink className="me-2 size-4" />
              زيارة المتجر
            </Button>
          </Link>
        </div>
      </div>

      {/* Starter Guide */}
      {shouldShowStarterGuide && <StarterGuideCard />}

      {/* Stats */}
      <DashboardStats />

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentOrders store={store} />
        <QuickActions />
      </div>
    </div>
  );
};

export default MerchantDashboardRoute;