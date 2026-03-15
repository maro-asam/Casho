import { requireAuth } from "@/actions/auth/require.actions";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Clock3, Package, ShoppingCart, Wallet } from "lucide-react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

const DashboardStats = async () => {
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              لم يتم العثور على متجر
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenueResult = await prisma.order.aggregate({
    where: {
      storeId: store.id,
      status: {
        in: ["PAID", "SHIPPED", "DELIVERED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  const totalRevenue = revenueResult._sum.total ?? 0;

  const totalProducts = store.products.length;

  const totalOrders = await prisma.order.count({
    where: {
      storeId: store.id,
    },
  });

  const pendingOrders = await prisma.order.count({
    where: {
      storeId: store.id,
      status: "PENDING",
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Revenue */}
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">الأرباح</p>
            <h2 className="mt-2 text-2xl font-bold">
              {formatPrice(totalRevenue)}
            </h2>
          </div>

          <div className="rounded-xl bg-green-500/10 p-3 text-green-600">
            <Wallet className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            <h2 className="mt-2 text-2xl font-bold">{totalOrders}</h2>
          </div>

          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
            <ShoppingCart className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">الطلبات المعلقة</p>
            <h2 className="mt-2 text-2xl font-bold">{pendingOrders}</h2>
          </div>

          <div className="rounded-xl bg-yellow-500/10 p-3 text-yellow-600">
            <Clock3 className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="rounded-2xl">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">المنتجات</p>
            <h2 className="mt-2 text-2xl font-bold">{totalProducts}</h2>
          </div>

          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Package className="size-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
