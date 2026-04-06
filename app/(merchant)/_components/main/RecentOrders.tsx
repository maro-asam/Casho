import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Prisma } from "@/lib/generated/prisma/client";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "قيد الانتظار";
    case "PAID":
      return "تم الدفع";
    case "SHIPPED":
      return "تم الشحن";
    case "DELIVERED":
      return "تم التسليم";
    case "CANCELED":
      return "ملغي";
    default:
      return status;
  }
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "DELIVERED":
      return "default";
    case "CANCELED":
      return "destructive";
    default:
      return "secondary";
  }
}

type StoreWithRecentOrders = Prisma.StoreGetPayload<{
  include: {
    orders: {
      include: {
        items: {
          select: {
            id: true;
            quantity: true;
          };
        };
      };
    };
  };
}>;

type RecentOrdersProps = {
  store: StoreWithRecentOrders;
};

const RecentOrders = ({ store }: RecentOrdersProps) => {
  return (
    <Card className="rounded-md lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-primary">آخر الطلبات</CardTitle>
        <CardDescription>آخر 5 طلبات دخلت على المتجر</CardDescription>
      </CardHeader>

      <CardContent>
        {store.orders.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            لا توجد طلبات حتى الآن
          </div>
        ) : (
          <div className="space-y-3">
            {store.orders.map((order) => {
              const totalItems = order.items.reduce(
                (acc, item) => acc + item.quantity,
                0,
              );

              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{order.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      عدد المنتجات: {totalItems}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge variant={getStatusVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>

                    <p className="font-bold">{formatPrice(order.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
