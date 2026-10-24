// Order emails over Brevo SMTP (lib/mail): the store owner hears about every
// new order, and a customer who left an email at checkout gets a confirmation
// plus each status change. Each kind can be switched off in the store settings.
//
// Callers use the queue* functions: the send runs after the response (so the
// checkout never waits on SMTP) and never throws into the caller's flow.

import { after } from "next/server";
import { OrderStatus } from "@prisma/client";

import { getPaymentMethodLabel, isManualPaymentMethod } from "@/constants/payment-methods";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { prisma } from "@/lib/prisma";
import { DIGITAL_ADDRESS } from "@/lib/products/digital";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import { esc, infoRows, itemsTable, notice, renderEmail, sectionTitle, type EmailBrand } from "./layout";

const FEATURE_LABEL: Record<string, string> = { size: "المقاس", color: "اللون" };

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      notes: true,
      paymentMethod: true,
      status: true,
      returnedAt: true,
      riskLevel: true,
      riskSignals: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      trackingNumber: true,
      shippingProvider: true,
      items: { select: { quantity: true, price: true, selectedFeatures: true, product: { select: { name: true } } } },
      shipments: {
        where: { status: { not: "CANCELED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { trackingNumber: true, trackingUrl: true, courierName: true },
      },
      store: {
        select: {
          name: true,
          slug: true,
          customDomain: true,
          customDomainStatus: true,
          user: { select: { email: true } },
          settings: {
            select: { logo: true, primaryColor: true, email: true, emailNewOrders: true, emailCustomerOrders: true },
          },
        },
      },
    },
  });
}

export type EmailOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function inBackground(task: () => Promise<void>) {
  const run = () => task().catch((error) => console.error("[order-email]", error));
  try {
    after(run);
  } catch {
    // Outside a request (scripts, tests): just send now.
    void run();
  }
}

const orderNumber = (order: { id: string }) => `#${order.id.slice(-6).toUpperCase()}`;
const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? "";
const money = formatPiastersAsEgp;

function brandOf(order: EmailOrder): EmailBrand {
  return {
    name: order.store.name,
    logo: order.store.settings?.logo ?? null,
    accent: order.store.settings?.primaryColor ?? null,
    url: storeBaseUrl(order.store),
  };
}

function lines(order: EmailOrder) {
  return order.items.map((item) => {
    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
    return {
      name: item.product.name,
      detail: features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ") || undefined,
      quantity: item.quantity,
      total: item.price * item.quantity,
    };
  });
}

const shippingAddress = (order: EmailOrder) => (order.address === DIGITAL_ADDRESS ? null : order.address);

function customerFooter(order: EmailOrder) {
  const reply = order.store.settings?.email ? " لو عندك أي سؤال رد على الإيميل ده." : "";
  return `وصلك الإيميل ده علشان طلبت من ${order.store.name}.${reply}`;
}

async function sendToCustomer(order: EmailOrder, mail: { subject: string; html: string; text: string }) {
  if (!order.email) return;
  await sendMail({ ...mail, to: order.email, fromName: order.store.name, replyTo: order.store.settings?.email });
}

const wantsCustomerEmails = (order: EmailOrder) => Boolean(order.email && order.store.settings?.emailCustomerOrders !== false);

// ─── Builders (exported for tests) ──────────────────────────────────────────

