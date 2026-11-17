import { NotificationType, SalesCommissionStatus, SalesRepStatus, SubscriptionStatus } from "@prisma/client";
import { resolveRenewal } from "@/lib/billing/plan-quote";
import { isMailConfigured } from "@/lib/mail";
import { createNotification } from "@/lib/notifications/in-app";
import { deliver, inBackground } from "@/lib/notifications/email/deliver";
import { infoRows, renderEmail } from "@/lib/notifications/email/layout";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtMoney, fmtWhen } from "./format";
import { formatRateBps } from "./rules";

/**
 * Tells a rep the moments that need them, as they happen: a merchant signed
 * up from their link, a customer paid (commission earned), a trial is about
 * to end unpaid, a paying customer's store closed. Each is an in-app
 * notification on /sales (the bell) and, for the ones worth acting on right
 * away, an email. Every notice has a key and goes out once. Never throws.
 */

const HOUR = 3_600_000;

/** A trial ending this soon, unpaid and not covered by the balance, gets one alert. */
export const TRIAL_ALERT_WINDOW = 24 * HOUR;
/** A paid store that closed within this long ago gets one alert (the hourly cron always lands inside it). */
export const CLOSED_ALERT_WINDOW = 48 * HOUR;

export type RepNotice = {
  /** Dedupe key — the same key never notifies twice. */
  key: string;
  title: string;
  message: string;
  /** Path on the app host. */
  href: string;
  /** Also email it (the in-app notice always goes). */
  email?: { subject: string; rows: { label: string; value: string | null | undefined; ltr?: boolean }[]; cta: string };
};

type Customer = { id: string; name: string | null; phone: string | null; storeName: string | null };

const label = (c: Customer) => c.storeName ?? c.name ?? "عميل";

// ─── Copy (pure, unit-tested) ───────────────────────────────────────────────

export function signupNotice(c: Customer & { businessType?: string | null }): RepNotice {
  return {
    key: `signup:${c.id}`,
    title: "عميل جديد سجّل من رابطك",
    message: `${label(c)}${c.name && c.storeName ? ` (${c.name})` : ""} لسه فاتح متجر. كلّمه النهارده — أول يوم هو اللي بيفرق.`,
    href: `/sales/customers/${c.id}`,
    email: {
      subject: `عميل جديد سجّل من رابطك: ${label(c)}`,
      rows: [
        { label: "المتجر", value: c.storeName },
        { label: "التاجر", value: c.name },
        { label: "الموبايل", value: c.phone, ltr: true },
        { label: "النشاط", value: c.businessType },
      ],
      cta: "افتح العميل",
    },
  };
}

export function commissionNotice(
  c: Customer,
  commission: { id: string; kind: "ACQUISITION" | "RENEWAL" | "BONUS"; amount: number; basisAmount: number; rateBps: number },
): RepNotice {
  const earned = fmtMoney(commission.amount);
  const base = { key: `commission:${commission.id}`, href: "/sales/commissions" };
  if (commission.kind === "BONUS") {
    return {
      ...base,
      title: `كسبت بونص الكامبين: ${earned}`,
      message: "وصلت لهدف العملاء الجداد في الكامبين، والبونص اتضاف لمستحقاتك.",
      email: { subject: `مبروك! كسبت بونص الكامبين ${earned}`, rows: [{ label: "البونص", value: earned }], cta: "شوف عمولاتك" },
    };
  }
  const how = `${formatRateBps(commission.rateBps)} من ${fmtMoney(commission.basisAmount)}`;
  if (commission.kind === "RENEWAL") {
    // Renewals come every month per customer — in-app only, no email.
    return { ...base, title: `كسبت ${earned} — ${label(c)} جدّد`, message: `عمولة تجديد (${how}) اتضافت لمستحقاتك.` };
  }
  return {
    ...base,
    title: `كسبت ${earned} — ${label(c)} دفع أول اشتراك`,
    message: `عمولة الاكتساب (${how}) اتضافت لمستحقاتك. كمّل معاه عشان يجدد — التجديد ليه عمولة برضه.`,
    email: {
      subject: `مبروك! كسبت ${earned} من ${label(c)}`,
      rows: [
        { label: "العميل", value: label(c) },
        { label: "الاشتراك", value: fmtMoney(commission.basisAmount) },
        { label: "النسبة", value: formatRateBps(commission.rateBps), ltr: true },
        { label: "عمولتك", value: earned },
      ],
      cta: "شوف عمولاتك",
    },
  };
}

