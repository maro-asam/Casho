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
import Link from "next/link";

function formatEGPFromCents(cents: number) {
  const egp = cents / 100;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(egp);
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;

  const { guestSessionId } = await MustSession();

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      guestSessionId,
      store: { slug },
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
      store: { select: { name: true } },
    },
  });

  if (!order) {
    return <div className="wrapper py-10">لم يتم العثور على الطلب</div>;
  }

  return (
    <div className="wrapper py-10 max-w-2xl" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>تم تأكيد الطلب ✅</CardTitle>
            <Badge variant="secondary">مؤكد</Badge>
          </div>

          <CardDescription className="mt-2">
            المتجر: <span className="font-medium">{order.store.name}</span>
            {" — "}
            رقم الطلب: <span className="font-mono">{order.id}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {order.items.map((it) => (
              <div
                key={it.id}
                className="flex items-start justify-between gap-4 border rounded-xl p-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {it.product.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {it.quantity} × {formatEGPFromCents(it.price)}
                  </div>
                </div>

                <div className="font-bold whitespace-nowrap">
                  {formatEGPFromCents(it.quantity * it.price)}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">الإجمالي</div>
            <div className="text-xl font-bold">
              {formatEGPFromCents(order.total)}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            هنتواصل معاك لتأكيد تفاصيل الطلب والتسليم.
          </p>
        </CardContent>
      </Card>

      <Button asChild>
        <Link href={`/store/${slug}`}>العودة إلى المتجر</Link>
      </Button>
    </div>
  );
}
