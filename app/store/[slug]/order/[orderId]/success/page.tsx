import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  Home,
  Package,
  ShoppingBag,
} from "lucide-react";

import { MustSession } from "@/actions/auth/auth-helpers.actions";
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatEGPFromCents(cents: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function OrderSuccessPage({
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
    select: {
      id: true,
      total: true,
      paymentStatus: true,
      paymentReference: true,
      paidAt: true,
      store: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!order) {
    redirect(`/store/${slug}`);
  }

  return (
    <div
      className="wrapper flex min-h-[80vh] items-center justify-center py-10"
      dir="rtl"
    >
      <Card className="w-full max-w-2xl overflow-hidden rounded-[32px] border-0 shadow-sm">
        <CardContent className="space-y-8 p-8 text-center md:p-10">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-14 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              تم الدفع بنجاح 🎉
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
              شكراً لطلبك من {order.store.name}. تم تسجيل عملية الدفع بنجاح
              وهيتم تجهيز الطلب ومتابعته من المتجر.
            </p>
          </div>

          <div className="grid gap-3 text-right sm:grid-cols-3">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardList className="size-4" />
                رقم الطلب
              </div>
              <p className="break-all font-mono text-xs">{order.id}</p>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="size-4" />
                عدد المنتجات
              </div>
              <p className="font-semibold">{order.items.length}</p>
            </div>

            <div className="rounded-2xl border bg-primary/5 p-4">
              <div className="mb-2 text-sm text-muted-foreground">الإجمالي</div>
              <p className="font-extrabold">
                {formatEGPFromCents(order.total)}
              </p>
            </div>
          </div>

          {order.paymentReference ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              مرجع الدفع:{" "}
              <span className="font-mono text-foreground">
                {order.paymentReference}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 flex-1 rounded-2xl">
              <Link href={`/store/${slug}/order/${order.id}`}>
                <ClipboardList className="ms-2 size-4" />
                عرض تفاصيل الطلب
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 flex-1 rounded-2xl bg-transparent"
            >
              <Link href={`/store/${slug}`}>
                <Home className="ms-2 size-4" />
                العودة للمتجر
              </Link>
            </Button>
          </div>

          <Button asChild variant="ghost" className="rounded-2xl">
            <Link href={`/store/${slug}`}>
              <ShoppingBag className="ms-2 size-4" />
              متابعة التسوق
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
