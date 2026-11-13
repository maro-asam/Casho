import { SalesCommissionStatus as S } from "@prisma/client";

/**
 * Admin review transitions. PAID is terminal: a paid commission is corrected
 * with an adjustment (deducted from the next payout), never by changing status.
 * Payouts (→ PAID) are recorded only through recordSalesPayoutAction.
 */
export const COMMISSION_ACTIONS = {
  approve: { from: [S.PENDING, S.ON_HOLD], to: S.APPROVED, reasonRequired: false, label: "اعتماد" },
  hold: { from: [S.PENDING, S.APPROVED], to: S.ON_HOLD, reasonRequired: true, label: "تعليق" },
  reject: { from: [S.PENDING, S.ON_HOLD], to: S.REJECTED, reasonRequired: true, label: "رفض" },
  reverse: { from: [S.PENDING, S.APPROVED, S.ON_HOLD], to: S.REVERSED, reasonRequired: true, label: "إلغاء (عكس)" },
} as const satisfies Record<string, { from: S[]; to: S; reasonRequired: boolean; label: string }>;

export type CommissionAction = keyof typeof COMMISSION_ACTIONS;

export function isCommissionAction(value: string): value is CommissionAction {
  return Object.prototype.hasOwnProperty.call(COMMISSION_ACTIONS, value);
}

export function canApplyCommissionAction(status: S, action: CommissionAction): boolean {
  return (COMMISSION_ACTIONS[action].from as readonly S[]).includes(status);
}

export function availableCommissionActions(status: S): CommissionAction[] {
  return (Object.keys(COMMISSION_ACTIONS) as CommissionAction[]).filter((a) => canApplyCommissionAction(status, a));
}

/** Adjustments may not push a commission's net below zero, and never touch voided commissions. */
export function validateAdjustment(input: { status: S; amount: number; currentNet: number }): string | null {
  if (input.status === S.REJECTED || input.status === S.REVERSED) return "مينفعش تعديل عمولة ملغية أو مرفوضة";
  if (!Number.isSafeInteger(input.amount) || input.amount === 0) return "قيمة التعديل غير صحيحة";
  if (input.currentNet + input.amount < 0) return "التعديل هيخلي صافي العمولة بالسالب";
  return null;
}

/** Rep-level bonus (+) / deduction (−): the stored signed amount for a positive input in piasters. */
export function signedRepAdjustment(kind: "BONUS" | "DEDUCTION", piasters: number): number {
  const abs = Math.abs(piasters);
  return kind === "DEDUCTION" ? -abs : abs;
}

/** A bonus/deduction can be canceled only while no payout has settled it. */
export function canCancelRepAdjustment(row: { canceledAt: Date | null; payoutId: string | null }): boolean {
  return !row.canceledAt && !row.payoutId;
}
