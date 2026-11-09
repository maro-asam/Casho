// ─────────────────────────────────────────────────────────────────────────────
//  Domains bought for a store: the money and the lifecycle.
//
//  Buy:   re-quote → charge the balance + reserve the row (one transaction)
//         → order at Vercel → ACTIVE + connect to the store, or refund.
//  Renew: from RENEW_WINDOW_DAYS before expiry the hourly sweep charges the
//         renewal and renews at Vercel (refunded if Vercel doesn't); without
//         balance the owner is reminded; past the grace week it EXPIRES.
//
//  Every money step is conditional on the state it read, so double clicks,
//  overlapping cron runs and retries can't charge or refund twice. Ledger rows
//  are DOMAIN_CHARGE / DOMAIN_REFUND — never subscription revenue.
// ─────────────────────────────────────────────────────────────────────────────

import { BalanceTransactionType, NotificationType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createStoreNotification, formatPiastersAsEgp } from "@/lib/notifications/in-app";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { addProjectDomain, removeProjectDomain, vercelConfigured } from "@/lib/custom-domain/vercel";
import { runDomainCheck } from "@/lib/custom-domain/verify";
import { MAX_USD_PRICE, nextExpiry, renewalAction, RENEW_WINDOW_DAYS, sellPrice, shouldSendRenewalNotice, toOffer, usdToCents } from "./pricing";
import { buyDomain, getDomainPrice, getOrderOutcome, getTeamDomain, registrarConfigured, renewDomain, searchDomains } from "./registrar";
import { domainSalesOpen, getDomainSettings } from "./settings";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** A call whose answer was lost: give Vercel this long to show the result before refunding. */
const LOST_CALL_WAIT = 2 * HOUR;
/** renewalOrderId while the charge is done but Vercel wasn't asked yet / its answer was lost. */
const STARTING = "starting";
const UNKNOWN = "unknown";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cairoDate = (d: Date) => d.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });

function safeRevalidate(slug?: string) {
  try {
    revalidatePath("/dashboard", "layout");
    if (slug) revalidateStorefront(slug);
  } catch {
    // Outside a request (cron/scripts): nothing cached to refresh here.
  }
}

class Abort extends Error {
  constructor(readonly reason: "busy" | "short") {
    super(reason);
  }
}

// ── Buying ──────────────────────────────────────────────────────────────────

export type PurchaseResult =
  | { ok: true; registrationId: string; status: "PENDING" | "ACTIVE" }
  | { ok: false; reason: "closed" | "unavailable" | "price-changed" | "short" | "busy" | "failed"; message: string; price?: number };

function buyErrorMessage(code?: string) {
  if (code === "domain_not_available") return "الدومين ده اتحجز لسه. اختار اسم تاني — ورجّعنا المبلغ لرصيدك.";
  if (code === "expected_price_mismatch") return "سعر الدومين اتغيّر وإحنا بنشتريه. رجّعنا المبلغ لرصيدك — دوّر تاني وهتلاقي السعر الجديد.";
  return "شركة الدومينات رفضت الطلب. رجّعنا المبلغ لرصيدك — جرّب تاني أو كلّم الدعم.";
}

/**
 * Buys `domain` for one year with the store's balance. `expectedPrice` is the
 * price (piasters) the merchant confirmed — a different live price stops the
 * purchase so they never pay what they didn't see.
 */
