import { SubscriptionStatus, type Prisma } from "@prisma/client";
import { getEntryPlan } from "@/lib/billing/renewal";
import { resolveRenewal } from "@/lib/billing/plan-quote";
import { REAL_ORDERS, REAL_PRODUCTS } from "@/lib/demo-data/where";
import { hasShippingSetup } from "@/lib/store-setup/checklist";
import { prisma } from "@/lib/prisma";
import {
  CALL_PRIORITY,
  CLOSED_WINDOW,
  RENEWAL_WINDOW,
  TRIAL_ENDED_WINDOW,
  activationOf,
  buildCallList,
  hasPaymentSetup,
  type Activation,
  type CallReason,
} from "./call-list";

/**
 * DB side of the rep's call list (rules in call-list.ts). Scope is always the
 * rep id from the session. Candidates are bounded by the rules' own windows,
 * so the list stays small however many customers a rep has.
 */

const DAY = 86_400_000;

/** Everything the rules and the activation checklist read from a store. */
export const ACTIVATION_STORE_SELECT = {
  id: true,
  name: true,
  slug: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndDate: true,
  balance: true,
  autoRenew: true,
  planSelected: true,
  billingCycle: true,
  monthlyPrice: true,
  paymentMethods: true,
  onboardingCompleted: true,
  plan: { select: { id: true, key: true, name: true, monthlyPrice: true, yearlyPrice: true } },
  storePaymentSettings: {
    select: {
      cashOnDeliveryEnabled: true,
      vodafoneCashEnabled: true,
      vodafoneCashNumber: true,
      instapayEnabled: true,
      instapayAddress: true,
      bankTransferEnabled: true,
      bankTransferDetails: true,
      paymobEnabled: true,
    },
  },
  settings: { select: { shippingPrice: true } },
  _count: { select: { products: { where: REAL_PRODUCTS }, orders: { where: REAL_ORDERS }, shippingMethods: { where: { isActive: true } } } },
} satisfies Prisma.StoreSelect;

type ActivationStoreRow = Prisma.StoreGetPayload<{ select: typeof ACTIVATION_STORE_SELECT }>;

export type StoreActivation = Activation & { products: number; orders: number };

export function storeActivation(store: ActivationStoreRow): StoreActivation {
  const products = store._count.products;
  const orders = store._count.orders;
  return {
    ...activationOf({
      products,
      orders,
      hasPayment: hasPaymentSetup(store),
      hasShipping: hasShippingSetup({
        shippingPrice: store.settings?.shippingPrice ?? 0,
        shippingMethods: store._count.shippingMethods,
        onboardingCompleted: store.onboardingCompleted,
      }),
    }),
    products,
    orders,
  };
}

/** Activation of each of a customer's stores, for the customer page. */
export async function getCustomerActivation(customerUserId: string) {
  const stores = await prisma.store.findMany({
    where: { userId: customerUserId },
    orderBy: { createdAt: "asc" },
    select: ACTIVATION_STORE_SELECT,
  });
  return new Map(stores.map((s) => [s.id, storeActivation(s)]));
}

export async function listCallList(salesRepId: string, opts: { take?: number; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const t = now.getTime();

  const [rows, entryPlan] = await Promise.all([
    prisma.salesAttribution.findMany({
      where: {
        salesRepId,
        OR: [
          // Never paid: recent enough for a welcome, trial or win-back call (admin-extended trials included).
          { acquiredAt: null, signedUpAt: { gte: new Date(t - TRIAL_ENDED_WINDOW - 30 * DAY) } },
          // Paid and still eligible, with a store that's closed or renews within the window.
          {
            acquiredAt: { not: null },
            eligibleUntil: { gt: now },
            customer: {
              stores: {
                some: {
                  OR: [
                    { subscriptionStatus: SubscriptionStatus.PAST_DUE, subscriptionEndsAt: { gte: new Date(t - CLOSED_WINDOW) } },
                    { subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD] }, subscriptionEndsAt: { lte: new Date(t + RENEWAL_WINDOW) } },
                  ],
                },
              },
            },
          },
        ],
      },
      orderBy: { signedUpAt: "desc" },
      take: 400,
      select: {
        id: true,
        signedUpAt: true,
        acquiredAt: true,
        eligibleUntil: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            stores: { orderBy: { createdAt: "asc" }, take: 1, select: ACTIVATION_STORE_SELECT },
          },
        },
      },
    }),
    getEntryPlan(),
  ]);

  const candidates = rows.map((row) => {
    const raw = row.customer.stores[0] ?? null;
    const store = raw && {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      subscriptionStatus: raw.subscriptionStatus,
      subscriptionEndsAt: raw.subscriptionEndsAt,
      trialEndDate: raw.trialEndDate,
      balance: raw.balance,
      autoRenew: raw.autoRenew,
      renewalPrice: resolveRenewal(raw, raw.planSelected ? null : entryPlan).price,
      activation: storeActivation(raw),
    };
    return {
      id: row.id,
      signedUpAt: row.signedUpAt,
      acquiredAt: row.acquiredAt,
      eligibleUntil: row.eligibleUntil,
      customer: { id: row.customer.id, name: row.customer.name, email: row.customer.email, phone_number: row.customer.phone_number },
      store,
    };
  });

  const list = buildCallList(candidates, now);
  const counts = Object.fromEntries(Object.keys(CALL_PRIORITY).map((r) => [r, 0])) as Record<CallReason, number>;
  for (const item of list) counts[item.call.reason]++;

  return { total: list.length, counts, rows: opts.take ? list.slice(0, opts.take) : list };
}

export type CallListItem = Awaited<ReturnType<typeof listCallList>>["rows"][number];
