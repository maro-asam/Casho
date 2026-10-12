import {
  BalanceTransactionType,
  Prisma,
  SalesCommissionKind,
  SalesCommissionStatus,
  SalesRepStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/subscriptions";
import {
  SALES_CURRENCY,
  cohortMonthOf,
  decideChargeCommission,
  eligibleUntilFor,
  refundClawback,
  salesRepAt,
  type CommissionRuleSet,
} from "./rules";

/**
 * The sales-commission engine. It never runs inside a billing transaction:
 * billing writes the ledger (BalanceTransaction), and this replays a customer's
 * ledger and creates whatever commission/adjustment rows are missing. That makes
 * it idempotent (unique keys on the ledger row id) and self-healing — a missed
 * hook is picked up by the cron sweep.
 */

type Db = Prisma.TransactionClient | typeof prisma;

const LEDGER_TYPES = [BalanceTransactionType.SUBSCRIPTION_CHARGE, BalanceTransactionType.REFUND];
const VOID_STATUSES: SalesCommissionStatus[] = [SalesCommissionStatus.REJECTED, SalesCommissionStatus.REVERSED];

export async function getCommissionRuleAt(db: Db, at: Date = new Date()): Promise<CommissionRuleSet> {
  const rule = await db.salesCommissionRule.findFirst({
    where: { effectiveFrom: { lte: at } },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
  });
  // Charges older than the first rule fall back to the oldest one.
  const fallback = rule ?? (await db.salesCommissionRule.findFirst({ orderBy: { effectiveFrom: "asc" } }));
  if (!fallback) throw new Error("No sales commission rule configured");
  return fallback;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

export type SyncResult = { commissions: number; adjustments: number };

export async function syncSalesCommissionsForCustomer(customerUserId: string): Promise<SyncResult> {
  const found = await prisma.salesAttribution.findUnique({ where: { customerUserId }, select: { id: true } });
  if (!found) return { commissions: 0, adjustments: 0 };

  return prisma.$transaction(
    async (tx) => {
      // One sync per customer at a time.
      await tx.$queryRaw`SELECT "id" FROM "SalesAttribution" WHERE "id" = ${found.id} FOR UPDATE`;

      const attribution = await tx.salesAttribution.findUniqueOrThrow({
        where: { id: found.id },
        select: {
          id: true,
          customerUserId: true,
          originalSalesRepId: true,
          createdAt: true,
          acquiredAt: true,
          cohortMonth: true,
          eligibleUntil: true,
          changes: { select: { toSalesRepId: true, createdAt: true } },
        },
      });

      const ledger = await tx.balanceTransaction.findMany({
        where: { store: { userId: customerUserId }, type: { in: LEDGER_TYPES } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, storeId: true, type: true, amount: true, createdAt: true },
      });

      const firstCharge = ledger.find((r) => r.type === BalanceTransactionType.SUBSCRIPTION_CHARGE && r.amount < 0);
      if (!firstCharge) return { commissions: 0, adjustments: 0 };

      // Acquisition dates belong to the customer, whoever the rep is.
      let { cohortMonth, eligibleUntil } = attribution;
      if (!attribution.acquiredAt || !eligibleUntil || !cohortMonth) {
        const rule = await getCommissionRuleAt(tx, firstCharge.createdAt);
        cohortMonth = cohortMonthOf(firstCharge.createdAt);
        eligibleUntil = eligibleUntilFor(firstCharge.createdAt, rule.eligibilityMonths);
        await tx.salesAttribution.update({
          where: { id: attribution.id },
          data: { acquiredAt: firstCharge.createdAt, acquisitionTxId: firstCharge.id, cohortMonth, eligibleUntil },
        });
      }

      const commissions = await tx.salesCommission.findMany({
        where: { attributionId: attribution.id },
        select: {
          id: true,
          salesRepId: true,
          balanceTransactionId: true,
          status: true,
          rateBps: true,
          amount: true,
          paymentAt: true,
          adjustments: { select: { amount: true, balanceTransactionId: true } },
        },
      });
      const doneCharges = new Set(commissions.map((c) => c.balanceTransactionId));
      const doneRefunds = new Set(commissions.flatMap((c) => c.adjustments.map((a) => a.balanceTransactionId)).filter(Boolean));

      const result: SyncResult = { commissions: 0, adjustments: 0 };

      for (const row of ledger) {
        if (row.type === BalanceTransactionType.SUBSCRIPTION_CHARGE) {
          if (row.amount >= 0 || doneCharges.has(row.id)) continue;

          const salesRepId = salesRepAt(row.createdAt, attribution);
          if (!salesRepId) continue; // paid before this customer was attributed — never retroactive

          const isFirstCharge = row.id === firstCharge.id;
          const rule = await getCommissionRuleAt(tx, row.createdAt);

          let eligibleCountBefore = 0;
          if (isFirstCharge) {
            // Serialise acquisitions per rep so tier positions are consistent.
            await tx.$queryRaw`SELECT "id" FROM "SalesRep" WHERE "id" = ${salesRepId} FOR UPDATE`;
            eligibleCountBefore = await tx.salesAttribution.count({
              where: {
                salesRepId,
                id: { not: attribution.id },
                acquiredAt: { lte: row.createdAt },
                eligibleUntil: { gt: row.createdAt },
              },
            });
          }

          const decision = decideChargeCommission({
            isFirstCharge,
            chargeLedgerAmount: row.amount,
            chargeAt: row.createdAt,
            eligibleUntil,
            eligibleCountBefore,
            rule,
          });
          if (decision.kind === "NONE") continue;

          const rep = await tx.salesRep.findUniqueOrThrow({ where: { id: salesRepId }, select: { status: true } });
          // Auto-approve; a disabled rep's new commissions wait for an admin decision.
          const status = rep.status === SalesRepStatus.ACTIVE ? SalesCommissionStatus.APPROVED : SalesCommissionStatus.ON_HOLD;

          const created = await tx.salesCommission.create({
            data: {
              salesRepId,
              attributionId: attribution.id,
              customerUserId,
              storeId: row.storeId,
              balanceTransactionId: row.id,
              kind: decision.kind === "ACQUISITION" ? SalesCommissionKind.ACQUISITION : SalesCommissionKind.RENEWAL,
              status,
              basisAmount: decision.basisAmount,
              rateBps: decision.rateBps,
              amount: decision.amount,
              currency: SALES_CURRENCY,
              tier: decision.kind === "ACQUISITION" ? decision.tier : null,
              customerPosition: decision.kind === "ACQUISITION" ? decision.customerPosition : null,
              ruleId: rule.id,
              cohortMonth,
              eligibleUntil,
              paymentAt: row.createdAt,
              statusReason: status === SalesCommissionStatus.ON_HOLD ? "المندوب موقوف وقت استحقاق العمولة" : null,
            },
            select: { id: true, salesRepId: true, balanceTransactionId: true, status: true, rateBps: true, amount: true, paymentAt: true },
          });
          await tx.salesAuditLog.create({
            data: {
              action: "commission_created",
              entityType: "SalesCommission",
              entityId: created.id,
              salesRepId,
              after: { kind: decision.kind, status, amount: decision.amount, rateBps: decision.rateBps, balanceTransactionId: row.id },
            },
          });
          commissions.push({ ...created, adjustments: [] });
          doneCharges.add(row.id);
          result.commissions += 1;
          continue;
        }

        // REFUND credit (downgrade proration): claw back from the commission that funded the period.
        if (row.amount <= 0 || doneRefunds.has(row.id)) continue;
        const target = commissions
          .filter((c) => c.paymentAt.getTime() <= row.createdAt.getTime())
          .sort((a, b) => b.paymentAt.getTime() - a.paymentAt.getTime())[0];
        if (!target || VOID_STATUSES.includes(target.status)) continue;

        const net = target.amount + target.adjustments.reduce((sum, a) => sum + a.amount, 0);
        const clawback = refundClawback({ refundAmount: row.amount, commissionRateBps: target.rateBps, commissionNet: net });
        if (clawback <= 0) continue;

        const adjustment = await tx.salesCommissionAdjustment.create({
          data: {
            commissionId: target.id,
            salesRepId: target.salesRepId,
            amount: -clawback,
            currency: SALES_CURRENCY,
            source: "REFUND_CREDIT",
            balanceTransactionId: row.id,
            reason: "استرداد رصيد للعميل بعد تخفيض الباقة",
          },
          select: { id: true },
        });
        await tx.salesAuditLog.create({
          data: {
            action: "adjustment_created",
            entityType: "SalesCommission",
            entityId: target.id,
            salesRepId: target.salesRepId,
            after: { adjustmentId: adjustment.id, amount: -clawback, source: "REFUND_CREDIT", balanceTransactionId: row.id },
          },
        });
        target.adjustments.push({ amount: -clawback, balanceTransactionId: row.id });
        doneRefunds.add(row.id);
        result.adjustments += 1;
      }

      return result;
    },
    { timeout: 20_000 },
  );
}

/**
 * Billing hook — call after any subscription charge or refund credit. Never
 * throws: commissions must not break billing (the cron sweep retries).
 */
export async function recordSalesCommissionsForStore(storeId: string): Promise<void> {
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { userId: true } });
    if (!store) return;
    await syncSalesCommissionsForCustomer(store.userId);
  } catch (error) {
    if (isUniqueViolation(error)) return; // a concurrent sync already wrote it
    console.error("[sales] commission sync failed", { storeId, error });
  }
}

/** Cron: re-sync every attributed customer with ledger activity since `since` (default 35 days). */
export async function sweepSalesCommissions(opts: { now?: Date; since?: Date } = {}) {
  const now = opts.now ?? new Date();
  const since = opts.since ?? addDays(now, -35);

  const attributions = await prisma.salesAttribution.findMany({
    where: {
      customer: { stores: { some: { balanceTransactions: { some: { type: { in: LEDGER_TYPES }, createdAt: { gte: since } } } } } },
    },
    select: { customerUserId: true },
    take: 5000,
  });

  const totals = { checked: attributions.length, commissions: 0, adjustments: 0, failed: 0 };
  for (const a of attributions) {
    try {
      const r = await syncSalesCommissionsForCustomer(a.customerUserId);
      totals.commissions += r.commissions;
      totals.adjustments += r.adjustments;
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      totals.failed += 1;
      console.error("[sales] sweep customer", a.customerUserId, error);
    }
  }
  return totals;
}