export function trialEndingNotice(c: Customer, storeId: string, trialEnd: Date, now: Date): RepNotice {
  const when = fmtWhen(trialEnd, now);
  return {
    key: `trial_ending:${storeId}:${trialEnd.toISOString()}`,
    title: `تجربة ${label(c)} بتخلص ${when}`,
    message: "لسه مدفعش ورصيده مش مكفي أول اشتراك. كلّمه دلوقتي قبل ما المتجر يقفل.",
    href: `/sales/customers/${c.id}`,
    email: {
      subject: `تجربة ${label(c)} بتخلص ${when} — كلّمه دلوقتي`,
      rows: [
        { label: "المتجر", value: c.storeName },
        { label: "التاجر", value: c.name },
        { label: "الموبايل", value: c.phone, ltr: true },
      ],
      cta: "افتح العميل",
    },
  };
}

export function storeClosedNotice(c: Customer, storeId: string, endedAt: Date): RepNotice {
  return {
    key: `store_closed:${storeId}:${endedAt.toISOString()}`,
    title: `متجر ${label(c)} اتقفل`,
    message: "رصيده مكفاش التجديد. كلّمه يشحن عشان المتجر يرجع يشتغل — وعمولة التجديد ليك.",
    href: `/sales/customers/${c.id}`,
    email: {
      subject: `متجر ${label(c)} اتقفل — رصيده مكفاش التجديد`,
      rows: [
        { label: "المتجر", value: c.storeName },
        { label: "التاجر", value: c.name },
        { label: "الموبايل", value: c.phone, ltr: true },
      ],
      cta: "افتح العميل",
    },
  };
}

/** The admins recorded a transfer to the rep (answers an open withdrawal request, if any). */
export function payoutNotice(p: { id: string; amount: number; method: string; reference: string | null; paidAt: Date }): RepNotice {
  const amount = fmtMoney(p.amount);
  return {
    key: `payout:${p.id}`,
    title: `اتصرف لك ${amount}`,
    message: `الإدارة حوّلت لك ${amount} (${p.method}). العمولات اللي اتصرفت بقت «مدفوعة» في صفحة عمولاتك.`,
    href: "/sales/commissions",
    email: {
      subject: `اتصرف لك ${amount} من كاشو`,
      rows: [
        { label: "المبلغ", value: amount },
        { label: "الطريقة", value: p.method },
        { label: "رقم مرجعي", value: p.reference, ltr: true },
        { label: "تاريخ التحويل", value: fmtDate(p.paidAt) },
      ],
      cta: "شوف عمولاتك",
    },
  };
}

export function withdrawalRejectedNotice(r: { id: string; amount: number; reason: string }): RepNotice {
  const amount = fmtMoney(r.amount);
  return {
    key: `withdrawal_rejected:${r.id}`,
    title: `طلب سحب ${amount} اترفض`,
    message: `السبب: ${r.reason.replace(/[.!؟،\s]+$/u, "")}. مستحقاتك زي ما هي، وتقدر تطلب تاني بعد ما تظبط اللي محتاج.`,
    href: "/sales/commissions",
    email: {
      subject: `طلب سحب ${amount} اترفض`,
      rows: [
        { label: "المبلغ", value: amount },
        { label: "السبب", value: r.reason },
      ],
      cta: "افتح عمولاتك",
    },
  };
}

// ─── Delivery ───────────────────────────────────────────────────────────────

type Rep = { userId: string; email: string; name: string | null };

function appUrl(path: string) {
  return `${(process.env.APP_URL || `https://app.${process.env.ROOT_DOMAIN || "casho.store"}`).replace(/\/$/, "")}${path}`;
}

