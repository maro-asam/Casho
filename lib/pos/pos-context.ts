import { PosShiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveActiveBranch } from "@/lib/store/branch-access";
import {
  ACTIVE_BRANCH_COOKIE,
  BranchAccessError,
  requireBranchAccess,
  type BranchAccessContext,
  type BranchSummary,
} from "@/lib/store/branch-context";
import { cookies } from "next/headers";

export type PosShiftRef = { id: string; branchId: string };

export type PosContext = BranchAccessContext & {
  /** The branch this cashier is selling in right now. */
  branch: BranchSummary;
  /** The cashier's own open shift, if any. */
  shift: PosShiftRef | null;
};

/**
 * Who is selling, where. A cashier with an open shift is pinned to that shift's
 * branch (the drawer can't move); otherwise the picked branch, validated against
 * the cashier's branch access. Never trusts a branch id from the client.
 */
export async function requirePosContext(): Promise<PosContext> {
  const ctx = await requireBranchAccess("use_pos", "pos");

  const open = await prisma.posShift.findFirst({
    where: { storeId: ctx.storeId, cashierId: ctx.userId, status: PosShiftStatus.OPEN },
    select: { id: true, branchId: true },
  });

  if (open?.branchId) {
    const branch = ctx.branches.find((b) => b.id === open.branchId);
    // Access to the branch was removed (or it was deactivated) mid-shift:
    // the cashier can still see and close the shift, but not sell.
    const fallback = branch ?? (await prisma.branch.findUniqueOrThrow({
      where: { id: open.branchId },
      select: { id: true, name: true, isActive: true, isDefault: true },
    }));
    return { ...ctx, branch: fallback, shift: { id: open.id, branchId: open.branchId } };
  }

  const picked = (await cookies()).get(ACTIVE_BRANCH_COOKIE)?.value;
  const branch = resolveActiveBranch(ctx.branches, picked);
  if (!branch) throw new BranchAccessError("مفيش فرع متاح ليك — كلم صاحب المتجر");
  return { ...ctx, branch, shift: null };
}

/** For mutations that sell/refund: the cashier must still be allowed in the branch. */
export function assertCanSellInBranch(ctx: PosContext) {
  if (!ctx.branches.some((b) => b.id === ctx.branch.id)) {
    throw new BranchAccessError("صلاحيتك على الفرع ده اتشالت — اقفل الوردية وكلم صاحب المتجر");
  }
}

/** Owners and managers may manage any shift in a branch they can access. */
export function canManageOthersShifts(ctx: BranchAccessContext) {
  return ctx.isOwner || ctx.role === "STORE_MANAGER";
}
