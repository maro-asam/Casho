/**
 * Storefront order-flood protection. Every online order takes stock the moment
 * it is placed, so a bot spamming cash-on-delivery orders could mark a whole
 * store "sold out" and bury the merchant in notifications.
 *
 * DB-backed (counts recent Order rows) — no Redis / in-memory state, so it
 * holds across serverless instances. Limits are generous for real shoppers:
 * shared mobile IPs (CGNAT) are why the per-IP caps are per store first.
 */
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const LIMITS = {
  /** Same browser session, any store. */
  session: { max: 3, windowMs: 10 * MINUTE },
  /** Same IP on one store. */
  ipPerStore: { max: 5, windowMs: HOUR },
  /** Same IP across the whole platform. */
  ipGlobal: { max: 15, windowMs: HOUR },
  /** Open (still PENDING) orders on one store for the same phone. */
  phonePending: { max: 3, windowMs: 24 * HOUR },
};

export const ORDER_RATE_LIMIT_MESSAGE =
  "عدد الطلبات من الجهاز أو الرقم ده كتير في وقت قصير. استنى شوية وحاول تاني، أو كلّم المتجر مباشرة.";

const since = (windowMs: number) => new Date(Date.now() - windowMs);

/** True when this checkout should be refused. */
export async function isOrderRateLimited(input: {
  storeId: string;
  guestSessionId: string;
  phone: string;
  ipAddress: string | null;
}) {
  const { storeId, guestSessionId, phone, ipAddress } = input;

  const checks: Promise<boolean>[] = [
    prisma.order
      .count({ where: { guestSessionId, createdAt: { gte: since(LIMITS.session.windowMs) } } })
      .then((n) => n >= LIMITS.session.max),
    prisma.order
      .count({
        where: { storeId, phone, status: OrderStatus.PENDING, createdAt: { gte: since(LIMITS.phonePending.windowMs) } },
      })
      .then((n) => n >= LIMITS.phonePending.max),
  ];

  if (ipAddress) {
    checks.push(
      prisma.order
        .count({ where: { storeId, ipAddress, createdAt: { gte: since(LIMITS.ipPerStore.windowMs) } } })
        .then((n) => n >= LIMITS.ipPerStore.max),
      prisma.order
        .count({ where: { ipAddress, createdAt: { gte: since(LIMITS.ipGlobal.windowMs) } } })
        .then((n) => n >= LIMITS.ipGlobal.max),
    );
  }

  return (await Promise.all(checks)).some(Boolean);
}
