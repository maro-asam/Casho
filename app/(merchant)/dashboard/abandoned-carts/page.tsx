import { Metadata } from "next";
import {
  ShoppingCart,
  Package,
  FolderOpen,
  Clock,
  TrendingDown,
  Hash,
} from "lucide-react";

import { GetAbandonedCartsAction } from "@/actions/store/abandoned-cart.actions";
import DashboardSectionHeader from "../../_components/main/DashboardSectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الكارتات المتروكة",
};

function formatPrice(piasters: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(piasters / 100);
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);

  if (diffD >= 1) {
    return `منذ ${diffD} ${diffD === 1 ? "يوم" : "أيام"}`;
  }
  return `منذ ${diffH} ${diffH === 1 ? "ساعة" : "ساعات"}`;
}

export default async function AbandonedCartsPage() {
  const { carts, totalValue, totalCarts } = await GetAbandonedCartsAction();

  const statCards = [
    {
      label: "كارتات متروكة",
      value: new Intl.NumberFormat("ar-EG").format(totalCarts),
      icon: ShoppingCart,
      className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
    {
      label: "قيمة متروكة",
      value: formatPrice(totalValue),
      icon: TrendingDown,
      className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      label: "متوسط قيمة الكارت",
      value:
        totalCarts > 0 ? formatPrice(Math.round(totalValue / totalCarts)) : "—",
      icon: Hash,
      className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardSectionHeader
        icon={ShoppingCart}
        title="الكارتات المتروكة"
        badge={totalCarts}
        description="كارتات أضاف فيها عملاء منتجات ولم يكملوا الشراء (أكثر من ساعتين)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border shadow-sm">
              <div className="p-5">
                <div
                  className={cn(
                    "mb-3 grid size-9 place-items-center rounded-xl",
                    stat.className,
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {carts.length === 0 ? (
        <Card className="border-dashed border-border/40 shadow-sm">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen className="size-7" />
            </div>
            <h2 className="text-xl font-bold">لا توجد كارتات متروكة</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              لما عميل يضيف منتجات للكارت ومايكملش الشراء بعد ساعتين، الكارت
              هيظهر هنا.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => (
            <Card
              key={cart.sessionId}
              className="border-border shadow-sm transition-colors hover:bg-muted/20"
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1.5 rounded-full border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        <Clock className="size-3" />
                        {formatRelativeTime(cart.abandonedAt)}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 text-xs"
                      >
                        <Package className="me-1 size-3" />
                        {cart.itemCount}{" "}
                        {cart.itemCount === 1 ? "منتج" : "منتجات"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cart.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-sm"
                        >
                          {item.product.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="size-8 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="max-w-36 truncate font-medium leading-tight">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatPrice(item.product.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 text-start sm:text-end">
                    <p className="text-xl font-bold text-foreground">
                      {formatPrice(cart.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">قيمة الكارت</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
