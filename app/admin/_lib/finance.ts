import { BalanceTransactionType, SalesCommissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Platform revenue and profit, month by month (Africa/Cairo).
//
//   revenue     = SUBSCRIPTION_CHARGE − REFUND        (the ledger; charges are stored negative)
//   commissions = earned sales commissions + adjustments
//                 earned = PENDING | APPROVED | ON_HOLD | PAID (same as lib/sales/queries),
//                 dated by `paymentAt` (the charge they came from) so they land in the
//                 same month as the revenue; adjustments (signed, clawbacks negative) by createdAt
//   profit      = revenue − commissions
//
// Top-ups are cash received into merchant balances, not revenue until a
// subscription charge spends them — they're reported separately.

const TZ = "Africa/Cairo";
const keyFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: TZ });
const labelFmt = new Intl.DateTimeFormat("ar-EG", { month: "short", year: "2-digit", timeZone: TZ });
const longLabelFmt = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric", timeZone: TZ });

export const EARNED_COMMISSION: SalesCommissionStatus[] = [
  SalesCommissionStatus.PENDING,
  SalesCommissionStatus.APPROVED,
  SalesCommissionStatus.ON_HOLD,
  SalesCommissionStatus.PAID,
];

/** "2026-10" in Cairo time. */
export const monthKey = (d: Date) => keyFmt.format(d).slice(0, 7);

/** An instant safely before the start of the Cairo month `offset` months from now. */
export function cairoMonthStart(offset: number, now = new Date()) {
  const [y, m] = monthKey(now).split("-").map(Number);
  // Cairo is UTC+2/+3: start a few hours early, then bucket by Cairo key.
  return new Date(Date.UTC(y, m - 1 + offset, 1) - 3 * 3_600_000);
}

export type FinanceMonth = {
  key: string;
  label: string;
  longLabel: string;
  charges: number;
  refunds: number;
  revenue: number;
  commissions: number;
  profit: number;
  topups: number;
};

/** Last `count` months, oldest → newest; the last one is the current month. */
export async function getMonthlyFinance(count: number, now = new Date()): Promise<FinanceMonth[]> {
  const since = cairoMonthStart(-(count - 1), now);

  const [ledger, commissions, adjustments] = await Promise.all([
    prisma.balanceTransaction.findMany({
      where: {
        createdAt: { gte: since },
        type: { in: [BalanceTransactionType.TOPUP, BalanceTransactionType.SUBSCRIPTION_CHARGE, BalanceTransactionType.REFUND] },
      },
      select: { type: true, amount: true, createdAt: true },
    }),
    prisma.salesCommission.findMany({
      where: { paymentAt: { gte: since }, status: { in: EARNED_COMMISSION } },
      select: { amount: true, paymentAt: true },
    }),
    prisma.salesCommissionAdjustment.findMany({ where: { createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
  ]);

  const months: FinanceMonth[] = Array.from({ length: count }, (_, i) => {
    // Mid-month instant so the label is unambiguous in any timezone.
    const mid = new Date(cairoMonthStart(-(count - 1) + i, now).getTime() + 10 * 86_400_000);
    return { key: monthKey(mid), label: labelFmt.format(mid), longLabel: longLabelFmt.format(mid), charges: 0, refunds: 0, revenue: 0, commissions: 0, profit: 0, topups: 0 };
  });
  const byKey = new Map(months.map((m) => [m.key, m]));

  for (const tx of ledger) {
    const m = byKey.get(monthKey(tx.createdAt));
    if (!m) continue;
    if (tx.type === BalanceTransactionType.SUBSCRIPTION_CHARGE) m.charges += Math.abs(tx.amount);
    else if (tx.type === BalanceTransactionType.REFUND) m.refunds += Math.abs(tx.amount);
    else m.topups += tx.amount;
  }
  for (const c of commissions) {
    const m = byKey.get(monthKey(c.paymentAt));
    if (m) m.commissions += c.amount;
  }
  for (const a of adjustments) {
    const m = byKey.get(monthKey(a.createdAt));
    if (m) m.commissions += a.amount;
  }
  for (const m of months) {
    m.revenue = m.charges - m.refunds;
    m.profit = m.revenue - m.commissions;
  }
  return months;
}

/** All-time totals plus what's still owed to sales reps. */
export async function getFinanceTotals() {
  const [charges, refunds, earned, adjustments, payouts, owedCommissions, owedAdjustments, onHold] = await Promise.all([
    prisma.balanceTransaction.aggregate({ where: { type: BalanceTransactionType.SUBSCRIPTION_CHARGE }, _sum: { amount: true } }),
    prisma.balanceTransaction.aggregate({ where: { type: BalanceTransactionType.REFUND }, _sum: { amount: true } }),
    prisma.salesCommission.aggregate({ where: { status: { in: EARNED_COMMISSION } }, _sum: { amount: true } }),
    prisma.salesCommissionAdjustment.aggregate({ _sum: { amount: true } }),
    prisma.salesPayout.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
    // Payable now: approved and not in a payout yet (plus unpaid corrections).
    prisma.salesCommission.aggregate({ where: { status: SalesCommissionStatus.APPROVED, payoutId: null }, _sum: { amount: true } }),
    prisma.salesCommissionAdjustment.aggregate({ where: { payoutId: null }, _sum: { amount: true } }),
    prisma.salesCommission.aggregate({ where: { status: { in: [SalesCommissionStatus.PENDING, SalesCommissionStatus.ON_HOLD] } }, _sum: { amount: true } }),
  ]);

  const revenue = Math.abs(charges._sum.amount ?? 0) - Math.abs(refunds._sum.amount ?? 0);
  const commissions = (earned._sum.amount ?? 0) + (adjustments._sum.amount ?? 0);
  return {
    revenue,
    commissions,
    profit: revenue - commissions,
    paidOut: payouts._sum.amount ?? 0,
    payoutCount: payouts._count._all,
    owed: Math.max(0, (owedCommissions._sum.amount ?? 0) + (owedAdjustments._sum.amount ?? 0)),
    onHold: onHold._sum.amount ?? 0,
  };
}

/** profit ÷ revenue, or null when there was no revenue. */
export const margin = (profit: number, revenue: number) => (revenue > 0 ? profit / revenue : null);