/** Returns true when the notice went out (false = already sent before). */
export async function sendRepNotice(rep: Rep, notice: RepNotice): Promise<boolean> {
  const already = await prisma.notification.findFirst({
    where: { userId: rep.userId, type: NotificationType.SYSTEM, data: { path: ["salesKey"], equals: notice.key } },
    select: { id: true },
  });
  if (already) return false;

  await createNotification({
    userId: rep.userId,
    type: NotificationType.SYSTEM,
    title: notice.title,
    message: notice.message,
    href: notice.href,
    data: { kind: "sales", salesKey: notice.key },
  });

  if (notice.email && isMailConfigured()) {
    const link = appUrl(notice.href);
    const first = rep.name?.trim().split(/\s+/)[0];
    const html = renderEmail({
      brand: { name: "كاشو — فريق المبيعات", logo: null, accent: "#1447e6", url: appUrl("/sales") },
      preheader: notice.message,
      heading: notice.title,
      intro: `${first ? `أهلًا ${first}، ` : ""}${notice.message}`,
      body: infoRows(notice.email.rows),
      cta: { label: notice.email.cta, href: link },
      footer: "الإيميل ده وصلك لأنك مندوب في فريق مبيعات كاشو. كل التنبيهات موجودة برضه في لوحة المبيعات.",
    });
    const text = [notice.title, notice.message, ...notice.email.rows.filter((r) => r.value).map((r) => `${r.label}: ${r.value}`), link].join("\n");
    await deliver({ to: rep.email, subject: notice.email.subject, html, text, fromName: "Casho Sales" }, { kind: "SALES_ALERT", refId: notice.key });
  }
  return true;
}

const REP_SELECT = { status: true, user: { select: { id: true, email: true, name: true } } } as const;

function activeRep(rep: { status: SalesRepStatus; user: { id: string; email: string; name: string | null } } | null): Rep | null {
  return rep && rep.status === SalesRepStatus.ACTIVE ? { userId: rep.user.id, email: rep.user.email, name: rep.user.name } : null;
}

/** After a signup attributed to a rep. */
export function queueSignupNotice(customerUserId: string) {
  inBackground(async () => {
    const a = await prisma.salesAttribution.findUnique({
      where: { customerUserId },
      select: {
        salesRep: { select: REP_SELECT },
        customer: {
          select: { id: true, name: true, phone_number: true, businessType: true, stores: { orderBy: { createdAt: "asc" }, take: 1, select: { name: true } } },
        },
      },
    });
    const rep = activeRep(a?.salesRep ?? null);
    if (!a || !rep) return;
    const { customer } = a;
    await sendRepNotice(
      rep,
      signupNotice({ id: customer.id, name: customer.name, phone: customer.phone_number, storeName: customer.stores[0]?.name ?? null, businessType: customer.businessType }),
    );
  });
}

/** After the engine wrote new commissions (billing hook or cron sweep). */
export function queueCommissionNotices(commissionIds: string[]) {
  if (commissionIds.length === 0) return;
  inBackground(async () => {
    const rows = await prisma.salesCommission.findMany({
      where: { id: { in: commissionIds }, status: SalesCommissionStatus.APPROVED },
      orderBy: { paymentAt: "asc" },
      select: {
        id: true,
        kind: true,
        amount: true,
        basisAmount: true,
        rateBps: true,
        storeId: true,
        salesRep: { select: REP_SELECT },
        attribution: { select: { customer: { select: { id: true, name: true, phone_number: true } } } },
      },
    });
    const stores = await prisma.store.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.storeId))] } }, select: { id: true, name: true } });
    const storeName = new Map(stores.map((s) => [s.id, s.name]));
    for (const row of rows) {
      const rep = activeRep(row.salesRep);
      if (!rep) continue;
      const c = row.attribution.customer;
      await sendRepNotice(rep, commissionNotice({ id: c.id, name: c.name, phone: c.phone_number, storeName: storeName.get(row.storeId) ?? null }, row));
    }
  });
}

