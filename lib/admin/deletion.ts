import { BalanceTransactionType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Permanent deletion of stores and accounts from the admin panel.
//
// Policy ("protected hard delete"): anything that has real money history —
// top-ups, subscription charges, refunds, a positive balance, sales
// commissions, referral rewards — can't be deleted by an admin, because
// revenue, profit and commission reports are computed from those rows. Such
// stores get their subscription canceled instead. Everything else (test, spam,
// never-paid accounts) is removed completely.
//
// A super admin always deletes past those money blockers (the role decides,
// not a flag from the page): the store's ledger, its
// sales commissions and referral history go with it (a summary is written to
// the security log first — see getMoneySnapshot). Hard blockers (deleting
// yourself, an admin, a sales rep) can't be forced.
//
// Many relations are ON DELETE RESTRICT (orders → branch, items → product,
// suggested orders → IG conversation…). Postgres checks RESTRICT while the
// cascade runs, so children are deleted explicitly, leaves first.

type Db = Prisma.TransactionClient;

/** Ledger types that mean money actually changed hands. */
const MONEY_TX: BalanceTransactionType[] = [
  BalanceTransactionType.TOPUP,
  BalanceTransactionType.SUBSCRIPTION_CHARGE,
  BalanceTransactionType.REFUND,
  BalanceTransactionType.DOMAIN_CHARGE,
  BalanceTransactionType.DOMAIN_REFUND,
];

const nf = new Intl.NumberFormat("ar-EG");
const egp = (piasters: number) => `${nf.format(piasters / 100)} ج.م`;

/** Human reasons a store can't be deleted without forcing; empty = deletable. */
export async function getStoreDeletionBlockers(storeId: string, db: Db | typeof prisma = prisma): Promise<string[]> {
  const [store, moneyTx, commissions] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { balance: true } }),
    db.balanceTransaction.count({ where: { storeId, type: { in: MONEY_TX } } }),
    db.salesCommission.count({ where: { storeId } }),
  ]);
  if (!store) return ["المتجر مش موجود"];

  const reasons: string[] = [];
  if (moneyTx > 0) reasons.push(`عليه ${nf.format(moneyTx)} حركة مالية حقيقية (شحن / اشتراك / دومين / استرجاع)`);
  if (commissions > 0) reasons.push(`مرتبط بـ ${nf.format(commissions)} عمولة مبيعات`);
  if (store.balance > 0) reasons.push(`رصيده ${egp(store.balance)}`);
  return reasons;
}

/**
 * What money history a forced delete removes, flattened for the security log
 * (the rows themselves are gone afterwards). Amounts are piasters.
 */
