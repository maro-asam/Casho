// Order emails over Brevo SMTP (lib/mail): the store owner hears about every
// new order (and failed online payments), and a customer who left an email at
// checkout gets a confirmation plus each status change. Each kind can be
// switched off in the store settings.
//
// Callers use the queue* functions: the send runs after the response (so the
// checkout never waits on SMTP), retries and logs via deliver(), and never
// throws into the caller's flow.

import { OrderStatus } from "@prisma/client";

import { getPaymentMethodLabel, isManualPaymentMethod } from "@/constants/payment-methods";
import { isMailConfigured } from "@/lib/mail";
import { toStoreCurrency } from "@/lib/store/currency";
import { orderNumber as formatOrderNumber, orderTrackUrl } from "@/lib/orders/tracking";
import { prisma } from "@/lib/prisma";
import { DIGITAL_ADDRESS } from "@/lib/products/digital";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import { dashboardUrl, deliver, inBackground, sentWithin, type EmailKind } from "./deliver";
import { stIn, toStoreLocale, type StoreLocale } from "@/lib/i18n/storefront";
import { ensureStoreEnglish } from "@/lib/i18n/storefront/load-english";
import { emailMoney, esc, infoRows, itemsTable, notice, renderEmail, sectionTitle, type EmailBrand } from "./layout";

const FEATURE_LABEL: Record<string, string> = { size: "المقاس", color: "اللون", playerId: "معرّف اللاعب", playerName: "اسم اللاعب", grind: "الطحنة" };

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      storeId: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      notes: true,
      paymentMethod: true,
      paymentPayer: true,
      paymentProofUrl: true,
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
            select: {
              logo: true,
              primaryColor: true,
              email: true,
              emailNewOrders: true,
              emailCustomerOrders: true,
              emailStoreAlerts: true,
              storeLanguage: true,
              storeCurrency: true,
            },
          },
        },
      },
    },
  });
}

export type EmailOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

const orderNumber = (order: { id: string }) => formatOrderNumber(order.id);
const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? "";

function brandOf(order: EmailOrder): EmailBrand {
  return {
    name: order.store.name,
    logo: order.store.settings?.logo ?? null,
    accent: order.store.settings?.primaryColor ?? null,
    url: storeBaseUrl(order.store),
  };
}

/**
 * Customer emails speak the store's language (StoreSettings.storeLanguage);
 * the merchant's stay Arabic. English text comes from the storefront
 * dictionary — loaded before a customer email is built (prepareCustomerEmail).
 */
const langOf = (order: EmailOrder): StoreLocale => toStoreLocale(order.store.settings?.storeLanguage);
/** Amounts are written in the store's currency (StoreSettings.storeCurrency). */
const currencyOf = (order: EmailOrder) => toStoreCurrency(order.store.settings?.storeCurrency);
/** The merchant's emails stay Arabic. */
const ownerMoney = (order: EmailOrder) => (piasters: number) => emailMoney(piasters, "ar", currencyOf(order));

async function prepareCustomerEmail(order: EmailOrder) {
  if (langOf(order) === "en") await ensureStoreEnglish();
}

function lines(order: EmailOrder, lang: StoreLocale = "ar") {
  return order.items.map((item) => {
    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
    return {
      name: item.product.name,
      detail: features.map(([k, v]) => `${FEATURE_LABEL[k] ? stIn(lang, FEATURE_LABEL[k]) : k}: ${v}`).join(" · ") || undefined,
      quantity: item.quantity,
      total: item.price * item.quantity,
    };
  });
}

const shippingAddress = (order: EmailOrder) => (order.address === DIGITAL_ADDRESS ? null : order.address);

function customerFooter(order: EmailOrder, lang: StoreLocale) {
  const reply = order.store.settings?.email ? stIn(lang, " لو عندك أي سؤال رد على الإيميل ده.") : "";
  return stIn(lang, "وصلك الإيميل ده علشان طلبت من {0}.", order.store.name) + reply;
}

type Mail = { subject: string; html: string; text: string };

async function sendToCustomer(order: EmailOrder, mail: Mail, kind: EmailKind) {
  if (!order.email) return;
  await deliver(
    { ...mail, to: order.email, fromName: order.store.name, replyTo: order.store.settings?.email },
    { kind, storeId: order.storeId, refId: order.id },
  );
}

async function sendToOwner(order: EmailOrder, mail: Mail, kind: EmailKind) {
  await deliver({ ...mail, to: order.store.user.email }, { kind, storeId: order.storeId, refId: order.id });
}

const wantsCustomerEmails = (order: EmailOrder) => Boolean(order.email && order.store.settings?.emailCustomerOrders !== false);