export function buildMerchantNewOrderEmail(order: EmailOrder, dashboardUrl: string) {
  const risk = order.riskLevel === "HIGH" || order.riskLevel === "MEDIUM";
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subject = `${risk ? "⚠️ " : ""}طلب جديد ${orderNumber(order)} — ${money(order.total)}`;

  const body =
    (risk
      ? notice(
          `<strong>${order.riskLevel === "HIGH" ? "رقم عالي الخطورة" : "رقم محتاج انتباه"}</strong>${
            order.riskSignals[0] ? `<br>${esc(order.riskSignals[0])}` : ""
          }`,
          "warning",
        )
      : "") +
    sectionTitle("بيانات العميل") +
    infoRows([
      { label: "الاسم", value: order.fullName },
      { label: "الموبايل", value: order.phone, ltr: true },
      { label: "الإيميل", value: order.email, ltr: true },
      { label: "العنوان", value: shippingAddress(order) },
      { label: "طريقة الدفع", value: getPaymentMethodLabel(order.paymentMethod) },
      { label: "ملاحظات", value: order.notes },
    ]) +
    sectionTitle(`المنتجات (${count})`) +
    itemsTable(lines(order), order);

  const html = renderEmail({
    brand: { ...brandOf(order), url: dashboardUrl },
    preheader: `${order.fullName} — ${money(order.total)}`,
    heading: "وصلك طلب جديد",
    intro: `طلب ${orderNumber(order)} من ${order.fullName} في ${order.store.name}.`,
    body,
    cta: { label: "افتح الطلب", href: dashboardUrl },
    footer: "بتوصلك الإيميلات دي علشان إشعارات الطلبات شغالة. تقدر تقفلها من إعدادات المتجر.",
  });

  const text = [
    `طلب جديد ${orderNumber(order)} — ${order.store.name}`,
    `${order.fullName} — ${order.phone}`,
    shippingAddress(order),
    `الإجمالي: ${money(order.total)}`,
    `طريقة الدفع: ${getPaymentMethodLabel(order.paymentMethod)}`,
    `افتح الطلب: ${dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

export function buildCustomerConfirmationEmail(order: EmailOrder) {
  const name = firstName(order.fullName);
  const intro =
    order.status === OrderStatus.PAID
      ? "الدفع اتأكد وبدأنا نجهّز طلبك. هنبعتلك أول ما يتشحن."
      : isManualPaymentMethod(order.paymentMethod)
        ? "علشان نبدأ نجهّز طلبك، كمّل تحويل المبلغ على بيانات التحويل اللي ظهرتلك بعد الطلب."
        : "هنتواصل معاك قريب لتأكيد الطلب وميعاد التوصيل.";

  const body =
    infoRows([
      { label: "رقم الطلب", value: orderNumber(order) },
      { label: "العنوان", value: shippingAddress(order) },
      { label: "طريقة الدفع", value: getPaymentMethodLabel(order.paymentMethod) },
    ]) +
    sectionTitle("طلبك") +
    itemsTable(lines(order), order);

  const html = renderEmail({
    brand: brandOf(order),
    preheader: `طلب ${orderNumber(order)} — ${money(order.total)}`,
    heading: name ? `شكرًا يا ${name}، طلبك وصلنا` : "شكرًا، طلبك وصلنا",
    intro,
    body,
    cta: { label: `زور ${order.store.name}`, href: brandOf(order).url },
    footer: customerFooter(order),
  });

  const text = [
    `طلبك ${orderNumber(order)} من ${order.store.name} وصلنا.`,
    intro,
    ...lines(order).map((l) => `- ${l.name} × ${l.quantity}: ${money(l.total)}`),
    `الإجمالي: ${money(order.total)}`,
  ].join("\n");

  return { subject: `طلبك من ${order.store.name} وصلنا — ${orderNumber(order)}`, html, text };
}

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; heading: string; intro: string }>> = {
  PAID: { subject: "استلمنا الدفع لطلبك", heading: "استلمنا الدفع", intro: "الدفع وصل وبدأنا نجهّز طلبك." },
  SHIPPED: { subject: "طلبك اتشحن", heading: "طلبك في الطريق ليك", intro: "طلبك خرج من عندنا ومع شركة الشحن دلوقتي." },
  DELIVERED: { subject: "طلبك اتسلّم", heading: "طلبك وصلك", intro: "نتمنى المنتجات تعجبك، ويسعدنا نشوفك تاني." },
  CANCELED: {
    subject: "طلبك اتلغى",
    heading: "طلبك اتلغى",
    intro: "لو الإلغاء حصل بالغلط أو عندك أي سؤال، تواصل مع المتجر.",
  },
};

/** Null for statuses the customer isn't told about. */
export function buildCustomerStatusEmail(order: EmailOrder, status: OrderStatus) {
  const copy = STATUS_COPY[status];
  if (!copy) return null;

  const shipment = order.shipments[0];
  const tracking = shipment?.trackingNumber ?? order.trackingNumber;
  const courier = shipment?.courierName ?? order.shippingProvider;
  const trackingUrl = status === OrderStatus.SHIPPED ? shipment?.trackingUrl : null;

  const body =
    (status === OrderStatus.SHIPPED && tracking
      ? notice(`${courier ? `شركة الشحن: <strong>${esc(courier)}</strong><br>` : ""}رقم الشحنة: <strong dir="ltr">${esc(tracking)}</strong>`)
      : "") +
    infoRows([
      { label: "رقم الطلب", value: orderNumber(order) },
      { label: "الإجمالي", value: money(order.total) },
    ]);

  const html = renderEmail({
    brand: brandOf(order),
    preheader: `${copy.heading} — ${orderNumber(order)}`,
    heading: copy.heading,
    intro: `${firstName(order.fullName) ? `أهلًا ${firstName(order.fullName)}، ` : ""}${copy.intro}`,
    body,
    cta: trackingUrl ? { label: "تتبع الشحنة", href: trackingUrl } : { label: `زور ${order.store.name}`, href: brandOf(order).url },
    footer: customerFooter(order),
  });

  const text = [
    `${copy.heading} — ${orderNumber(order)} (${order.store.name})`,
    copy.intro,
    tracking && status === OrderStatus.SHIPPED ? `رقم الشحنة: ${tracking}` : null,
    trackingUrl ? `تتبع الشحنة: ${trackingUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: `${copy.subject} — ${orderNumber(order)}`, html, text };
}

// ─── Queue (what the order flow calls) ──────────────────────────────────────

function dashboardOrderUrl(orderId: string) {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://casho.store";
  return `${appUrl.replace(/\/$/, "")}/dashboard/orders/${orderId}`;
}

/**
 * A new order reached the merchant (lib/store/order-announce). Online-payment
 * orders are still unpaid here — their customer email waits for the payment
 * (queueOrderPaidEmail).
 */
export function queueNewOrderEmails(orderId: string, opts: { awaitingOnlinePayment: boolean }) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    if (!order) return;

    const ownerEmail = order.store.user.email;
    if (ownerEmail && order.store.settings?.emailNewOrders !== false) {
      await sendMail({ ...buildMerchantNewOrderEmail(order, dashboardOrderUrl(order.id)), to: ownerEmail });
    }
    if (!opts.awaitingOnlinePayment && wantsCustomerEmails(order)) {
      await sendToCustomer(order, buildCustomerConfirmationEmail(order));
    }
  });
}

/** The gateway confirmed an online payment (lib/payments/settle) — once per order. */
export function queueOrderPaidEmail(orderId: string) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    if (!order || !wantsCustomerEmails(order)) return;
    await sendToCustomer(order, buildCustomerConfirmationEmail(order));
  });
}

/** The merchant (or a carrier sync) moved the order to a new status. */
export function queueOrderStatusEmail(orderId: string, status: OrderStatus) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    // A refused delivery is recorded as canceled + returned — nothing to tell the customer.
    if (!order || !wantsCustomerEmails(order) || order.status !== status || order.returnedAt) return;
    const mail = buildCustomerStatusEmail(order, status);
    if (mail) await sendToCustomer(order, mail);
  });
}
