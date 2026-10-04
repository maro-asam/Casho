import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { seedDefaultBranchRows } from "@/lib/inventory/branch-stock";
import { hasPermission, type StorePermission } from "./permissions";
import { requireStoreContext, type StoreContext } from "./store-guard";
import {
  accessibleBranches,
  canAccessBranch,
  resolveActiveBranch,
  resolveBranchScope,
  type BranchAccess,
  type BranchScope,
} from "./branch-access";

/**
 * The branch the user last picked. Only a preference: every read goes through
 * the access rules below, so a forged cookie just falls back to an allowed branch.
 */
export const ACTIVE_BRANCH_COOKIE = "activeBranch";

const branchSelect = { id: true, name: true, isActive: true, isDefault: true } as const;
export type BranchSummary = { id: string; name: string; isActive: boolean; isDefault: boolean };

export type BranchAccessContext = StoreContext & {
  access: BranchAccess;
  /** Active branches this user may work in, default first. */
  branches: BranchSummary[];
};

export type BranchContext = BranchAccessContext & { branch: BranchSummary };
export type BranchScopeContext = BranchAccessContext & { scope: BranchScope<BranchSummary> };

export class BranchAccessError extends Error {
  constructor(message = "مش مسموح لك بالفرع ده") {
    super(message);
  }
}

function assertPermission(ctx: StoreContext, permission: StorePermission) {
  if (!ctx.isOwner && !hasPermission(ctx.role, permission)) throw new BranchAccessError("غير مصرح");
}

/** The store's default branch; promotes the oldest branch or creates one when missing. */
export async function getDefaultBranch(storeId: string): Promise<BranchSummary> {
  const existing = await prisma.branch.findFirst({ where: { storeId, isDefault: true }, select: branchSelect });
  if (existing) return existing;
  try {
    const oldest = await prisma.branch.findFirst({ where: { storeId }, orderBy: { createdAt: "asc" }, select: { id: true } });
    const branch = oldest
      ? await prisma.branch.update({ where: { id: oldest.id }, data: { isDefault: true, isActive: true }, select: branchSelect })
      : await prisma.branch.create({ data: { storeId, name: "الفرع الرئيسي", isDefault: true }, select: branchSelect });
    // Products that existed before the branch now live in it.
    await seedDefaultBranchRows(prisma, storeId);
    return branch;
  } catch {
    // Lost a race with another request (one default per store is a unique index).
    return prisma.branch.findFirstOrThrow({ where: { storeId, isDefault: true }, select: branchSelect });
  }
}

async function loadAccess(ctx: StoreContext): Promise<BranchAccessContext> {
  const [member, rows] = await Promise.all([
    ctx.isOwner
      ? null
      : prisma.storeMember.findUnique({
          where: { userId_storeId: { userId: ctx.userId, storeId: ctx.storeId } },
          select: { allBranches: true, branches: { select: { branchId: true } } },
        }),
    prisma.branch.findMany({ where: { storeId: ctx.storeId }, select: branchSelect, orderBy: { createdAt: "asc" } }),
  ]);

  const access: BranchAccess = {
    isOwner: ctx.isOwner,
    allBranches: member?.allBranches ?? false,
    assignedBranchIds: member?.branches.map((b) => b.branchId) ?? [],
  };

  // Stores that predate branches still get a main branch.
  const all = rows.some((b) => b.isDefault) ? rows : await getDefaultBranch(ctx.storeId).then(() =>
    prisma.branch.findMany({ where: { storeId: ctx.storeId }, select: branchSelect, orderBy: { createdAt: "asc" } }),
  );
  return { ...ctx, access, branches: accessibleBranches(access, all) };
}

async function requestedBranchId() {
  return (await cookies()).get(ACTIVE_BRANCH_COOKIE)?.value ?? null;
}

/**
 * Store + permission + the branches the user may work in.
 * `surface: "pos"` follows the store the user picked in the POS (employees);
 * the dashboard always works on the user's own store.
 */
export type Surface = "pos" | "dashboard";

export async function requireBranchAccess(permission: StorePermission, surface: Surface = "dashboard"): Promise<BranchAccessContext> {
  const ctx = await requireStoreContext({ usePicked: surface === "pos" });
  assertPermission(ctx, permission);
  return loadAccess(ctx);
}

/**
 * For screens that need exactly one branch (POS, shifts, returns, held orders).
 * Uses the user's picked branch when allowed, else their default/first branch.
 */
export async function requireBranchContext(permission: StorePermission, surface: Surface = "dashboard"): Promise<BranchContext> {
  const ctx = await requireBranchAccess(permission, surface);
  const branch = resolveActiveBranch(ctx.branches, await requestedBranchId());
  if (!branch) throw new BranchAccessError("مفيش فرع متاح ليك — كلم صاحب المتجر");
  return { ...ctx, branch };
}

/** For read-only screens that can show one branch or all branches the user may see. */
export async function requireBranchScope(
  permission: StorePermission,
  requested?: string | null,
  surface: Surface = "dashboard",
): Promise<BranchScopeContext> {
  const ctx = await requireBranchAccess(permission, surface);
  const scope = resolveBranchScope(ctx.access, ctx.branches, requested ?? (await requestedBranchId()));
  if (!scope) throw new BranchAccessError("مفيش فرع متاح ليك — كلم صاحب المتجر");
  return { ...ctx, scope };
}

/** Throws unless `branchId` is an active branch of the context's store that the user may use. */
export function assertBranchAllowed(ctx: BranchAccessContext, branchId: string | null | undefined) {
  const branch = ctx.branches.find((b) => b.id === branchId);
  if (!branch || !canAccessBranch(ctx.access, branch)) throw new BranchAccessError();
  return branch;
}

/** Prisma filter for a record's `branchId` under a scope. Undefined = no filter. */
export function branchWhere(scope: BranchScope<BranchSummary>): { branchId?: { in: string[] } } {
  return scope.branchIds ? { branchId: { in: scope.branchIds } } : {};
}