// ─── Builders (exported for tests) ──────────────────────────────────────────

export function buildMerchantNewOrderEmail(order: EmailOrder, dashboardUrl: string) {
  const money = ownerMoney(order);
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
      { label: "حوّل من", value: order.paymentPayer, ltr: true },
      { label: "صورة التحويل", value: order.paymentProofUrl ? "العميل بعتها — راجعها في صفحة الطلب" : null },
      { label: "ملاحظات", value: order.notes },
    ]) +
    sectionTitle(`المنتجات (${count})`) +
    itemsTable(lines(order), order, "ar", currencyOf(order));

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
    order.paymentPayer ? `حوّل من: ${order.paymentPayer}` : "",
    order.paymentProofUrl ? "بعت صورة التحويل — راجعها في صفحة الطلب" : "",
    `افتح الطلب: ${dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

export function buildCustomerConfirmationEmail(order: EmailOrder) {
  const lang = langOf(order);
  const t = (source: string, ...args: unknown[]) => stIn(lang, source, ...args);
  const money = (piasters: number) => emailMoney(piasters, lang, currencyOf(order));
  const name = firstName(order.fullName);
  const trackUrl = orderTrackUrl(order.store, order.id);
  const intro =
    order.status === OrderStatus.PAID
      ? t("الدفع اتأكد وبدأنا نجهّز طلبك. هنبعتلك أول ما يتشحن.")
      : order.paymentProofUrl
        ? t("استلمنا صورة التحويل. المتجر هيراجعها ويبدأ يجهّز طلبك.")
        : order.paymentPayer
          ? t("استلمنا بيانات التحويل. المتجر هيراجعها ويبدأ يجهّز طلبك.")
          : isManualPaymentMethod(order.paymentMethod)
            ? t("علشان نبدأ نجهّز طلبك، كمّل تحويل المبلغ على بيانات التحويل اللي ظهرتلك بعد الطلب.")
            : t("هنتواصل معاك قريب لتأكيد الطلب وميعاد التوصيل.");

  const body =
    infoRows(
      [
        { label: t("رقم الطلب"), value: orderNumber(order) },
        { label: t("العنوان"), value: shippingAddress(order) },
        { label: t("طريقة الدفع"), value: t(getPaymentMethodLabel(order.paymentMethod)) },
      ],
      lang,
    ) +
    sectionTitle(t("طلبك")) +
    itemsTable(lines(order, lang), order, lang, currencyOf(order));

  const html = renderEmail({
    brand: brandOf(order),
    preheader: t("طلب {0} — {1}", orderNumber(order), money(order.total)),
    heading: name ? t("شكرًا يا {0}، طلبك وصلنا", name) : t("شكرًا، طلبك وصلنا"),
    intro,
    body,
    cta: { label: t("تتبّع طلبك"), href: trackUrl },
    footer: customerFooter(order, lang),
    lang,
  });

  const text = [
    t("طلبك {0} من {1} وصلنا.", orderNumber(order), order.store.name),
    intro,
    ...lines(order, lang).map((l) => `- ${l.name} × ${l.quantity}: ${money(l.total)}`),
    t("الإجمالي: {0}", money(order.total)),
    t("تتبّع طلبك: {0}", trackUrl),
  ].join("\n");

  return { subject: t("طلبك من {0} وصلنا — {1}", order.store.name, orderNumber(order)), html, text };
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
  const source = STATUS_COPY[status];
  if (!source) return null;
  const lang = langOf(order);
  const t = (text: string, ...args: unknown[]) => stIn(lang, text, ...args);
  const money = (piasters: number) => emailMoney(piasters, lang, currencyOf(order));
  const copy = { subject: t(source.subject), heading: t(source.heading), intro: t(source.intro) };

  const shipment = order.shipments[0];
  const tracking = shipment?.trackingNumber ?? order.trackingNumber;
  const courier = shipment?.courierName ?? order.shippingProvider;
  const carrierUrl = status === OrderStatus.SHIPPED ? shipment?.trackingUrl : null;
  // Canceled orders have nothing left to follow — send those back to the store.
  const trackUrl = status === OrderStatus.CANCELED ? null : orderTrackUrl(order.store, order.id);

  const body =
    (status === OrderStatus.SHIPPED && tracking
      ? notice(
          `${courier ? `${esc(t("شركة الشحن:"))} <strong>${esc(courier)}</strong><br>` : ""}${esc(t("رقم الشحنة:"))} <strong dir="ltr">${esc(tracking)}</strong>` +
            (carrierUrl ? `<br><a href="${esc(carrierUrl)}">${esc(t("تتبّع على موقع شركة الشحن"))}</a>` : ""),
        )
      : "") +
    infoRows(
      [
        { label: t("رقم الطلب"), value: orderNumber(order) },
        { label: t("الإجمالي"), value: money(order.total) },
      ],
      lang,
    );

  const name = firstName(order.fullName);
  const html = renderEmail({
    brand: brandOf(order),
    preheader: `${copy.heading} — ${orderNumber(order)}`,
    heading: copy.heading,
    intro: `${name ? t("أهلًا {0}، ", name) : ""}${copy.intro}`,
    body,
    cta: trackUrl ? { label: t("تتبّع طلبك"), href: trackUrl } : { label: t("زور {0}", order.store.name), href: brandOf(order).url },
    footer: customerFooter(order, lang),
    lang,
  });

  const text = [
    `${copy.heading} — ${orderNumber(order)} (${order.store.name})`,
    copy.intro,
    tracking && status === OrderStatus.SHIPPED ? t("رقم الشحنة: {0}", tracking) : null,
    trackUrl ? t("تتبّع طلبك: {0}", trackUrl) : null,
    carrierUrl ? t("موقع شركة الشحن: {0}", carrierUrl) : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: `${copy.subject} — ${orderNumber(order)}`, html, text };
}

export function buildPaymentFailedEmail(order: EmailOrder, orderUrl: string) {
  const money = ownerMoney(order);
  const html = renderEmail({
    brand: { ...brandOf(order), url: orderUrl },
    preheader: `${order.fullName} — ${money(order.total)}`,
    heading: "دفع أونلاين مكمّلش",
    intro: `${order.fullName} حاول يدفع طلب ${orderNumber(order)} أونلاين ومقدرش يكمّل، فالطلب اتلغى والمخزون رجع. كلّمه — ممكن يحب يكمّل بطريقة دفع تانية.`,
    body: infoRows([
      { label: "الموبايل", value: order.phone, ltr: true },
      { label: "الإيميل", value: order.email, ltr: true },
      { label: "الإجمالي", value: money(order.total) },
    ]),
    cta: { label: "افتح الطلب", href: orderUrl },
    footer: "تقدر تقفل تنبيهات المتجر من إعدادات المتجر ← إيميلات الطلبات.",
  });
  const text = [
    `دفع أونلاين مكمّلش — طلب ${orderNumber(order)}`,
    `${order.fullName} — ${order.phone}`,
    `الإجمالي: ${money(order.total)}`,
    `افتح الطلب: ${orderUrl}`,
  ].join("\n");
  return { subject: `دفع أونلاين مكمّلش — ${order.fullName} (${orderNumber(order)})`, html, text };
}

// ─── Queue (what the order flow calls) ──────────────────────────────────────

const dashboardOrderUrl = (orderId: string) => dashboardUrl(`/orders/${orderId}`);

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

    if (order.store.settings?.emailNewOrders !== false) {
      await sendToOwner(order, buildMerchantNewOrderEmail(order, dashboardOrderUrl(order.id)), "ORDER_NEW");
    }
    if (!opts.awaitingOnlinePayment && wantsCustomerEmails(order)) {
      await prepareCustomerEmail(order);
      await sendToCustomer(order, buildCustomerConfirmationEmail(order), "ORDER_CONFIRMATION");
    }
  });
}

/** The gateway reported a failed online payment and the order was released (lib/payments/settle). */
export function queuePaymentFailedEmail(orderId: string) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    if (!order || order.store.settings?.emailStoreAlerts === false) return;
    // Replayed gateway callbacks must not repeat it.
    if (await sentWithin("PAYMENT_FAILED", order.id, 24 * 30)) return;
    await sendToOwner(order, buildPaymentFailedEmail(order, dashboardOrderUrl(order.id)), "PAYMENT_FAILED");
  });
}

/** The gateway confirmed an online payment (lib/payments/settle) — once per order. */
export function queueOrderPaidEmail(orderId: string) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    if (!order || !wantsCustomerEmails(order)) return;
    await prepareCustomerEmail(order);
    await sendToCustomer(order, buildCustomerConfirmationEmail(order), "ORDER_CONFIRMATION");
  });
}

/** The merchant (or a carrier sync) moved the order to a new status. */
export function queueOrderStatusEmail(orderId: string, status: OrderStatus) {
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const order = await loadOrder(orderId);
    // A refused delivery is recorded as canceled + returned — nothing to tell the customer.
    if (!order || !wantsCustomerEmails(order) || order.status !== status || order.returnedAt) return;
    await prepareCustomerEmail(order);
    const mail = buildCustomerStatusEmail(order, status);
    if (mail) await sendToCustomer(order, mail, "ORDER_STATUS");
  });
}
