import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { MustSession } from "@/actions/auth/auth-helpers.actions";
import { Card, CardContent } from "@/components/ui/card";
import { maskPhone } from "@/lib/fraud/phone";
import { prisma } from "@/lib/prisma";
import { ConfirmOrderForm } from "./ConfirmOrderForm";

export const metadata: Metadata = { title: "تأكيد الطلب", robots: { index: false, follow: false } };

function formatEGP(piasters: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piasters / 100);
}

export default async function ConfirmOrderPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const { slug, orderId } = await params;
  const { guestSessionId } = await MustSession();

  const order = await prisma.order.findFirst({
    where: { id: orderId, guestSessionId, store: { slug } },
    select: { id: true, phone: true, total: true, status: true, confirmationStatus: true, otpLastSentAt: true, store: { select: { name: true } } },
  });

  if (!order) redirect(`/store/${slug}`);
  if (order.confirmationStatus !== "PENDING") redirect(`/store/${slug}/order/${order.id}`);

  const expired = order.status !== "PENDING";

  return (
    <div className="wrapper mx-auto flex min-h-[70vh] max-w-screen-2xl items-center justify-center py-10" dir="rtl">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="space-y-6 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">أكّد طلبك</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              بعتنا كود تأكيد للرقم{" "}
              <span className="font-mono text-foreground" dir="ltr">
                {maskPhone(order.phone)}
              </span>{" "}
              على واتساب أو في رسالة. اكتبه هنا عشان {order.store.name} يبدأ يجهّز طلبك ({formatEGP(order.total)}).
            </p>
          </div>
          {expired ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              الطلب ده اتلغى لأنه ماتأكدش في الوقت المحدد. تقدر تعمل طلب جديد من المتجر.
            </p>
          ) : (
            <ConfirmOrderForm
              storeSlug={slug}
              orderId={order.id}
              lastSentAt={order.otpLastSentAt?.toISOString() ?? null}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
