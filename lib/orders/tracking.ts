// Customer order tracking (storefront /track): turns an order into what the
// shopper may see — a status timeline, the shipment and the items, never the
// address, phone or the merchant's notes — and signs the direct tracking links
// sent in emails and WhatsApp. DB access lives in ./track-order.
//
// Env: INTERNAL_API_SECRET (or CRON_SECRET) signs the links, like
// ./whatsapp-confirm. Without one, links fall back to a pre-filled search.

import { createHmac, timingSafeEqual } from "crypto";
import type { OrderConfirmationStatus, OrderStatus, ShipmentStatus } from "@prisma/client";

import { getPaymentMethodLabel, isManualPaymentMethod, isOnlinePaymentMethod } from "@/constants/payment-methods";
import { DIGITAL_ADDRESS } from "@/lib/products/digital";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import { SHIPMENT_STATUS_META, SHIPMENT_TRACK, readShipmentEvents } from "@/lib/shipping/shipment-status";

// ─── Order numbers ───────────────────────────────────────────────────────────

/** "#A1B2C3" — the number customers get in emails, WhatsApp and Telegram. */
export function orderNumber(orderId: string) {
  return `#${orderId.slice(-6).toUpperCase()}`;
}

/** How a typed order number narrows the search. */
export type OrderCode =
  | { kind: "id"; value: string }
  /** The 6 characters of "#A1B2C3". */
  | { kind: "suffix"; value: string }
  /** The 8-character reference carriers get (actions/store/shipments). */
  | { kind: "prefix"; value: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** "#a1b2c3", "A1B2C3", "٠١٢abc" or a full order id → what to look for; null if it can't be one. */
export function parseOrderCode(input: string): OrderCode | null {
  const clean = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s#]/g, "")
    .toLowerCase();
  if (UUID.test(clean)) return { kind: "id", value: clean };
  if (/^[0-9a-f]{6}$/.test(clean)) return { kind: "suffix", value: clean };
  if (/^[0-9a-f]{8}$/.test(clean)) return { kind: "prefix", value: clean };
  return null;
}

// ─── Signed links ────────────────────────────────────────────────────────────

function secret() {
  return process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || null;
}

function sign(orderId: string, key: string) {
  return createHmac("sha256", key).update(`order-track:${orderId}`).digest("base64url").slice(0, 24);
}

export function verifyOrderTrackToken(orderId: string, token: string | undefined | null) {
  const key = secret();
  if (!key || !token) return false;
  const expected = Buffer.from(sign(orderId, key));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Store-relative path that opens this order's tracking straight away (search pre-filled without a secret). */
export function orderTrackPath(orderId: string) {
  const key = secret();
  return key
    ? `/track?o=${orderId}&t=${sign(orderId, key)}`
    : `/track?order=${encodeURIComponent(orderNumber(orderId).slice(1))}`;
}

export function orderTrackUrl(
  store: { slug: string; customDomain?: string | null; customDomainStatus?: string | null },
  orderId: string,
) {
  return `${storeBaseUrl(store)}${orderTrackPath(orderId)}`;
}

// ─── View-model ──────────────────────────────────────────────────────────────

export type TrackedOrderStep = {
  label: string;
  /** ISO time, when known. */
  at: string | null;
  done: boolean;
  current: boolean;
  /** The order ended here (canceled / returned). */
  ended?: boolean;
};

export type TrackedShipment = {
  courier: string | null;
  trackingNumber: string | null;
  /** The carrier's own tracking page. */
  trackingUrl: string | null;
  statusLabel: string;
  /** Forward path (handed over → delivered); empty once the shipment left it. */
  progress: { label: string; done: boolean; current: boolean }[];
  estimatedDelivery: string | null;
  /** Cash to hand the courier (piasters) while it's still due. */
  codDue: number | null;
  /** Carrier scans and status changes, newest first. */
  events: { at: string; label: string; location: string | null }[];
};

export type TrackedOrder = {
  number: string;
  placedAt: string;
  /** progress: moving normally · attention: waiting on the shopper or a failed delivery · done · ended: canceled/returned */
  tone: "progress" | "attention" | "done" | "ended";
  headline: string;
  detail: string;
  steps: TrackedOrderStep[];
  shipment: TrackedShipment | null;
  items: { name: string; detail: string | null; quantity: number; image: string | null }[];
  /** Piasters. */
  total: number;
  paymentLabel: string;
};

/** The order fields buildTrackedOrder reads (see TRACKED_ORDER_SELECT in ./track-order). */
export type TrackableOrder = {
  id: string;
  status: OrderStatus;
  confirmationStatus: OrderConfirmationStatus;
  paymentMethod: string;
  address: string;
  total: number;
  createdAt: Date;
  paidAt: Date | null;
  returnedAt: Date | null;
  /** Legacy fields from before Shipment rows. */
  trackingNumber: string | null;
  shippingProvider: string | null;
  items: { quantity: number; selectedFeatures: unknown; product: { name: string; image: string } }[];
  /** Latest non-canceled shipment first. */
  shipments: {
    createdAt: Date;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShipmentStatus;
    codAmount: number | null;
    estimatedDelivery: Date | null;
    deliveredAt: Date | null;
    events: unknown;
  }[];
};

type Stage = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED";

const STAGE_RANK: Record<Stage, number> = { PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3 };
const STAGE_LABEL: Record<Stage, string> = {
  PENDING: "استلمنا طلبك",
  PAID: "اتدفع",
  SHIPPED: "اتشحن",
  DELIVERED: "اتسلّم",
};
const FULL_FLOW: Stage[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
const FEATURE_LABEL: Record<string, string> = { size: "المقاس", color: "اللون" };

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Same stages the merchant sees on the order (dashboard order-progress). */
function flowFor(order: TrackableOrder, digital: boolean, reached: Stage): Stage[] {
  if (digital) return ["PENDING", "PAID"];
  const flow: Stage[] = order.paymentMethod === "cash_on_delivery" ? ["PENDING", "SHIPPED", "DELIVERED"] : FULL_FLOW;
  return flow.includes(reached) ? flow : FULL_FLOW;
}

function buildSteps(order: TrackableOrder, digital: boolean): TrackedOrderStep[] {
  const shipment = order.shipments[0];
  const ended = order.status === "CANCELED";
  // How far a canceled order got before it ended.
  const reached: Stage =
    order.status !== "CANCELED" ? order.status : order.returnedAt ? "SHIPPED" : order.paidAt ? "PAID" : "PENDING";
  const reachedRank = STAGE_RANK[reached];
  const firstScan = shipment ? readShipmentEvents(shipment.events)[0]?.at ?? iso(shipment.createdAt) : null;

  const at: Record<Stage, string | null> = {
    PENDING: iso(order.createdAt),
    PAID: iso(order.paidAt),
    SHIPPED: firstScan,
    DELIVERED: iso(shipment?.deliveredAt),
  };

  const flow = flowFor(order, digital, reached).filter((s) => !ended || STAGE_RANK[s] <= reachedRank);
  const lastDone = flow.reduce((last, s, i) => (STAGE_RANK[s] <= reachedRank ? i : last), 0);
  // A cash-on-delivery order the merchant marked paid is confirmed, not paid by the shopper.
  const cod = order.paymentMethod === "cash_on_delivery";
  const steps: TrackedOrderStep[] = flow.map((s, i) => ({
    label: cod && s === "PAID" ? "اتأكد" : STAGE_LABEL[s],
    at: i <= lastDone ? at[s] : null,
    done: i <= lastDone,
    current: !ended && i === lastDone,
  }));

  if (ended) {
    steps.push({
      label: order.returnedAt ? "رجع للمتجر" : "اتلغى",
      at: iso(order.returnedAt),
      done: true,
      current: true,
      ended: true,
    });
  }
  return steps;
}

function buildShipment(order: TrackableOrder): TrackedShipment | null {
  const s = order.shipments[0];
  if (!s) {
    // Tracking number typed on the order before Shipment rows existed.
    if (!order.trackingNumber) return null;
    return {
      courier: order.shippingProvider,
      trackingNumber: order.trackingNumber,
      trackingUrl: null,
      statusLabel: order.status === "DELIVERED" ? "طلبك اتسلّم" : "طلبك مع شركة الشحن",
      progress: [],
      estimatedDelivery: null,
      codDue: null,
      events: [],
    };
  }

  const current = SHIPMENT_TRACK.indexOf(s.status);
  return {
    courier: s.courierName,
    trackingNumber: s.trackingNumber,
    trackingUrl: s.trackingUrl,
    statusLabel: SHIPMENT_STATUS_META[s.status].customerLabel,
    progress:
      current === -1
        ? []
        : SHIPMENT_TRACK.map((step, i) => ({
            label: SHIPMENT_STATUS_META[step].label,
            done: i <= current,
            current: i === current,
          })),
    estimatedDelivery: s.status === "DELIVERED" ? null : iso(s.estimatedDelivery),
    codDue: (s.codAmount ?? 0) > 0 && s.status !== "DELIVERED" ? s.codAmount : null,
    // The merchant's own notes stay private; carriers' scan text is shown as-is.
    events: readShipmentEvents(s.events)
      .map((e) => ({
        at: e.at,
        label: (e.source === "carrier" && e.note) || SHIPMENT_STATUS_META[e.status]?.customerLabel || "",
        location: e.location ?? null,
      }))
      .filter((e) => e.label)
      .reverse()
      .slice(0, 8),
  };
}

function summarize(
  order: TrackableOrder,
  digital: boolean,
  shipment: TrackedShipment | null,
): Pick<TrackedOrder, "tone" | "headline" | "detail"> {
  const s = order.shipments[0];

  switch (order.status) {
    case "CANCELED":
      return order.returnedAt
        ? {
            tone: "ended",
            headline: "الشحنة رجعت للمتجر",
            detail: "الطلب اتلغى بعد ما رجع من شركة الشحن. لو حابب تطلبه تاني تواصل مع المتجر.",
          }
        : { tone: "ended", headline: "طلبك اتلغى", detail: "لو الإلغاء حصل بالغلط أو عندك أي سؤال، تواصل مع المتجر." };

    case "DELIVERED":
      return { tone: "done", headline: "طلبك اتسلّم", detail: "نتمنى المنتجات تعجبك، ويسعدنا نشوفك تاني." };

    case "SHIPPED":
      return {
        tone: s?.status === "FAILED_DELIVERY" ? "attention" : "progress",
        headline: shipment?.statusLabel ?? "طلبك اتشحن",
        detail: shipment?.courier
          ? `طلبك مع ${shipment.courier}. تقدر تتابع كل خطوة في الشحنة تحت.`
          : "طلبك خرج من المتجر ومع شركة الشحن دلوقتي.",
      };

    case "PAID":
      return digital
        ? {
            tone: "done",
            headline: "طلبك جاهز",
            detail: "الدفع وصل. روابط التحميل في صفحة الطلب على الجهاز اللي طلبت منه، أو اطلبها من المتجر.",
          }
        : {
            tone: "progress",
            headline: "بنجهّز طلبك",
            detail:
              order.paymentMethod === "cash_on_delivery"
                ? "طلبك اتأكد وبيتجهّز للشحن."
                : "الدفع وصل وطلبك بيتجهّز للشحن.",
          };

    case "PENDING":
      if (order.confirmationStatus === "PENDING") {
        return {
          tone: "attention",
          headline: "طلبك مستني تأكيدك",
          detail: "اكتب الكود اللي وصلك على الموبايل عشان المتجر يبدأ يجهّزه — الطلب بيتلغي لوحده لو ماتأكدش.",
        };
      }
      if (!order.paidAt && isManualPaymentMethod(order.paymentMethod)) {
        return {
          tone: "attention",
          headline: "مستنيين التحويل",
          detail: "كمّل تحويل المبلغ على بيانات الدفع اللي ظهرتلك بعد الطلب، والمتجر هيأكّده أول ما يوصل.",
        };
      }
      if (!order.paidAt && isOnlinePaymentMethod(order.paymentMethod)) {
        return {
          tone: "attention",
          headline: "الدفع لسه ماتأكدش",
          detail: "بنستنى تأكيد العملية من بوابة الدفع — الحالة هتتحدث أول ما يوصل.",
        };
      }
      return {
        tone: "progress",
        headline: "طلبك وصل للمتجر",
        detail: "المتجر هيراجعه ويتواصل معاك لتأكيده وميعاد التوصيل.",
      };
  }
}

export function buildTrackedOrder(order: TrackableOrder): TrackedOrder {
  const digital = order.address === DIGITAL_ADDRESS;
  const shipment = digital ? null : buildShipment(order);

  return {
    number: orderNumber(order.id),
    placedAt: order.createdAt.toISOString(),
    ...summarize(order, digital, shipment),
    steps: buildSteps(order, digital),
    shipment,
    items: order.items.map((item) => {
      const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
      return {
        name: item.product.name,
        detail: features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ") || null,
        quantity: item.quantity,
        image: item.product.image || null,
      };
    }),
    total: order.total,
    paymentLabel: getPaymentMethodLabel(order.paymentMethod),
  };
}
