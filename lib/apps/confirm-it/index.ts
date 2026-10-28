// Confirm It (confirmit-eg.com) — WhatsApp order confirmation for COD stores.
//
// Out: every new order (after Casho's own phone check, if any) is POSTed to the
// merchant's Confirm It webhook URL, from after() with three tries.
// In: Confirm It POSTs the customer's answer to /api/apps/confirm-it/callback/<token>;
// the token is per store (only its hash is looked up), and the answer goes
// through the same path as Casho's own WhatsApp confirm link.

import { createHash, randomBytes } from "crypto";
import { OrderStatus, type Prisma } from "@prisma/client";

import { getPaymentMethodLabel } from "@/constants/payment-methods";
import { inBackground } from "@/lib/notifications/email/deliver";
import { applyCustomerAnswer } from "@/lib/orders/whatsapp-confirm";
import { parseOrderCode } from "@/lib/orders/tracking";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import {
  CONFIRM_IT_APP_ID,
  buildOrderPayload,
  readCallbackOrderRef,
  readCallbackReason,
  readCallbackStatus,
  readConfirmItSettings,
  type ConfirmItOrder,
  type ConfirmItSecrets,
  type ConfirmItSettings,
} from "./payload";

const RETRY_DELAYS_MS = [1_000, 4_000];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Callback token ──────────────────────────────────────────────────────────

export function hashCallbackToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newCallbackToken() {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashCallbackToken(token) };
}

/** Webhooks hit the dashboard host (app.casho.store); /api is never rewritten. */
export function confirmItCallbackUrl(token: string) {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.casho.store").replace(/\/$/, "");
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  let base = raw;
  try {
    const url = new URL(raw);
    if (url.hostname === rootDomain) base = `${url.protocol}//app.${url.host}`;
  } catch {
    // keep raw
  }
  return `${base}/api/apps/confirm-it/callback/${token}`;
}

// ─── Store config ────────────────────────────────────────────────────────────

export function readSecrets(credentials: string | null): ConfirmItSecrets | null {
  if (!credentials) return null;
  try {
    return JSON.parse(decryptSecret(credentials)) as ConfirmItSecrets;
  } catch {
    return null;
  }
}

export async function getConfirmItApp(storeId: string) {
  const row = await prisma.storeApp.findUnique({
    where: { storeId_appId: { storeId, appId: CONFIRM_IT_APP_ID } },
  });
  if (!row) return null;
  return { row, settings: readConfirmItSettings(row.settings), secrets: readSecrets(row.credentials) };
}

function handles(settings: ConfirmItSettings, paymentMethod: string) {
  return Boolean(settings.webhookUrl) && (!settings.codOnly || paymentMethod === "cash_on_delivery");
}

/** True when Confirm It takes this order — Casho then skips its own WhatsApp confirm message. */
export async function confirmItHandlesOrder(storeId: string, paymentMethod: string) {
  const app = await getConfirmItApp(storeId);
  return Boolean(app?.row.isActive && handles(app.settings, paymentMethod));
}

// ─── Sending orders ──────────────────────────────────────────────────────────

const ORDER_SELECT = {
  id: true,
  storeId: true,
  source: true,
  status: true,
  createdAt: true,
  fullName: true,
  phone: true,
  email: true,
  address: true,
  governorate: true,
  notes: true,
  paymentMethod: true,
  subtotal: true,
  shipping: true,
  discount: true,
  total: true,
  items: { select: { quantity: true, price: true, product: { select: { id: true, name: true, sku: true } } } },
  store: { select: { id: true, name: true, slug: true, customDomain: true, customDomainStatus: true } },
} satisfies Prisma.OrderSelect;

type LoadedOrder = Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT }>;

function toConfirmItOrder(order: LoadedOrder): ConfirmItOrder {
  return { ...order, paymentLabel: getPaymentMethodLabel(order.paymentMethod) };
}

export type SendResult = { ok: true } | { ok: false; error: string };

async function post(url: string, apiKey: string | undefined, body: unknown): Promise<SendResult> {
  let last = "";
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Casho-ConfirmIt/1.0",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) return { ok: true };
      last = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
      // 4xx (bad key, bad URL) won't fix itself on a retry; 408/429 might.
      if (res.status < 500 && res.status !== 408 && res.status !== 429) break;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
  }
  return { ok: false, error: last || "فشل الإرسال" };
}