/** After an admin recorded a payout. */
export function queuePayoutNotice(payoutId: string) {
  inBackground(async () => {
    const p = await prisma.salesPayout.findUnique({
      where: { id: payoutId },
      select: { id: true, amount: true, method: true, reference: true, paidAt: true, salesRep: { select: REP_SELECT } },
    });
    const rep = activeRep(p?.salesRep ?? null);
    if (p && rep) await sendRepNotice(rep, payoutNotice(p));
  });
}

/** After an admin rejected a withdrawal request. */
export function queueWithdrawalRejectedNotice(requestId: string) {
  inBackground(async () => {
    const r = await prisma.salesWithdrawalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, amount: true, decisionReason: true, salesRep: { select: REP_SELECT } },
    });
    const rep = activeRep(r?.salesRep ?? null);
    if (r && rep) await sendRepNotice(rep, withdrawalRejectedNotice({ id: r.id, amount: r.amount, reason: r.decisionReason ?? "—" }));
  });
}

/**
 * Hourly (renew-subscriptions cron): trials ending within a day that won't
 * pay themselves, and paid stores that just closed. Keys make reruns no-ops.
 */
export async function sweepRepAlerts(now = new Date()) {
  // Loaded here, not at the top: billing → engine → notify would otherwise be a cycle.
  const { getEntryPlan } = await import("@/lib/billing/renewal");
  const t = now.getTime();
  const totals = { trialEnding: 0, storeClosed: 0, failed: 0 };
  const customerSelect = { id: true, name: true, phone_number: true, salesAttribution: { select: { salesRep: { select: REP_SELECT } } } } as const;

  const [trials, closed, entryPlan] = await Promise.all([
    prisma.store.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndDate: { gt: now, lte: new Date(t + TRIAL_ALERT_WINDOW) },
        user: { salesAttribution: { acquiredAt: null, salesRep: { status: SalesRepStatus.ACTIVE } } },
      },
      take: 500,
      select: {
        id: true,
        name: true,
        trialEndDate: true,
        subscriptionEndsAt: true,
        balance: true,
        autoRenew: true,
        planSelected: true,
        billingCycle: true,
        monthlyPrice: true,
        plan: { select: { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true } },
        user: { select: customerSelect },
      },
    }),
    prisma.store.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        subscriptionEndsAt: { gte: new Date(t - CLOSED_ALERT_WINDOW), lte: now },
        user: { salesAttribution: { acquiredAt: { not: null }, eligibleUntil: { gt: now }, salesRep: { status: SalesRepStatus.ACTIVE } } },
      },
      take: 500,
      select: { id: true, name: true, subscriptionEndsAt: true, user: { select: customerSelect } },
    }),
    getEntryPlan(),
  ]);

  const customerOf = (user: { id: string; name: string | null; phone_number: string | null }, storeName: string) => ({
    id: user.id,
    name: user.name,
    phone: user.phone_number,
    storeName,
  });

  for (const store of trials) {
    // Still in trial (a paid period moves subscriptionEndsAt past the trial end), and not paying itself.
    if (!store.trialEndDate || !store.subscriptionEndsAt || store.subscriptionEndsAt.getTime() > store.trialEndDate.getTime() + 60_000) continue;
    const price = resolveRenewal(store, store.planSelected ? null : entryPlan).price;
    if (store.autoRenew && price > 0 && store.balance >= price) continue;
    const rep = activeRep(store.user.salesAttribution?.salesRep ?? null);
    if (!rep) continue;
    try {
      if (await sendRepNotice(rep, trialEndingNotice(customerOf(store.user, store.name), store.id, store.trialEndDate, now))) totals.trialEnding++;
    } catch (error) {
      totals.failed++;
      console.error("[sales] trial alert", store.id, error);
    }
  }

  for (const store of closed) {
    const rep = activeRep(store.user.salesAttribution?.salesRep ?? null);
    if (!rep || !store.subscriptionEndsAt) continue;
    try {
      if (await sendRepNotice(rep, storeClosedNotice(customerOf(store.user, store.name), store.id, store.subscriptionEndsAt))) totals.storeClosed++;
    } catch (error) {
      totals.failed++;
      console.error("[sales] closed alert", store.id, error);
    }
  }

  return totals;
}
