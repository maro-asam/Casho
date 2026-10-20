import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, MessageCircle, Package, Phone } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import ExportInvoiceButton from "../_components/export-invoice-button";
import { ORDER_CHANNELS, ORDER_RISK_META, ORDER_STATUS_META, paymentMethodLabel } from "../_components/order-meta";
import { Card, LargeTitle, Row, Rows, StatusText, Tag, appleButton, initialOf } from "@/components/saas-page";
import { assessPhoneRisk } from "@/lib/fraud/reputation";
import { canonicalPhone } from "@/lib/fraud/phone";
import { BlockPhoneButton } from "./_components/block-phone-button";
import { CopyButton } from "./_components/copy-button";
import { OrderProgress } from "./_components/order-progress";
import { ShipmentCard, type ShipCarrierOption, type ShipmentView } from "./_components/shipment-card";
import { getStoreCarriers } from "@/lib/shipping/store-carriers";
import { carrierDisplayName, getCarrier } from "@/lib/shipping/carriers";
import { readShipmentEvents } from "@/lib/shipping/shipment-status";
import { governorateName } from "@/constants/egypt-governorates";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("تفاصيل الطلب"),
};
}

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = lazyIntl.number();
const longDate = lazyIntl.date({ timeZone: "Africa/Cairo", dateStyle: "long", timeStyle: "short" });
const shortDate = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const formatMoney = (piasters: number) => money.format(piasters / 100);

const FEATURE_LABELS: Record<string, string> = { get size() { return tr("المقاس"); }, get color() { return tr("اللون"); } };

