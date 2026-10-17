import { BalanceTransactionType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Permanent deletion of stores and accounts from the admin panel.
//
// Policy ("protected hard delete"): anything that has real money history —
// top-ups, subscription charges, refunds, a positive balance, sales
// commissions, referral rewards — can't be deleted, because revenue, profit
// and commission reports are computed from those rows. Such stores get their
// subscription canceled instead. Everything else (test, spam, never-paid
// accounts) is removed completely.
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
];

const nf = new Intl.NumberFormat("ar-EG");

/** Human reasons a store can't be deleted; empty = deletable. */
export async function getStoreDeletionBlockers(storeId: string, db: Db | typeof prisma = prisma): Promise<string[]> {
  const [store, moneyTx, commissions] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { balance: true } }),
    db.balanceTransaction.count({ where: { storeId, type: { in: MONEY_TX } } }),
    db.salesCommission.count({ where: { storeId } }),
  ]);
  if (!store) return ["المتجر مش موجود"];

  const reasons: string[] = [];
  if (moneyTx > 0) reasons.push(`عليه ${nf.format(moneyTx)} حركة مالية حقيقية (شحن / اشتراك / استرجاع)`);
  if (commissions > 0) reasons.push(`مرتبط بـ ${nf.format(commissions)} عمولة مبيعات`);
  if (store.balance > 0) reasons.push("رصيده أكبر من صفر");
  return reasons;
}

/** Deletes one store and everything it owns. Call inside a transaction. */
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
  await tx.balanceTransaction.deleteMany({ where: byStore }); // only non-money rows reach here

  await tx.store.delete({ where: { id: storeId } }); // the rest cascades
}

export type UserDeletionCheck = {
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
  if (!user) return { blockers: ["الحساب مش موجود"], stores: [] };

  const blockers: string[] = [];
  if (user.id === actorId) blockers.push("مينفعش تحذف حسابك إنت");
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) blockers.push("الحساب أدمن — رجّعه تاجر الأول من صلاحياته");
  if (user.role === UserRole.SALES || user.salesRep) blockers.push("الحساب مندوب مبيعات — أوقفه من فريق المبيعات بدل الحذف عشان سجل العمولات");
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
    blockers.push("ليه سجلات شغل (ورديات كاشير أو مخزون) في متجر تاجر تاني — شيله من فريق المتجر بس");
  }

  for (const store of user.stores) {
    const reasons = await getStoreDeletionBlockers(store.id);
    if (reasons.length) blockers.push(`متجر «${store.name}»: ${reasons.join("، ")}`);
  }

  return { blockers, stores: user.stores };
}

/** Deletes an account and its stores. Call only after getUserDeletionCheck passed. */
export async function deleteUserTree(tx: Db, userId: string, storeIds: string[]) {
  for (const storeId of storeIds) await deleteStoreTree(tx, storeId);

  // Never-paid sales attribution (commissions were checked to be zero).
  const attribution = await tx.salesAttribution.findUnique({ where: { customerUserId: userId }, select: { id: true } });
  if (attribution) {
    await tx.salesAttributionChange.deleteMany({ where: { attributionId: attribution.id } });
    await tx.salesAttribution.delete({ where: { id: attribution.id } });
  }

  // People this user invited keep their accounts.
  await tx.user.updateMany({ where: { referredById: userId }, data: { referredById: null } });

  // Own-store operational rows are gone with the stores; sessions, notifications,
  // memberships cascade; logs and orders keep the row with userId = null.
  await tx.user.delete({ where: { id: userId } });
}
