// Order lookups for the storefront /track page, and the brute-force guard on
// them. Failed searches are SecurityLog rows (event ORDER_TRACK_FAILED), so
// the limit holds across serverless instances — no Redis, no new table — and
// shows up in /admin/security.

import type { Prisma } from "@prisma/client";

import { canonicalPhone, phoneVariants } from "@/lib/fraud/phone";
import { prisma } from "@/lib/prisma";
import { buildTrackedOrder, type OrderCode, type TrackedOrder } from "./tracking";

const TRACKED_ORDER_SELECT = {
  id: true,
  status: true,
  confirmationStatus: true,
  paymentMethod: true,
  address: true,
  total: true,
  createdAt: true,
  paidAt: true,
  returnedAt: true,
  trackingNumber: true,
  shippingProvider: true,
  items: { select: { quantity: true, selectedFeatures: true, product: { select: { name: true, image: true } } } },
  shipments: {
    where: { status: { not: "CANCELED" } },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      createdAt: true,
      courierName: true,
      trackingNumber: true,
      trackingUrl: true,
      status: true,
      codAmount: true,
      estimatedDelivery: true,
      deliveredAt: true,
      events: true,
    },
  },
} satisfies Prisma.OrderSelect;

/** The shopper's order in this store, matched by its number and the phone it was placed with. POS sales aren't tracked. */
export async function findTrackedOrder(input: { storeId: string; code: OrderCode; phone: string }): Promise<TrackedOrder | null> {
  const { storeId, code, phone } = input;
  const order = await prisma.order.findFirst({
    where: {
      storeId,
      source: { not: "POS" },
      phone: { in: phoneVariants(phone) },
      id: code.kind === "id" ? code.value : code.kind === "suffix" ? { endsWith: code.value } : { startsWith: code.value },
    },
    orderBy: { createdAt: "desc" },
    select: TRACKED_ORDER_SELECT,
  });
  return order ? buildTrackedOrder(order) : null;
}

/** For signed links — the token already proves the link was sent for this order. */
export async function loadTrackedOrder(storeId: string, orderId: string): Promise<TrackedOrder | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId, source: { not: "POS" } },
    select: TRACKED_ORDER_SELECT,
  });
  return order ? buildTrackedOrder(order) : null;
}

// ─── Rate limit ──────────────────────────────────────────────────────────────

const EVENT = "ORDER_TRACK_FAILED";
const MINUTE = 60 * 1000;

/** Failed searches only — a shopper who finds their order is never slowed down. */
const LIMITS = {
  /** Same IP on one store. */
  ipPerStore: { max: 10, windowMs: 15 * MINUTE },
  /** Same IP across every store. */
  ipGlobal: { max: 30, windowMs: 60 * MINUTE },
  /** Same phone on one store — guessing the order numbers of someone whose number you know. */
  phonePerStore: { max: 6, windowMs: 60 * MINUTE },
};

export const TRACK_RATE_LIMIT_MESSAGE = "محاولات كتير في وقت قصير. استنى شوية وحاول تاني، أو كلّم المتجر مباشرة.";

function failures(windowMs: number, where: Prisma.SecurityLogWhereInput) {
  return prisma.securityLog.count({
    where: { event: EVENT, createdAt: { gte: new Date(Date.now() - windowMs) }, ...where },
  });
}

const onStore = (storeId: string): Prisma.SecurityLogWhereInput => ({ metadata: { path: ["storeId"], equals: storeId } });

/** True when this search should be refused before touching orders. */
export async function isTrackRateLimited(input: { storeId: string; phone: string; ipAddress: string | null }) {
  const { storeId, phone, ipAddress } = input;

  const checks = [
    failures(LIMITS.phonePerStore.windowMs, {
      AND: [onStore(storeId), { metadata: { path: ["phone"], equals: canonicalPhone(phone) } }],
    }).then((n) => n >= LIMITS.phonePerStore.max),
  ];
  if (ipAddress) {
    checks.push(
      failures(LIMITS.ipPerStore.windowMs, { ipAddress, ...onStore(storeId) }).then((n) => n >= LIMITS.ipPerStore.max),
      failures(LIMITS.ipGlobal.windowMs, { ipAddress }).then((n) => n >= LIMITS.ipGlobal.max),
    );
  }

  return (await Promise.all(checks)).some(Boolean);
}

/** Awaited (not fire-and-forget) so the next search already counts it. Never throws. */
export async function recordTrackFailure(input: { storeId: string; phone: string; ipAddress: string | null; userAgent: string | null }) {
  await prisma.securityLog
    .create({
      data: {
        event: EVENT,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: { storeId: input.storeId, phone: canonicalPhone(input.phone) },
      },
    })
    .catch((err) => console.error("[track-order] failed to log a failed search:", err));
}