/** Egyptian mobile → international digits for wa.me (01xxxxxxxxx → 201xxxxxxxxx). */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await loadDashboardLocale();
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
      // Latest live shipment — canceled ones stay in the shipments list only.
      shipments: {
        where: { status: { not: "CANCELED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      items: {
        include: { product: { select: { id: true, name: true, image: true, slug: true } } },
      },
    },
  });
  if (!order) notFound();

  const isOnline = order.source === "ONLINE";
  const [previousOrders, reputation, blocked, storeCarriers] = await Promise.all([
    prisma.order.count({ where: { storeId: store.id, phone: order.phone, id: { not: order.id } } }),
    // Live reputation (may have changed since checkout), this order excluded.
    isOnline ? assessPhoneRisk(store.id, order.phone, { excludeOrderId: order.id }) : null,
    prisma.blockedPhone.findUnique({
      where: { storeId_phone: { storeId: store.id, phone: canonicalPhone(order.phone) } },
      select: { id: true },
    }),
    isOnline ? getStoreCarriers(store.id) : [],
  ]);
  const awaitingCode = order.confirmationStatus === "PENDING" && order.status === "PENDING";
  const returned = order.status === "CANCELED" && order.returnedAt !== null;

  const shortId = order.id.slice(0, 8).toUpperCase();
  const status = ORDER_STATUS_META[order.status];
  const channel = ORDER_CHANNELS[order.source];
  const ChannelIcon = channel.icon;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shipment = order.shipments[0];
  const destination = governorateName(order.governorate);
  const isPaid =
    Boolean(order.paidAt) ||
    order.paymentStatus === "PAID" ||
    (order.paymentMethod !== "cash_on_delivery" && ["PAID", "SHIPPED", "DELIVERED"].includes(order.status)) ||
    order.status === "DELIVERED";

  const shipCarriers: ShipCarrierOption[] = storeCarriers.flatMap((c) => {
    const carrier = getCarrier(c.provider);
    if (!carrier || !c.isActive) return [];
    return [
      {
        key: carrier.key,
        name: carrierDisplayName(carrier, c.settings),
        isApi: carrier.integration === "api",
        cod: carrier.features.cod,
        defaultWeightKg: c.settings.defaultWeightKg ?? null,
      },
    ];
  });
  const shipmentView: ShipmentView | null = shipment
    ? {
        id: shipment.id,
        provider: shipment.provider,
        courierName: shipment.courierName ?? getCarrier(shipment.provider)?.nameAr ?? shipment.provider,
        isApi: getCarrier(shipment.provider)?.integration === "api" && Boolean(shipment.providerShipmentId),
        status: shipment.status,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        labelUrl: shipment.labelUrl,
        codAmount: shipment.codAmount ?? 0,
        codCollectedAt: shipment.codCollectedAt?.toISOString() ?? null,
        cost: shipment.cost,
        weightKg: shipment.weightKg,
        events: readShipmentEvents(shipment.events),
        lastSyncedAt: shipment.lastSyncedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        eyebrow={
          <Link
            href="/orders"
            className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
            {tr("الطلبات")}
          </Link>
        }
        title={
          <>
            {tr("طلب")}{" "}
            <span className="font-mono" dir="ltr">
              #{shortId}
            </span>
          </>
        }
        subtitle={tr("{0} · {1} قطعة · {2}", longDate.format(order.createdAt), nf.format(itemCount), formatMoney(order.total))}
        actions={<ExportInvoiceButton orderId={order.id} />}
      >
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <Tag tone={returned ? "danger" : status.tone}>{returned ? tr("مرتجع") : status.label}</Tag>
          {awaitingCode && <Tag tone="warning">{tr("مستني تأكيد العميل")}</Tag>}
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-card px-2.5 text-[12px] font-medium text-foreground/80">
            <ChannelIcon className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
            {channel.label}
          </span>
        </div>
      </LargeTitle>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
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

          {isOnline && (
            <ShipmentCard
              orderId={order.id}
              orderCanceled={order.status === "CANCELED"}
              carriers={shipCarriers}
              shipment={shipmentView}
              defaultCod={isPaid ? 0 : order.total}
              destination={destination}
            />
          )}

          {/* Items + totals */}
          <Card
            id="order-items"
            title={tr("المنتجات")}
            subtitle={tr("{0} منتج · {1} قطعة", nf.format(order.items.length), nf.format(itemCount))}
          >
            {order.items.length === 0 ? (
              <p className="mx-5 mb-5 rounded-2xl bg-background p-6 text-center text-[15px] text-muted-foreground">
                {tr("مفيش منتجات في الطلب ده.")}
              </p>
            ) : (
              <ul className="apple-rows [--row-inset:84px]">
                {order.items.map((item) => {
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  return (
                    <li key={item.id} className="relative flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.product.image ? (
                          <Image src={item.product.image} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <Package className="absolute inset-0 m-auto size-5 text-(--label-3)" strokeWidth={1.6} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product.id}/edit`}
                          className="block truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                        >
                          {item.product.name}
                        </Link>
                        {features.length > 0 && (
                          <p className="truncate text-[13px] text-muted-foreground">
                            {features.map(([key, val]) => `${FEATURE_LABELS[key] ?? key}: ${val}`).join(" · ")}
                          </p>
                        )}
                        <p className="text-[13px] text-muted-foreground tabular-nums">
                          {nf.format(item.quantity)} × {formatMoney(item.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-[15px] font-semibold tabular-nums">
                        {formatMoney(item.price * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Totals: secondary lines, then the total as the one large figure. */}
            <dl className="mx-5 mt-2 mb-5 space-y-2.5 rounded-2xl bg-background px-4 py-4 text-[15px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{tr("الإجمالي الفرعي")}</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {tr("الشحن{0}", order.shippingMethod ? ` (${order.shippingMethod.name})` : "")}
                </dt>
                <dd className="tabular-nums">{order.shipping > 0 ? formatMoney(order.shipping) : tr("مجاني")}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {tr("الخصم")}
                    {order.couponCode && (
                      <span className="ms-1.5 rounded-md bg-muted px-1.5 py-px font-mono text-[12px]" dir="ltr">
                        {order.couponCode}
                      </span>
                    )}
                  </dt>
                  <dd className="tabular-nums text-(--sys-green)">−{formatMoney(order.discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t-[0.5px] border-border pt-3">
                <dt className="font-semibold">{tr("الإجمالي")}</dt>
                <dd className="text-[22px] leading-7 font-bold tabular-nums ltr:tracking-[-0.01em]">{formatMoney(order.total)}</dd>
              </div>
              {order.profitTotal !== null && (
                <div className="flex justify-between gap-4 text-[13px]">
                  <dt className="text-muted-foreground">{tr("ربحك من الطلب")}</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(order.profitTotal)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {order.notes && (
            <Card title={tr("ملاحظات العميل")}>
              <p className="px-5 pb-5 whitespace-pre-line text-[15px] leading-7">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {reputation && (
            <Card
              title={tr("سمعة الرقم")}
              action={<Tag tone={ORDER_RISK_META[reputation.level].tone}>{ORDER_RISK_META[reputation.level].label}</Tag>}
            >
              <div className="space-y-4 px-5 pb-5">
                {awaitingCode && (
                  <p className="rounded-xl bg-(--sys-orange)/12 px-3.5 py-2.5 text-[13px] leading-5">
                    {tr("العميل لسه ماأكدش الطلب بالكود. لو ماأكدش خلال ٦ ساعات، الطلب هيتلغى لوحده والمخزون يرجع.")}
                  </p>
                )}
                <ul className="space-y-2 text-[15px] leading-6">
                  {reputation.signals.map((signal) => (
                    <li key={signal} className="flex gap-2.5">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-(--label-3)" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
                <dl className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-background px-3 py-2.5">
                    <dt className="text-[12px] text-muted-foreground">{tr("اتسلّم (كل كاشو)")}</dt>
                    <dd className="text-[22px] leading-7 font-semibold tabular-nums">{nf.format(reputation.platform.delivered)}</dd>
                  </div>
                  <div className="rounded-xl bg-background px-3 py-2.5">
                    <dt className="text-[12px] text-muted-foreground">{tr("رفض الاستلام")}</dt>
                    <dd className="text-[22px] leading-7 font-semibold tabular-nums">{nf.format(reputation.platform.returned)}</dd>
                  </div>
                </dl>
                <BlockPhoneButton storeId={store.id} phone={order.phone} blockedId={blocked?.id ?? null} />
              </div>
            </Card>
          )}

          <Card
            title={tr("العميل")}
            action={
              order.customerId ? (
                <Link href={`/crm/customers/${order.customerId}`} className={appleButton.plain}>
                  {tr("ملف العميل")}
                </Link>
              ) : undefined
            }
          >
            <div className="space-y-4 px-5 pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-[17px] font-semibold text-foreground/70">
                  {initialOf(order.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[17px] leading-[22px] font-semibold">{order.fullName}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {previousOrders > 0 ? tr("{0} طلب قبل كده", nf.format(previousOrders)) : tr("أول طلب ليه")}
                  </p>
                </div>
              </div>

              <div className="flex h-11 items-center justify-between gap-2 rounded-xl bg-background ps-4 pe-1.5">
                <span className="text-[15px] tabular-nums" dir="ltr">
                  {order.phone}
                </span>
                <CopyButton value={order.phone} label={tr("رقم الموبايل")} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${order.phone}`} className={`${appleButton.tinted} text-primary`}>
                  <Phone className="size-4" />
                  {tr("اتصال")}
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber(order.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${appleButton.tinted} text-primary`}
                >
                  <MessageCircle className="size-4" />
                  {tr("واتساب")}
                </a>
              </div>
            </div>
          </Card>

          <Card title={order.source === "POS" ? tr("الاستلام") : tr("الشحن")}>
            <div className="flex items-start justify-between gap-2 px-5 pb-3">
              <p className="text-[15px] leading-7">{order.address || "—"}</p>
              {order.address && <CopyButton value={order.address} label={tr("العنوان")} />}
            </div>
            {(order.shippingMethod || destination || shipment) && (
              <Rows className="border-t-[0.5px] border-border pt-0">
                {destination && <Row label={tr("المحافظة")}>{destination}</Row>}
                {order.shippingMethod && <Row label={tr("طريقة الشحن")}>{order.shippingMethod.name}</Row>}
                {shipment && <Row label={tr("شركة الشحن")}>{shipmentView?.courierName}</Row>}
              </Rows>
            )}
          </Card>

          <Card title={tr("الدفع")}>
            <Rows>
              <Row label={tr("الطريقة")}>{paymentMethodLabel(order.paymentMethod)}</Row>
              <Row label={tr("الحالة")}>
                <StatusText tone={isPaid ? "success" : "warning"}>
                  {isPaid ? tr("مدفوع") : order.paymentMethod === "cash_on_delivery" ? tr("هيتدفع عند الاستلام") : tr("مستني الدفع")}
                </StatusText>
              </Row>
              {order.paidAt && <Row label={tr("اتدفع في")}>{shortDate.format(order.paidAt)}</Row>}
              {order.paymentReference && (
                <Row label={tr("المرجع")}>
                  <span className="font-mono text-[13px]" dir="ltr">
                    {order.paymentReference}
                  </span>
                </Row>
              )}
            </Rows>
          </Card>

          <Card title={tr("تفاصيل إضافية")}>
            <Rows>
              <Row label={tr("القناة")}>{channel.label}</Row>
              {order.cashierUser && <Row label={tr("الكاشير")}>{order.cashierUser.name ?? order.cashierUser.email}</Row>}
              {order.couponCode && (
                <Row label={tr("كوبون")}>
                  <span className="font-mono" dir="ltr">
                    {order.couponCode}
                  </span>
                </Row>
              )}
              {!!order.pointsEarned && <Row label={tr("نقاط اكتسبها")}>{nf.format(order.pointsEarned)}</Row>}
              {!!order.pointsRedeemed && <Row label={tr("نقاط استخدمها")}>{nf.format(order.pointsRedeemed)}</Row>}
              <Row label={tr("رقم الطلب الكامل")}>
                <span className="inline-flex items-center gap-1">
                  <span className="max-w-32 truncate font-mono text-[12px]" dir="ltr">
                    {order.id}
                  </span>
                  <CopyButton value={order.id} label={tr("رقم الطلب")} />
                </span>
              </Row>
            </Rows>
          </Card>
        </div>
      </div>
    </div>
  );
}
