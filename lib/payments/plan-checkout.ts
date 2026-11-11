/**
 * TEMP (Nov 2026, Paymob onboarding): the landing page's pricing cards pay for
 * a plan straight on Paymob (Casho's own account), with no account first —
 * Paymob's review wants "pick a product → pay on their page" on the site.
 *
 * No table of its own: each checkout is a SecurityLog row (PLAN_CHECKOUT_STARTED,
 * details in `metadata`) that flips to PLAN_CHECKOUT_PAID once Paymob confirms.
 * The admin gets a Telegram message and activates the payer's store by hand.
 *
 * To turn it off: set DIRECT_PLAN_CHECKOUT to false — the cards go back to
 * /register and the callback route keeps settling in-flight payments.
 */
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { getPlatformPaymobCredentials, verifyPaymobHmac, type PaymobTransaction } from "@/lib/paymob";

export const DIRECT_PLAN_CHECKOUT = true;

export const PLAN_CHECKOUT_STARTED = "PLAN_CHECKOUT_STARTED";
export const PLAN_CHECKOUT_PAID = "PLAN_CHECKOUT_PAID";

/** `special_reference` prefix, so a plan payment can never be read as a top-up id. */
export const PLAN_REFERENCE_PREFIX = "plan_";

export type PlanCycle = "MONTHLY" | "YEARLY";

export type PlanCheckoutMeta = {
  reference: string;
  planId: string;
  planKey: string;
  planName: string;
  cycle: PlanCycle;
  /** Piasters. */
  amount: number;
  name: string;
  phone: string;
  email: string;
  transactionId?: string;
  sourceType?: string;
  paidAt?: string;
};

export type PlanCheckoutOutcome = "success" | "failed" | "pending" | "invalid";

/** On only while the flag is set and Casho's Paymob keys are configured. */
export function isDirectPlanCheckoutEnabled() {
  return DIRECT_PLAN_CHECKOUT && getPlatformPaymobCredentials() !== null;
}

const HOUR = 60 * 60 * 1000;
const LIMITS = { perIp: 10, perPhone: 5 };

function recentCheckouts(where: object) {
  return prisma.securityLog.count({
    where: {
      event: { in: [PLAN_CHECKOUT_STARTED, PLAN_CHECKOUT_PAID] },
      createdAt: { gte: new Date(Date.now() - HOUR) },
      ...where,
    },
  });
}

/** Intentions cost nothing, but a bot shouldn't be able to mint them endlessly. */
export async function isPlanCheckoutRateLimited(input: { phone: string; ipAddress: string | null }) {
  const checks = [
    recentCheckouts({ metadata: { path: ["phone"], equals: input.phone } }).then((n) => n >= LIMITS.perPhone),
  ];
  if (input.ipAddress) {
    checks.push(recentCheckouts({ ipAddress: input.ipAddress }).then((n) => n >= LIMITS.perIp));
  }
  return (await Promise.all(checks)).some(Boolean);
}

export async function recordPlanCheckout(meta: PlanCheckoutMeta, request: { ipAddress: string | null; userAgent: string | null }) {
  await prisma.securityLog.create({
    data: {
      event: PLAN_CHECKOUT_STARTED,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: meta,
    },
  });
}

const CYCLE_LABEL: Record<PlanCycle, string> = { MONTHLY: "شهري", YEARLY: "سنوي" };

async function notifyAdmin(meta: PlanCheckoutMeta) {
  await sendTelegramMessage(`
اشتراك مدفوع من صفحة الأسعار (Paymob)
الباقة: ${meta.planName} (${CYCLE_LABEL[meta.cycle]})
المبلغ: ${meta.amount / 100} جنيه
الاسم: ${meta.name}
الموبايل: ${meta.phone}
الإيميل: ${meta.email}
رقم العملية في Paymob: ${meta.transactionId ?? "-"}
فعّل الباقة لمتجره يدويًا بعد ما يسجّل.
`);
}

/**
 * Verifies a Paymob callback for a plan payment and, the first time it's paid,
 * marks the checkout paid and tells the admin. Safe to call from both the
 * webhook and the redirect, in any order.
 */
export async function settlePlanCheckout(
  tx: PaymobTransaction | null,
  hmac: string | null,
): Promise<{ outcome: PlanCheckoutOutcome; planKey?: string }> {
  const creds = getPlatformPaymobCredentials();
  const reference = tx?.merchantOrderId;
  if (!tx || !reference?.startsWith(PLAN_REFERENCE_PREFIX) || !creds) return { outcome: "invalid" };
  if (!verifyPaymobHmac(tx, hmac, creds.hmacSecret)) {
    console.error("[paymob plan] invalid hmac", { transactionId: tx.id });
    return { outcome: "invalid" };
  }

  const row = await prisma.securityLog.findFirst({
    where: {
      event: { in: [PLAN_CHECKOUT_STARTED, PLAN_CHECKOUT_PAID] },
      metadata: { path: ["reference"], equals: reference },
    },
    select: { id: true, event: true, metadata: true },
  });
  if (!row) return { outcome: "invalid" };

  const meta = row.metadata as PlanCheckoutMeta;
  if (tx.amountCents !== meta.amount || tx.currency !== "EGP") {
    console.error("[paymob plan] amount mismatch", { reference, expected: meta.amount, received: tx.amountCents });
    return { outcome: "invalid", planKey: meta.planKey };
  }
  // Kiosk-style payments report pending first; the final webhook settles them.
  if (tx.pending && !tx.success) return { outcome: "pending", planKey: meta.planKey };
  if (!tx.success) return { outcome: "failed", planKey: meta.planKey };
  if (row.event === PLAN_CHECKOUT_PAID) return { outcome: "success", planKey: meta.planKey };

  const paid: PlanCheckoutMeta = { ...meta, transactionId: tx.id, sourceType: tx.sourceType, paidAt: new Date().toISOString() };
  // Conditional update = atomic claim: when the webhook and the redirect race,
  // only one of them flips the row, so the admin hears about it once.
  const claimed = await prisma.securityLog.updateMany({
    where: { id: row.id, event: PLAN_CHECKOUT_STARTED },
    data: { event: PLAN_CHECKOUT_PAID, metadata: paid },
  });
  if (claimed.count === 1) await notifyAdmin(paid);

  return { outcome: "success", planKey: meta.planKey };
}

/** The marketing site (casho.store), where the payer lands after paying. */
export function marketingBaseUrl() {
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  try {
    const url = new URL(raw || `https://${rootDomain}`);
    if (url.hostname === `app.${rootDomain}`) url.hostname = rootDomain;
    return url.origin;
  } catch {
    return `https://${rootDomain}`;
  }
}
