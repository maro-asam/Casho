// Number reputation for cash-on-delivery: how this phone behaved before, on
// this store and across every Casho store (counts only — other stores' names
// or orders are never exposed). Pure rules live in `riskFromHistory`.

import { OrderRiskLevel, OrderSource, OrderStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canonicalPhone, phoneVariants } from "./phone";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

export type PhoneHistory = {
  /** Orders that reached the customer. */
  delivered: number;
  /** Deliveries the customer refused (CANCELED + returnedAt). */
  returned: number;
  /** Other cancellations (no answer, changed mind, fake…). */
  canceled: number;
  total: number;
};

export type PhoneRisk = {
  level: OrderRiskLevel;
  blockedByStore: boolean;
  /** Short Arabic reasons for the merchant. */
  signals: string[];
  store: PhoneHistory;
  platform: PhoneHistory;
};

const nf = lazyIntl.number();

async function history(where: Prisma.OrderWhereInput): Promise<PhoneHistory> {
  const [byStatus, returned] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.order.count({ where: { ...where, status: OrderStatus.CANCELED, returnedAt: { not: null } } }),
  ]);
  const count = (status: OrderStatus) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const canceledAll = count(OrderStatus.CANCELED);
  return {
    delivered: count(OrderStatus.DELIVERED),
    returned,
    canceled: canceledAll - returned,
    total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
  };
}

/** The rules, kept pure so they can be tested and tuned. */
export function riskFromHistory(store: PhoneHistory, platform: PhoneHistory, blockedByStore: boolean): Omit<PhoneRisk, "store" | "platform"> {
  const signals: string[] = [];
  if (blockedByStore) signals.push(tr("الرقم ده محظور من متجرك"));

  const { delivered, returned, canceled, total } = platform;
  if (returned > 0) signals.push(tr("رفض استلام {0} طلب قبل كده على كاشو", nf.format(returned)));
  if (store.returned > 0) signals.push(tr("منهم {0} من متجرك", nf.format(store.returned)));
  if (canceled >= 2) signals.push(tr("{0} طلبات اتلغت قبل كده", nf.format(canceled)));
  if (delivered > 0) signals.push(tr("اتسلّم له {0} طلب قبل كده", nf.format(delivered)));
  if (total === 0) signals.push(tr("رقم جديد — أول طلب على كاشو"));

  let level: OrderRiskLevel = OrderRiskLevel.LOW;
  if (blockedByStore || returned >= 2 || (returned >= 1 && delivered === 0) || (returned > 0 && returned >= delivered)) {
    level = OrderRiskLevel.HIGH;
  } else if (returned >= 1 || (canceled >= 3 && delivered === 0)) {
    level = OrderRiskLevel.MEDIUM;
  }
  return { level, blockedByStore, signals };
}

export async function isPhoneBlocked(storeId: string, phone: string) {
  const row = await prisma.blockedPhone.findUnique({
    where: { storeId_phone: { storeId, phone: canonicalPhone(phone) } },
    select: { id: true },
  });
  return Boolean(row);
}

/** Reputation before a new order is placed (the new order isn't counted). */
export async function assessPhoneRisk(storeId: string, phone: string, opts: { excludeOrderId?: string } = {}): Promise<PhoneRisk> {
  const phones = { in: phoneVariants(phone) };
  const base: Prisma.OrderWhereInput = {
    phone: phones,
    source: OrderSource.ONLINE,
    ...(opts.excludeOrderId && { id: { not: opts.excludeOrderId } }),
  };
  const [blockedByStore, store, platform] = await Promise.all([
    isPhoneBlocked(storeId, phone),
    history({ ...base, storeId }),
    history(base),
  ]);
  return { ...riskFromHistory(store, platform, blockedByStore), store, platform };
}