export async function getMoneySnapshot(storeIds: string[], customerUserId?: string) {
  const commissionWhere: Prisma.SalesCommissionWhereInput = customerUserId
    ? { OR: [{ storeId: { in: storeIds } }, { customerUserId }] }
    : { storeId: { in: storeIds } };
  const [balance, ledger, commissions] = await Promise.all([
    prisma.store.aggregate({ where: { id: { in: storeIds } }, _sum: { balance: true } }),
    prisma.balanceTransaction.groupBy({ by: ["type"], where: { storeId: { in: storeIds } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.salesCommission.aggregate({ where: commissionWhere, _sum: { amount: true }, _count: { _all: true } }),
  ]);
  return {
    balance: balance._sum.balance ?? 0,
    ledger: ledger.map((r) => `${r.type} ×${r._count._all} = ${r._sum.amount ?? 0}`).join(" | ") || null,
    commissions: commissions._count._all,
    commissionsAmount: commissions._sum.amount ?? 0,
  };
}

/** Deletes one store and everything it owns, money history included. Call inside a transaction. */
export async function deleteStoreTree(tx: Db, storeId: string) {
  const byStore = { storeId };
  const byStoreProduct = { product: { storeId } };

  // Rows pointing at this store's products, orders, branches or IG conversations (RESTRICT).
  await tx.suggestedOrder.deleteMany({ where: byStore });
  await tx.cartItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
  await tx.posReturn.deleteMany({ where: byStore }); // items cascade
  await tx.posReturnItem.deleteMany({ where: byStoreProduct });
  await tx.orderItem.deleteMany({ where: { OR: [{ order: byStore }, byStoreProduct] } });
  await tx.order.deleteMany({ where: byStore }); // split payments cascade, shipments set null
  await tx.stockMovement.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
  await tx.purchaseOrderItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
  await tx.stockTransferItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
  await tx.inventoryAdjustmentItem.deleteMany({ where: { OR: [byStore, byStoreProduct] } });
  await tx.stockTransfer.deleteMany({ where: byStore });
  await tx.posShift.deleteMany({ where: byStore }); // entries cascade

  // Catalog (products before categories: Product.category is RESTRICT).
  await tx.product.deleteMany({ where: byStore });
  await tx.category.deleteMany({ where: byStore });

  // Remaining RESTRICT children of Store itself.
  await tx.banner.deleteMany({ where: byStore });
  await tx.visit.deleteMany({ where: byStore });
  await tx.storeSettings.deleteMany({ where: byStore });

  // Money history — only present when a super admin forced the delete.
  // Commissions point at the store by a plain id (no FK), so they're matched by storeId.
  await tx.salesCommissionAdjustment.deleteMany({ where: { commission: byStore } });
  await tx.salesCommission.deleteMany({ where: byStore });
  await tx.domainRegistration.deleteMany({ where: byStore }); // stays at Vercel, auto-renew is off
  await tx.balanceTransaction.deleteMany({ where: byStore });

  await tx.store.delete({ where: { id: storeId } }); // the rest cascades
}

export type UserDeletionCheck = {
  /** Never overridable, not even by a super admin. */
  hardBlockers: string[];
  /** Money / work history: blocks an admin, a super admin can force past it. */
  blockers: string[];
  stores: { id: string; name: string; slug: string; customDomain: string | null }[];
};

/** Reasons an account can't be deleted, plus the stores that would go with it. */
export async function getUserDeletionCheck(userId: string, actorId: string): Promise<UserDeletionCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      salesRep: { select: { id: true } },
      salesAttribution: { select: { _count: { select: { commissions: true } } } },
      stores: { select: { id: true, name: true, slug: true, customDomain: true } },
      _count: { select: { referralTransactionsSent: true, referralRewardLogs: true } },
      referralTransactionReceived: { select: { id: true } },
    },
  });
  if (!user) return { hardBlockers: ["الحساب مش موجود"], blockers: [], stores: [] };

  const hardBlockers: string[] = [];
  if (user.id === actorId) hardBlockers.push("مينفعش تحذف حسابك إنت");
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) hardBlockers.push("الحساب أدمن — رجّعه تاجر الأول من صلاحياته");
  if (user.role === UserRole.SALES || user.salesRep) {
    hardBlockers.push("الحساب مندوب مبيعات — حذفه بيمسح نسبة كل التجار اللي جابهم وسجل صرفه، أوقفه من فريق المبيعات بدل كده");
  }

  const blockers: string[] = [];
  if ((user.salesAttribution?._count.commissions ?? 0) > 0) blockers.push("اتحسب عليه عمولات لمندوب مبيعات");
  if (user._count.referralTransactionsSent > 0 || user._count.referralRewardLogs > 0 || user.referralTransactionReceived) {
    blockers.push("ليه مكافآت إحالة مسجلة");
  }

  // Operational records inside stores the user doesn't own (staff/cashier work).
  const ownedIds = user.stores.map((s) => s.id);
  const notOwned = { storeId: { notIn: ownedIds } };
  const [shifts, held, pos, transfers, adjustments] = await Promise.all([
    prisma.posShift.count({ where: { cashierId: userId, ...notOwned } }),
    prisma.posHeldOrder.count({ where: { cashierId: userId, ...notOwned } }),
    prisma.purchaseOrder.count({ where: { createdById: userId, ...notOwned } }),
    prisma.stockTransfer.count({ where: { OR: [{ createdById: userId }, { approvedById: userId }], ...notOwned } }),
    prisma.inventoryAdjustment.count({ where: { userId, ...notOwned } }),
  ]);
  if (shifts + held + pos + transfers + adjustments > 0) {
    blockers.push("ليه سجلات شغل (ورديات كاشير أو مخزون) في متجر تاجر تاني — في الحذف الإجباري بتتنقل لاسم صاحب المتجر ده");
  }

  for (const store of user.stores) {
    const reasons = await getStoreDeletionBlockers(store.id);
    if (reasons.length) blockers.push(`متجر «${store.name}»: ${reasons.join("، ")}`);
  }

  return { hardBlockers, blockers, stores: user.stores };
}

