import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, MessageCircle, Package, Phone, UserRound } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import ExportInvoiceButton from "../_components/export-invoice-button";
import { ORDER_CHANNELS, ORDER_RISK_META, ORDER_STATUS_META, paymentMethodLabel } from "../_components/order-meta";
import { assessPhoneRisk } from "@/lib/fraud/reputation";
import { canonicalPhone } from "@/lib/fraud/phone";
import { BlockPhoneButton } from "./_components/block-phone-button";
import { CopyButton } from "./_components/copy-button";
import { OrderProgress } from "./_components/order-progress";

export const metadata: Metadata = {
  title: "تفاصيل الطلب",
};

const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = new Intl.NumberFormat("ar-EG");
const longDate = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "long", timeStyle: "short" });
const shortDate = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const formatMoney = (piasters: number) => money.format(piasters / 100);

const FEATURE_LABELS: Record<string, string> = { size: "المقاس", color: "اللون" };

/** Egyptian mobile → international digits for wa.me (01xxxxxxxxx → 201xxxxxxxxx). */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

/* ── Small layout primitives for this page ───────────────────────────── */

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end font-medium">{children}</dd>
    </div>
  );
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    include: {
      store: { select: { name: true, slug: true } },
      shippingMethod: { select: { name: true } },
      cashierUser: { select: { name: true, email: true } },
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { provider: true, trackingNumber: true, courierName: true },
      },
      items: {
        include: { product: { select: { id: true, name: true, image: true, slug: true } } },
      },
    },
  });
  if (!order) notFound();

  const isOnline = order.source === "ONLINE";
  const [previousOrders, reputation, blocked] = await Promise.all([
    prisma.order.count({ where: { storeId: store.id, phone: order.phone, id: { not: order.id } } }),
    // Live reputation (may have changed since checkout), this order excluded.
    isOnline ? assessPhoneRisk(store.id, order.phone, { excludeOrderId: order.id }) : null,
    prisma.blockedPhone.findUnique({
      where: { storeId_phone: { storeId: store.id, phone: canonicalPhone(order.phone) } },
      select: { id: true },
    }),
  ]);
  const awaitingCode = order.confirmationStatus === "PENDING" && order.status === "PENDING";
  const returned = order.status === "CANCELED" && order.returnedAt !== null;

  const shortId = order.id.slice(0, 8).toUpperCase();
  const status = ORDER_STATUS_META[order.status];
  const channel = ORDER_CHANNELS[order.source];
  const ChannelIcon = channel.icon;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shipment = order.shipments[0];
  const trackingNumber = order.trackingNumber ?? shipment?.trackingNumber ?? null;
  const shippingProvider = order.shippingProvider ?? shipment?.courierName ?? shipment?.provider ?? null;
  const isPaid =
    Boolean(order.paidAt) ||
    order.paymentStatus === "PAID" ||
    (order.paymentMethod !== "cash_on_delivery" && ["PAID", "SHIPPED", "DELIVERED"].includes(order.status)) ||
    order.status === "DELIVERED";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          الطلبات
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                طلب{" "}
                <span className="font-mono font-bold" dir="ltr">
                  #{shortId}
                </span>
              </h1>
              <StatusPill tone={returned ? "danger" : status.tone}>{returned ? "مرتجع" : status.label}</StatusPill>
              {awaitingCode && <StatusPill tone="warning">مستني تأكيد العميل</StatusPill>}
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <ChannelIcon className="size-3.5" />
                {channel.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {longDate.format(order.createdAt)} · {nf.format(itemCount)} قطعة · {formatMoney(order.total)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ExportInvoiceButton orderId={order.id} />
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <OrderProgress
            orderId={order.id}
            storeId={store.id}
            status={order.status}
            source={order.source}
            paymentMethod={order.paymentMethod}
            createdAtLabel={shortDate.format(order.createdAt)}
            paidAtLabel={order.paidAt ? shortDate.format(order.paidAt) : null}
            returned={returned}
          />

          {/* Items + totals */}
          <section aria-labelledby="order-items-title" className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h2 id="order-items-title" className="text-sm font-semibold">
                المنتجات
              </h2>
              <span className="text-xs text-muted-foreground">
                {nf.format(order.items.length)} منتج · {nf.format(itemCount)} قطعة
              </span>
            </div>

            {order.items.length === 0 ? (
              <p className="mx-5 mb-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                مفيش منتجات في الطلب ده.
              </p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {order.items.map((item) => {
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  return (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {item.product.image ? (
                          <Image src={item.product.image} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <Package className="absolute inset-0 m-auto size-5 text-muted-foreground/50" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product.id}/edit`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        {features.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            {features.map(([key, val]) => `${FEATURE_LABELS[key] ?? key}: ${val}`).join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {nf.format(item.quantity)} × {formatMoney(item.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatMoney(item.price * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            <dl className="space-y-2 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">الإجمالي الفرعي</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  الشحن{order.shippingMethod ? ` (${order.shippingMethod.name})` : ""}
                </dt>
                <dd className="tabular-nums">{order.shipping > 0 ? formatMoney(order.shipping) : "مجاني"}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    الخصم
                    {order.couponCode && (
                      <span className="ms-1.5 rounded bg-muted px-1.5 py-px font-mono text-xs" dir="ltr">
                        {order.couponCode}
                      </span>
                    )}
                  </dt>
                  <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">−{formatMoney(order.discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-semibold">الإجمالي</dt>
                <dd className="text-lg font-bold tabular-nums">{formatMoney(order.total)}</dd>
              </div>
              {order.profitTotal !== null && (
                <div className="flex justify-between text-xs">
                  <dt className="text-muted-foreground">ربحك من الطلب</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(order.profitTotal)}</dd>
                </div>
              )}
            </dl>
          </section>

          {order.notes && (
            <Panel title="ملاحظات العميل">
              <p className="whitespace-pre-line text-sm leading-7">{order.notes}</p>
            </Panel>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {reputation && (
            <Panel
              title="سمعة الرقم"
              action={<StatusPill tone={ORDER_RISK_META[reputation.level].tone}>{ORDER_RISK_META[reputation.level].label}</StatusPill>}
            >
              {awaitingCode && (
                <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-400">
                  العميل لسه ماأكدش الطلب بالكود. لو ماأكدش خلال ٦ ساعات، الطلب هيتلغى لوحده والمخزون يرجع.
                </p>
              )}
              <ul className="space-y-1.5 text-sm">
                {reputation.signals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">اتسلّم (كل كاشو)</dt>
                  <dd className="font-semibold tabular-nums">{nf.format(reputation.platform.delivered)}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <dt className="text-xs text-muted-foreground">رفض الاستلام</dt>
                  <dd className="font-semibold tabular-nums">{nf.format(reputation.platform.returned)}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <BlockPhoneButton storeId={store.id} phone={order.phone} blockedId={blocked?.id ?? null} />
              </div>
            </Panel>
          )}
          <Panel
            title="العميل"
            action={
              order.customerId ? (
                <Link href={`/crm/customers/${order.customerId}`} className="text-xs font-medium text-primary hover:underline">
                  ملف العميل
                </Link>
              ) : undefined
            }
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{order.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {previousOrders > 0 ? `${nf.format(previousOrders)} طلب قبل كده` : "أول طلب ليه"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-sm font-medium tabular-nums" dir="ltr">
                {order.phone}
              </span>
              <CopyButton value={order.phone} label="رقم الموبايل" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                <a href={`tel:${order.phone}`}>
                  <Phone className="size-4" />
                  اتصال
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
                <a href={`https://wa.me/${whatsappNumber(order.phone)}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  واتساب
                </a>
              </Button>
            </div>
          </Panel>

          <Panel title={order.source === "POS" ? "الاستلام" : "الشحن"}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-7">{order.address || "—"}</p>
              {order.address && <CopyButton value={order.address} label="العنوان" />}
            </div>
            {(order.shippingMethod || trackingNumber || shippingProvider) && (
              <dl className="mt-3 divide-y divide-border border-t border-border pt-3">
                {order.shippingMethod && <Field label="طريقة الشحن">{order.shippingMethod.name}</Field>}
                {shippingProvider && <Field label="شركة الشحن">{shippingProvider}</Field>}
                {trackingNumber && (
                  <Field label="رقم التتبع">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-mono" dir="ltr">
                        {trackingNumber}
                      </span>
                      <CopyButton value={trackingNumber} label="رقم التتبع" className="size-6" />
                    </span>
                  </Field>
                )}
              </dl>
            )}
          </Panel>

          <Panel title="الدفع">
            <dl className="divide-y divide-border">
              <Field label="الطريقة">{paymentMethodLabel(order.paymentMethod)}</Field>
              <Field label="الحالة">
                <StatusPill tone={isPaid ? "success" : "warning"}>
                  {isPaid ? "مدفوع" : order.paymentMethod === "cash_on_delivery" ? "هيتدفع عند الاستلام" : "مستني الدفع"}
                </StatusPill>
              </Field>
              {order.paidAt && <Field label="اتدفع في">{shortDate.format(order.paidAt)}</Field>}
              {order.paymentReference && (
                <Field label="المرجع">
                  <span className="font-mono text-xs" dir="ltr">
                    {order.paymentReference}
                  </span>
                </Field>
              )}
            </dl>
          </Panel>

          <Panel title="تفاصيل إضافية">
            <dl className="divide-y divide-border">
              <Field label="القناة">{channel.label}</Field>
              {order.cashierUser && <Field label="الكاشير">{order.cashierUser.name ?? order.cashierUser.email}</Field>}
              {order.couponCode && (
                <Field label="كوبون">
                  <span className="font-mono" dir="ltr">
                    {order.couponCode}
                  </span>
                </Field>
              )}
              {!!order.pointsEarned && <Field label="نقاط اكتسبها">{nf.format(order.pointsEarned)}</Field>}
              {!!order.pointsRedeemed && <Field label="نقاط استخدمها">{nf.format(order.pointsRedeemed)}</Field>}
              <Field label="رقم الطلب الكامل">
                <span className="inline-flex items-center gap-1">
                  <span className="max-w-32 truncate font-mono text-xs" dir="ltr">
                    {order.id}
                  </span>
                  <CopyButton value={order.id} label="رقم الطلب" className="size-6" />
                </span>
              </Field>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