async function send(app: NonNullable<Awaited<ReturnType<typeof getConfirmItApp>>>, order: LoadedOrder, event: "order.created" | "test") {
  if (!app.secrets) return { ok: false, error: "بيانات الربط تالفة — احفظ الإعدادات تاني" } satisfies SendResult;
  const payload = buildOrderPayload({
    event,
    order: toConfirmItOrder(order),
    store: { id: order.store.id, name: order.store.name, url: storeBaseUrl(order.store) },
    callbackUrl: confirmItCallbackUrl(app.secrets.callbackToken),
  });
  const result = await post(app.settings.webhookUrl, app.secrets.apiKey, payload);
  await prisma.storeApp.update({
    where: { id: app.row.id },
    data: result.ok ? { lastSyncAt: new Date(), lastError: null } : { lastError: result.error.slice(0, 500) },
  });
  return result;
}

/** Sends a new order to Confirm It when the store has it on. Never throws. */
export async function sendOrderToConfirmIt(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: ORDER_SELECT });
  if (!order || order.source === "POS" || order.status !== OrderStatus.PENDING) return;
  const app = await getConfirmItApp(order.storeId);
  if (!app?.row.isActive || !handles(app.settings, order.paymentMethod)) return;
  const result = await send(app, order, "order.created");
  if (!result.ok) console.error("[confirm-it] order", orderId, result.error);
}

export function queueConfirmItOrder(orderId: string) {
  inBackground(() => sendOrderToConfirmIt(orderId));
}

/** The store's latest order (or nothing) as a "test" event — for the connect page. */
export async function sendConfirmItTest(storeId: string): Promise<SendResult> {
  const app = await getConfirmItApp(storeId);
  if (!app?.settings.webhookUrl) return { ok: false, error: "حط رابط الـ Webhook الأول" };
  const order = await prisma.order.findFirst({
    where: { storeId, source: { not: "POS" } },
    orderBy: { createdAt: "desc" },
    select: ORDER_SELECT,
  });
  if (!order) return { ok: false, error: "محتاج طلب واحد على الأقل في المتجر عشان نبعته كتجربة" };
  return send(app, order, "test");
}

// ─── Callback ────────────────────────────────────────────────────────────────

export type CallbackResult =
  | { status: 200; body: { ok: true; applied: "confirm" | "cancel" | "none" } }
  | { status: 400 | 401 | 404 | 409; body: { ok: false; error: string } };

async function findOrder(storeId: string, ref: string) {
  const code = parseOrderCode(ref);
  if (!code) return null;
  const where: Prisma.OrderWhereInput =
    code.kind === "id"
      ? { id: code.value }
      : code.kind === "suffix"
        ? { id: { endsWith: code.value, mode: "insensitive" } }
        : { id: { startsWith: code.value, mode: "insensitive" } };
  const matches = await prisma.order.findMany({ where: { ...where, storeId }, select: { id: true }, take: 2 });
  return matches.length === 1 ? matches[0] : null;
}

export async function handleConfirmItCallback(token: string, body: Record<string, unknown>): Promise<CallbackResult> {
  const app = await prisma.storeApp.findUnique({
    where: { callbackTokenHash: hashCallbackToken(token) },
    select: { id: true, storeId: true, isActive: true, appId: true },
  });
  if (!app || app.appId !== CONFIRM_IT_APP_ID) return { status: 401, body: { ok: false, error: "Invalid callback URL" } };
  if (!app.isActive) return { status: 409, body: { ok: false, error: "Confirm It is turned off for this store" } };

  const ref = readCallbackOrderRef(body);
  if (!ref) return { status: 400, body: { ok: false, error: "Missing order_id" } };
  const order = await findOrder(app.storeId, ref);
  if (!order) return { status: 404, body: { ok: false, error: "Order not found" } };

  const answer = readCallbackStatus(body.status ?? body.confirmation_status ?? body.action);
  await prisma.storeApp.update({ where: { id: app.id }, data: { lastSyncAt: new Date() } });
  if (answer === "pending") return { status: 200, body: { ok: true, applied: "none" } };

  const changed = await applyCustomerAnswer(order.id, answer, { via: "confirm-it", reason: readCallbackReason(body) });
  if (!changed) return { status: 409, body: { ok: false, error: "Order can no longer change" } };
  return { status: 200, body: { ok: true, applied: answer } };
}
