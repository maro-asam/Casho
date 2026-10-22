import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Truck, XCircle } from "lucide-react";

import { verifyOrderConfirmToken } from "@/lib/orders/whatsapp-confirm";
import { prisma } from "@/lib/prisma";
import { ApproveOrderForm } from "./ApproveOrderForm";

export const metadata: Metadata = { title: "تأكيد الطلب", robots: { index: false, follow: false } };

function formatEGP(piasters: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(piasters / 100);
}

/** Opened from the WhatsApp message: the customer confirms or cancels with one tap. */
export default async function ApproveOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ slug, orderId }, { t }] = await Promise.all([params, searchParams]);
  if (!verifyOrderConfirmToken(orderId, t)) notFound();

  const order = await prisma.order.findFirst({
    where: { id: orderId, store: { slug } },
    select: {
      id: true,
      fullName: true,
      address: true,
      total: true,
      status: true,
      confirmationStatus: true,
      paymentMethod: true,
      store: { select: { name: true } },
      items: { select: { id: true, quantity: true, price: true, product: { select: { name: true, image: true } } } },
    },
  });
  if (!order) notFound();

  const pending = order.status === "PENDING";
  const confirmed = order.confirmationStatus === "CONFIRMED";
  const firstName = order.fullName.trim().split(/\s+/)[0];

  const state = !pending
    ? order.status === "CANCELED"
      ? { icon: XCircle, tone: "text-destructive bg-destructive/10", title: "الطلب ده اتلغى", text: "لو عايز تطلب تاني، تقدر تعمل طلب جديد من المتجر." }
      : { icon: Truck, tone: "text-primary bg-primary/10", title: "طلبك في الطريق", text: `${order.store.name} بيجهّز طلبك أو شحنه خلاص.` }
    : confirmed
      ? { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10", title: "طلبك متأكد", text: `شكرًا يا ${firstName}! ${order.store.name} هيجهّز طلبك ويبعته.` }
      : null;

  return (
    <div className="wrapper mx-auto flex min-h-[70vh] max-w-screen-2xl items-center justify-center py-10" dir="rtl">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-2 text-center">
          {state ? (
            <span className={`mx-auto grid size-16 place-items-center rounded-full ${state.tone}`}>
              <state.icon className="size-8" />
            </span>
          ) : null}
          <h1 className="text-2xl font-bold">{state ? state.title : `أهلًا ${firstName}، أكّد طلبك`}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {state ? state.text : `راجع طلبك من ${order.store.name} وأكّده عشان نبدأ نجهّزه.`}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {item.product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote product image, any host
                    <img src={item.product.image} alt="" className="size-full object-cover" />
                  ) : (
                    <Package className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatEGP(item.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t bg-muted/40 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">العنوان</dt>
              <dd className="text-end">{order.address}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">الدفع</dt>
              <dd>{order.paymentMethod === "cash_on_delivery" ? "كاش عند الاستلام" : "أونلاين"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t pt-2">
              <dt className="font-semibold">الإجمالي</dt>
              <dd className="text-lg font-bold tabular-nums">{formatEGP(order.total)}</dd>
            </div>
          </dl>
        </div>

        {pending && <ApproveOrderForm storeSlug={slug} orderId={order.id} token={t!} confirmed={confirmed} />}
      </div>
    </div>
  );
}