/**
 * Work the user did in other merchants' stores stays with that store, under
 * its owner's name (the columns are required). Parked POS carts just go.
 */
async function handOverStaffRecords(tx: Db, userId: string) {
  await tx.posHeldOrder.deleteMany({ where: { cashierId: userId } });

  const storeIds = new Set<string>();
  const select = { storeId: true } as const;
  for (const rows of [
    await tx.posShift.findMany({ where: { cashierId: userId }, select, distinct: ["storeId"] }),
    await tx.purchaseOrder.findMany({ where: { createdById: userId }, select, distinct: ["storeId"] }),
    await tx.stockTransfer.findMany({ where: { createdById: userId }, select, distinct: ["storeId"] }),
    await tx.inventoryAdjustment.findMany({ where: { userId }, select, distinct: ["storeId"] }),
  ]) {
    for (const r of rows) storeIds.add(r.storeId);
  }
  if (!storeIds.size) return;

  const stores = await tx.store.findMany({ where: { id: { in: [...storeIds] } }, select: { id: true, userId: true } });
  for (const { id: storeId, userId: ownerId } of stores) {
    await tx.posShift.updateMany({ where: { storeId, cashierId: userId }, data: { cashierId: ownerId } });
    await tx.purchaseOrder.updateMany({ where: { storeId, createdById: userId }, data: { createdById: ownerId } });
    await tx.stockTransfer.updateMany({ where: { storeId, createdById: userId }, data: { createdById: ownerId } });
    await tx.inventoryAdjustment.updateMany({ where: { storeId, userId }, data: { userId: ownerId } });
  }
}

/**
 * Deletes an account and every store it owns (read here, inside the
 * transaction, so a store created meanwhile can't fail the delete). Call only
 * after getUserDeletionCheck passed, or was forced by a super admin.
 */
export async function deleteUserTree(tx: Db, userId: string) {
  const stores = await tx.store.findMany({ where: { userId }, select: { id: true } });
  for (const { id } of stores) await deleteStoreTree(tx, id);

  // Sales attribution, with any commissions still on it (forced delete).
  const attribution = await tx.salesAttribution.findUnique({ where: { customerUserId: userId }, select: { id: true } });
  if (attribution) {
    const onAttribution = { attributionId: attribution.id };
    await tx.salesCommissionAdjustment.deleteMany({ where: { commission: onAttribution } });
    await tx.salesCommission.deleteMany({ where: onAttribution });
    await tx.salesAttributionChange.deleteMany({ where: onAttribution });
    await tx.salesAttribution.delete({ where: { id: attribution.id } });
  }

  // Referral history, on both sides (forced delete).
  await tx.referralTransaction.deleteMany({ where: { OR: [{ referrerId: userId }, { referredUserId: userId }] } });
  await tx.referralRewardLog.deleteMany({ where: { referrerId: userId } });

  await handOverStaffRecords(tx, userId);

  // People this user invited keep their accounts.
  await tx.user.updateMany({ where: { referredById: userId }, data: { referredById: null } });

  // Sessions, notifications, memberships cascade; logs and orders keep the row with userId = null.
  await tx.user.delete({ where: { id: userId } });
}