export async function purchaseDomain(input: { storeId: string; domain: string; expectedPrice: number }): Promise<PurchaseResult> {
  const { storeId, domain } = input;
  const settings = await getDomainSettings();
  if (!domainSalesOpen(settings) || !settings.registrant) {
    return { ok: false, reason: "closed", message: "شراء الدومينات من كاشو مش متاح دلوقتي." };
  }

  const hit = (await searchDomains([domain]))?.[0];
  if (!hit) return { ok: false, reason: "failed", message: "مقدرناش نوصل لشركة الدومينات دلوقتي. جرّب كمان شوية." };
  const offer = toOffer(hit, settings);
  if (!offer.available || !hit.available) return { ok: false, reason: "unavailable", message: "الدومين ده مش متاح للشراء. اختار اسم تاني." };
  const price = offer.price;
  if (price !== input.expectedPrice) {
    return { ok: false, reason: "price-changed", price, message: `سعر الدومين اتغيّر لـ ${formatPiastersAsEgp(price)}. راجع السعر الجديد وأكّد تاني.` };
  }

  let registrationId: string;
  try {
    registrationId = await prisma.$transaction(async (tx) => {
      const existing = await tx.domainRegistration.findUnique({ where: { domain }, select: { id: true, status: true } });
      if (existing && (existing.status === "PENDING" || existing.status === "ACTIVE")) throw new Abort("busy");

      const charged = await tx.store.updateMany({ where: { id: storeId, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count !== 1) throw new Abort("short");

      const data = {
        storeId,
        status: "PENDING" as const,
        orderId: null,
        costUsdCents: usdToCents(hit.price),
        renewalCostUsdCents: usdToCents(hit.renewalPrice),
        pricePaid: price,
        usdRate: settings.usdRate,
        autoRenew: true,
        expiresAt: null,
        renewedAt: null,
        renewalNoticeAt: null,
        renewalFailedAt: null,
        lastError: null,
        renewalOrderId: null,
        renewalCharge: null,
        renewalStartedAt: null,
      };
      let id: string;
      if (existing) {
        // A failed or lapsed registration of the same name gets reused.
        const reused = await tx.domainRegistration.updateMany({ where: { id: existing.id, status: { in: ["FAILED", "EXPIRED"] } }, data });
        if (reused.count !== 1) throw new Abort("busy");
        id = existing.id;
      } else {
        id = (await tx.domainRegistration.create({ data: { ...data, domain }, select: { id: true } })).id;
      }

      const fresh = await tx.store.findUniqueOrThrow({ where: { id: storeId }, select: { balance: true } });
      await tx.balanceTransaction.create({
        data: {
          storeId,
          type: BalanceTransactionType.DOMAIN_CHARGE,
          amount: -price,
          balanceBefore: fresh.balance + price,
          balanceAfter: fresh.balance,
          note: `شراء الدومين ${domain} (سنة)`,
          reference: id,
        },
      });
      return id;
    });
  } catch (error) {
    if (error instanceof Abort && error.reason === "short") {
      return { ok: false, reason: "short", price, message: "رصيدك مش مكفي. اشحن رصيدك وارجع اشتري الدومين." };
    }
    if (error instanceof Abort || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return { ok: false, reason: "busy", message: "الدومين ده بيتسجّل دلوقتي أو متسجّل بالفعل." };
    }
    throw error;
  }
  safeRevalidate();

  const order = await buyDomain(domain, { expectedPrice: hit.price, contact: settings.registrant });
  if (!order.ok) {
    if (order.definite) {
      await refundPurchase(registrationId, order.code ?? `http-${order.status}`, { notify: false });
      return { ok: false, reason: "failed", message: buyErrorMessage(order.code) };
    }
    // No answer: maybe it went through. settlePurchase finds out from Vercel.
    await prisma.domainRegistration.update({ where: { id: registrationId }, data: { lastError: "buy-no-answer" } });
    return { ok: true, registrationId, status: "PENDING" };
  }

  await prisma.domainRegistration.update({ where: { id: registrationId }, data: { orderId: order.data.orderId } });
  // Most orders finish in seconds — wait a little so the merchant sees it done.
  for (let i = 0; i < 4; i++) {
    await sleep(1500);
    const status = await settlePurchase(registrationId);
    if (status === "ACTIVE") return { ok: true, registrationId, status };
    if (status === "FAILED") return { ok: false, reason: "failed", message: buyErrorMessage() };
  }
  return { ok: true, registrationId, status: "PENDING" };
}

/** Moves a running purchase forward from Vercel's answer. Safe to call any time, from anywhere. */
export async function settlePurchase(id: string): Promise<"PENDING" | "ACTIVE" | "FAILED"> {
  const reg = await prisma.domainRegistration.findUnique({
    where: { id },
    select: { id: true, storeId: true, domain: true, status: true, orderId: true, updatedAt: true },
  });
  if (!reg) return "FAILED";
  if (reg.status !== "PENDING") return reg.status === "ACTIVE" ? "ACTIVE" : "FAILED";

  const stale = Date.now() - reg.updatedAt.getTime() > LOST_CALL_WAIT;
  if (reg.orderId) {
    const res = await getOrderOutcome(reg.orderId, reg.domain);
    if (res?.outcome === "failed") {
      await refundPurchase(reg.id, res.error ?? "order-failed");
      return "FAILED";
    }
    if (res?.outcome === "completed") {
      await activatePurchase(reg);
      return "ACTIVE";
    }
    // Still running — or Vercel can't tell us about the order. Only a long
    // silence falls through to asking whether the domain landed on the team.
    if (res || !stale) return "PENDING";
  }

  // No usable order answer: Vercel holding the domain as bought means it went through.
  const held = await getTeamDomain(reg.domain);
  if (held && held !== "missing" && held.boughtAt) {
    await activatePurchase(reg);
    return "ACTIVE";
  }
  if (held === "missing" && stale) {
    await refundPurchase(reg.id, "buy-lost");
    return "FAILED";
  }
  return "PENDING";
}

async function activatePurchase(reg: { id: string; storeId: string; domain: string }) {
  const held = await getTeamDomain(reg.domain);
  const now = new Date();
  const expiresAt = held && held !== "missing" && held.expiresAt ? held.expiresAt : nextExpiry(now, now);
  const moved = await prisma.domainRegistration.updateMany({
    where: { id: reg.id, status: "PENDING" },
    data: { status: "ACTIVE", expiresAt, lastError: null },
  });
  if (moved.count !== 1) return;

  const attached = await attachRegisteredDomain(reg.storeId, reg.domain).catch((error) => {
    console.error("[domains] attach", reg.domain, error);
    return false;
  });
  await createStoreNotification({
    storeId: reg.storeId,
    type: NotificationType.SYSTEM,
    title: "دومينك اتسجّل 🎉",
    message: attached
      ? `${reg.domain} بقى بتاعك وبنجهّزه لمتجرك — بياخد من دقايق لساعة.`
      : `${reg.domain} بقى بتاعك. اربطه بمتجرك من صفحة الدومين.`,
    href: "/domain",
  });
}

/** Undoes a purchase that didn't go through: FAILED + the full price back to the balance (once). */
async function refundPurchase(id: string, error: string, opts: { notify?: boolean } = {}) {
  const row = await prisma.$transaction(async (tx) => {
    const moved = await tx.domainRegistration.updateMany({ where: { id, status: "PENDING" }, data: { status: "FAILED", lastError: error.slice(0, 200) } });
    if (moved.count !== 1) return null;
    const reg = await tx.domainRegistration.findUniqueOrThrow({ where: { id }, select: { storeId: true, domain: true, pricePaid: true } });
    const store = await tx.store.update({ where: { id: reg.storeId }, data: { balance: { increment: reg.pricePaid } }, select: { balance: true } });
    await tx.balanceTransaction.create({
      data: {
        storeId: reg.storeId,
        type: BalanceTransactionType.DOMAIN_REFUND,
        amount: reg.pricePaid,
        balanceBefore: store.balance - reg.pricePaid,
        balanceAfter: store.balance,
        note: `استرجاع ثمن الدومين ${reg.domain} — التسجيل ماكملش`,
        reference: id,
      },
    });
    return reg;
  });
  if (!row) return;
  safeRevalidate();
  if (opts.notify !== false) {
    await createStoreNotification({
      storeId: row.storeId,
      type: NotificationType.SYSTEM,
      title: "الدومين ماتسجّلش",
      message: `تسجيل ${row.domain} ماكملش، ورجّعنا ${formatPiastersAsEgp(row.pricePaid)} لرصيدك.`,
      href: "/domain",
    });
  }
}

/**
 * Points a domain Casho registered for this store at it. Without `replace` it
 * only fills an empty slot (or re-checks the same domain); with it, it takes
 * over from the store's current domain. Any other store's claim on the name is
 * dropped — the registration proves it belongs to this store.
 */
export async function attachRegisteredDomain(storeId: string, domain: string, opts: { replace?: boolean } = {}) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
  });
  if (!store) return false;
  if (store.customDomain === domain) {
    await runDomainCheck({ ...store, customDomain: domain });
    return true;
  }
  if (store.customDomain && !opts.replace) return false;

  const others = await prisma.store.findMany({ where: { customDomain: domain, id: { not: storeId } }, select: { id: true, slug: true } });
  for (const other of others) {
    await prisma.store.update({
      where: { id: other.id },
      data: { customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
    });
    safeRevalidate(other.slug);
  }

  if (vercelConfigured) {
    if (store.customDomain) await removeProjectDomain(store.customDomain);
    const added = await addProjectDomain(domain);
    // Not fatal: every domain check (and the verify-domains cron) adds it again.
    if (!added.ok) console.error("[domains] add to project", domain, added.message);
  }
  await prisma.store.update({
    where: { id: storeId },
    data: { customDomain: domain, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
  });
  await runDomainCheck({ id: storeId, slug: store.slug, customDomain: domain, customDomainStatus: "PENDING" }).catch((error) =>
    console.error("[domains] first check", domain, error),
  );
  safeRevalidate(store.slug);
  return true;
}

// ── Renewing ────────────────────────────────────────────────────────────────

type RenewalRow = {
  id: string;
  storeId: string;
  domain: string;
  expiresAt: Date | null;
  renewalOrderId: string | null;
  renewalCharge: number | null;
  renewalStartedAt: Date | null;
  renewalFailedAt: Date | null;
};

const RENEWAL_SELECT = {
  id: true,
  storeId: true,
  domain: true,
  expiresAt: true,
  renewalOrderId: true,
  renewalCharge: true,
  renewalStartedAt: true,
  renewalFailedAt: true,
} as const;

/** Charges the renewal and asks Vercel for it. */
async function startRenewal(reg: RenewalRow & { expiresAt: Date }, usd: number, price: number, now: Date) {
  let started = false;
  try {
    started = await prisma.$transaction(async (tx) => {
      const marked = await tx.domainRegistration.updateMany({
        where: { id: reg.id, status: "ACTIVE", renewalOrderId: null, expiresAt: reg.expiresAt },
        data: { renewalOrderId: STARTING, renewalCharge: price, renewalStartedAt: now },
      });
      if (marked.count !== 1) return false;
      const charged = await tx.store.updateMany({ where: { id: reg.storeId, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count !== 1) throw new Abort("short");
      const fresh = await tx.store.findUniqueOrThrow({ where: { id: reg.storeId }, select: { balance: true } });
      await tx.balanceTransaction.create({
        data: {
          storeId: reg.storeId,
          type: BalanceTransactionType.DOMAIN_CHARGE,
          amount: -price,
          balanceBefore: fresh.balance + price,
          balanceAfter: fresh.balance,
          note: `تجديد الدومين ${reg.domain} (سنة)`,
          reference: reg.id,
        },
      });
      return true;
    });
  } catch (error) {
    if (error instanceof Abort) return false;
    throw error;
  }
  if (!started) return false;
  safeRevalidate();

  const res = await renewDomain(reg.domain, { expectedPrice: usd });
  if (!res.ok) {
    if (res.definite) await refundRenewal(reg.id, STARTING, res.code ?? `http-${res.status}`);
    else await prisma.domainRegistration.updateMany({ where: { id: reg.id, renewalOrderId: STARTING }, data: { renewalOrderId: UNKNOWN } });
    return true;
  }
  await prisma.domainRegistration.updateMany({ where: { id: reg.id, renewalOrderId: STARTING }, data: { renewalOrderId: res.data.orderId } });
  await sleep(1500);
  await settleRenewal(reg.id, now);
  return true;
}

/** Moves a renewal in flight forward from Vercel's answer. */
async function settleRenewal(id: string, now: Date) {
  const reg = await prisma.domainRegistration.findUnique({ where: { id }, select: RENEWAL_SELECT });
  if (!reg?.renewalOrderId || !reg.expiresAt) return;
  const flight = reg.renewalOrderId;
  const age = now.getTime() - (reg.renewalStartedAt?.getTime() ?? 0);

  if (flight === STARTING || flight === UNKNOWN) {
    // Charged, but Vercel's answer is missing (or the run died mid-way). A
    // fresh "starting" may still be running in another process — leave it.
    if (flight === STARTING && age < 15 * MINUTE) return;
    const held = await getTeamDomain(reg.domain);
    if (held && held !== "missing" && held.expiresAt && held.expiresAt.getTime() > reg.expiresAt.getTime() + 30 * DAY) {
      await completeRenewal(reg, flight, held.expiresAt, now);
    } else if (held !== null && age > LOST_CALL_WAIT) {
      // Vercel answered and the expiry didn't move: the renewal never happened.
      await refundRenewal(reg.id, flight, "renew-lost");
    }
    return;
  }

  const res = await getOrderOutcome(flight, reg.domain);
  if (!res || res.outcome === "pending") return;
  if (res.outcome === "failed") {
    await refundRenewal(reg.id, flight, res.error ?? "renew-failed");
    return;
  }
  const held = await getTeamDomain(reg.domain);
  const vercelExpiry = held && held !== "missing" ? held.expiresAt : null;
  await completeRenewal(reg, flight, vercelExpiry && vercelExpiry > reg.expiresAt ? vercelExpiry : nextExpiry(reg.expiresAt, now), now);
}

async function completeRenewal(reg: RenewalRow, flight: string, expiresAt: Date, now: Date) {
  const done = await prisma.domainRegistration.updateMany({
    where: { id: reg.id, renewalOrderId: flight },
    data: {
      expiresAt,
      renewedAt: now,
      renewalOrderId: null,
      renewalCharge: null,
      renewalStartedAt: null,
      renewalFailedAt: null,
      renewalNoticeAt: null,
      lastError: null,
    },
  });
  if (done.count !== 1) return;
  await createStoreNotification({
    storeId: reg.storeId,
    type: NotificationType.SYSTEM,
    title: "دومينك اتجدد",
    message: `اتخصم ${formatPiastersAsEgp(reg.renewalCharge ?? 0)} من رصيدك و${reg.domain} شغّال لحد ${cairoDate(expiresAt)}.`,
    href: "/domain",
  });
}

/** Gives a failed renewal's charge back (once) and waits a day before trying again. */
async function refundRenewal(id: string, flight: string, error: string) {
  const row = await prisma.$transaction(async (tx) => {
    const reg = await tx.domainRegistration.findUnique({ where: { id }, select: { storeId: true, domain: true, renewalCharge: true, renewalFailedAt: true } });
    if (!reg) return null;
    const moved = await tx.domainRegistration.updateMany({
      where: { id, renewalOrderId: flight },
      data: { renewalOrderId: null, renewalCharge: null, renewalStartedAt: null, renewalFailedAt: new Date(), lastError: error.slice(0, 200) },
    });
    if (moved.count !== 1) return null;
    const amount = reg.renewalCharge ?? 0;
    if (amount > 0) {
      const store = await tx.store.update({ where: { id: reg.storeId }, data: { balance: { increment: amount } }, select: { balance: true } });
      await tx.balanceTransaction.create({
        data: {
          storeId: reg.storeId,
          type: BalanceTransactionType.DOMAIN_REFUND,
          amount,
          balanceBefore: store.balance - amount,
          balanceAfter: store.balance,
          note: `استرجاع تجديد الدومين ${reg.domain} — التجديد ماكملش`,
          reference: id,
        },
      });
    }
    return { ...reg, amount, firstFailure: !reg.renewalFailedAt };
  });
  if (!row) return;
  safeRevalidate();
  console.error("[domains] renewal failed", row.domain, error);
  if (row.firstFailure) {
    await createStoreNotification({
      storeId: row.storeId,
      type: NotificationType.SYSTEM,
      title: "تجديد الدومين اتأخر",
      message: `مقدرناش نجدد ${row.domain} دلوقتي، فرجّعنا ${formatPiastersAsEgp(row.amount)} لرصيدك. هنحاول تاني تلقائي.`,
      href: "/domain",
    });
  }
}

/** Lets a registration go: EXPIRED, and the store goes back to its Casho address. */
async function expireRegistration(reg: RenewalRow) {
  const moved = await prisma.domainRegistration.updateMany({
    where: { id: reg.id, status: "ACTIVE", renewalOrderId: null },
    data: { status: "EXPIRED" },
  });
  if (moved.count !== 1) return;

  const store = await prisma.store.findFirst({ where: { id: reg.storeId, customDomain: reg.domain }, select: { id: true, slug: true } });
  if (store) {
    if (vercelConfigured) await removeProjectDomain(reg.domain);
    await prisma.store.update({
      where: { id: store.id },
      data: { customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true },
    });
    safeRevalidate(store.slug);
  }
  await createStoreNotification({
    storeId: reg.storeId,
    type: NotificationType.SYSTEM,
    title: "الدومين خلص",
    message: store ? `${reg.domain} ماتجددش، ومتجرك رجع على رابط كاشو.` : `${reg.domain} ماتجددش وخلص.`,
    href: "/domain",
  });
}

/**
 * The hourly sweep (renew-subscriptions cron): settles purchases and renewals
 * still running, renews what's due from the balance, reminds stores that
 * can't cover it and lets go of what lapsed.
 */
export async function sweepDomainRegistrations(now = new Date()) {
  const out = { purchases: 0, renewals: 0, reminded: 0, expired: 0 };

  const pending = await prisma.domainRegistration.findMany({
    where: { status: "PENDING", updatedAt: { lt: new Date(now.getTime() - MINUTE) } },
    select: { id: true },
    take: 50,
  });
  for (const { id } of pending) {
    await settlePurchase(id).catch((e) => console.error("[domains] settle purchase", id, e));
    out.purchases += 1;
  }

  const inFlight = await prisma.domainRegistration.findMany({ where: { status: "ACTIVE", renewalOrderId: { not: null } }, select: { id: true }, take: 50 });
  for (const { id } of inFlight) await settleRenewal(id, now).catch((e) => console.error("[domains] settle renewal", id, e));

  const due = await prisma.domainRegistration.findMany({
    where: { status: "ACTIVE", renewalOrderId: null, expiresAt: { lte: new Date(now.getTime() + RENEW_WINDOW_DAYS * DAY) } },
    select: { ...RENEWAL_SELECT, autoRenew: true, renewalNoticeAt: true, store: { select: { balance: true } } },
    orderBy: { expiresAt: "asc" },
    take: 100,
  });
  if (due.length === 0) return out;
  const settings = await getDomainSettings();

  for (const reg of due) {
    try {
      const action = renewalAction(reg, now);
      if (action === "expire") {
        await expireRegistration(reg);
        out.expired += 1;
        continue;
      }
      if (action !== "renew" || !reg.expiresAt || !registrarConfigured) continue;
      if (reg.renewalFailedAt && now.getTime() - reg.renewalFailedAt.getTime() < DAY) continue;

      const quote = await getDomainPrice(reg.domain);
      if (!quote || quote.renewal > MAX_USD_PRICE * 2) continue;
      const price = sellPrice(quote.renewal, settings);

      if (reg.store.balance < price) {
        if (shouldSendRenewalNotice(reg.expiresAt, reg.renewalNoticeAt, now)) {
          await createStoreNotification({
            storeId: reg.storeId,
            type: NotificationType.SYSTEM,
            title: "رصيدك مش مكفي لتجديد الدومين",
            message: `${reg.domain} بيخلص يوم ${cairoDate(reg.expiresAt)} — التجديد ${formatPiastersAsEgp(price)} وناقصك ${formatPiastersAsEgp(price - reg.store.balance)}.`,
            href: `/balance/topup?amount=${Math.ceil((price - reg.store.balance) / 100)}`,
          });
          await prisma.domainRegistration.update({ where: { id: reg.id }, data: { renewalNoticeAt: now } });
          out.reminded += 1;
        }
        continue;
      }

      if (await startRenewal({ ...reg, expiresAt: reg.expiresAt }, quote.renewal, price, now)) out.renewals += 1;
    } catch (error) {
      console.error("[domains] sweep", reg.domain, error);
    }
  }
  return out;
}

/** Merchant's auto-renew switch (only on their own registration). */
export async function setRegistrationAutoRenew(storeId: string, id: string, autoRenew: boolean) {
  const res = await prisma.domainRegistration.updateMany({ where: { id, storeId, status: "ACTIVE" }, data: { autoRenew } });
  return res.count === 1;
}
