// Pure pieces of the Confirm It integration: the order we send them and how we
// read the status they send back. No DB, no network — see ./index.ts for those.

import { orderNumber } from "@/lib/orders/tracking";

export const CONFIRM_IT_APP_ID = "confirm-it";

/** Non-secret settings (StoreApp.settings). */
export type ConfirmItSettings = {
  /** Where new orders are POSTed — the webhook URL from the Confirm It dashboard. */
  webhookUrl: string;
  /** Only cash-on-delivery orders (online-paid orders don't need confirming). */
  codOnly: boolean;
};

/** Secrets (StoreApp.credentials, encrypted). */
export type ConfirmItSecrets = {
  /** Sent as `Authorization: Bearer …` when the merchant has one. */
  apiKey?: string;
  /** The token in our callback URL, kept so the page can show the URL again. */
  callbackToken: string;
};

export function readConfirmItSettings(value: unknown): ConfirmItSettings {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<ConfirmItSettings>;
  return {
    webhookUrl: typeof raw.webhookUrl === "string" ? raw.webhookUrl : "",
    codOnly: raw.codOnly !== false,
  };
}

/** https only (http allowed for localhost while developing). */
export function isValidWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export type ConfirmItOrder = {
  id: string;
  createdAt: Date;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  governorate: string | null;
  notes: string | null;
  paymentMethod: string;
  paymentLabel: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: { quantity: number; price: number; product: { id: string; name: string; sku: string | null } }[];
};

const egp = (piasters: number) => Math.round(piasters) / 100;

/**
 * The body POSTed to Confirm It for a new order. Amounts are EGP (decimal) —
 * the `_piasters` twins are exact. Their "custom site" contract isn't public,
 * so the field names follow the common Shopify/WooCommerce-style shape.
 */
export function buildOrderPayload(input: {
  event: "order.created" | "test";
  order: ConfirmItOrder;
  store: { id: string; name: string; url: string };
  callbackUrl: string;
}) {
  const { order } = input;
  return {
    event: input.event,
    source: "casho",
    store: input.store,
    callback_url: input.callbackUrl,
    order: {
      id: order.id,
      number: orderNumber(order.id),
      created_at: order.createdAt.toISOString(),
      currency: "EGP",
      payment_method: order.paymentMethod,
      payment_method_label: order.paymentLabel,
      is_cod: order.paymentMethod === "cash_on_delivery",
      subtotal: egp(order.subtotal),
      shipping: egp(order.shipping),
      discount: egp(order.discount),
      total: egp(order.total),
      total_piasters: order.total,
      customer: {
        name: order.fullName,
        phone: order.phone,
        email: order.email,
      },
      shipping_address: {
        address: order.address,
        governorate: order.governorate,
      },
      notes: order.notes,
      items: order.items.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: egp(item.price),
        price_piasters: item.price,
      })),
    },
  };
}

export type ConfirmItAnswer = "confirm" | "cancel" | "pending";

const CONFIRM_WORDS = new Set(["confirm", "confirmed", "approved", "accepted", "yes", "تم التأكيد", "مؤكد"]);
const CANCEL_WORDS = new Set(["cancel", "canceled", "cancelled", "rejected", "declined", "refused", "no", "ملغي", "تم الإلغاء"]);

/**
 * What a callback means for the order. Anything we don't recognise (no answer,
 * call scheduled, edit requested…) leaves the order as it is.
 */
export function readCallbackStatus(status: unknown): ConfirmItAnswer {
  const value = String(status ?? "").trim().toLowerCase();
  if (CONFIRM_WORDS.has(value)) return "confirm";
  if (CANCEL_WORDS.has(value)) return "cancel";
  return "pending";
}

/** The order id from a callback body, however Confirm It nests it. */
export function readCallbackOrderRef(body: Record<string, unknown>): string | null {
  const order = body.order && typeof body.order === "object" ? (body.order as Record<string, unknown>) : null;
  const candidates = [body.order_id, body.orderId, body.external_id, order?.id, order?.order_id, body.id];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function readCallbackReason(body: Record<string, unknown>): string | null {
  const value = body.reason ?? body.cancel_reason ?? body.note;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 300) : null;
}
