/**
 * Pure branch-access rules (no DB, no Next) so they can be unit tested.
 *
 * - The store owner can work in every branch.
 * - A member with `allBranches` can work in every branch (the default, so members
 *   that existed before branches keep their access).
 * - Otherwise a member can only work in the branches assigned to them.
 * - Inactive branches are never "workable", whatever the access.
 */

export type BranchAccess = {
  isOwner: boolean;
  allBranches: boolean;
  assignedBranchIds: string[];
};

export type BranchLike = { id: string; isActive: boolean; isDefault: boolean };

export const ALL_BRANCHES = "all";

export function hasAllBranchAccess(access: BranchAccess) {
  return access.isOwner || access.allBranches;
}

export function canAccessBranch(access: BranchAccess, branch: BranchLike) {
  if (!branch.isActive) return false;
  return hasAllBranchAccess(access) || access.assignedBranchIds.includes(branch.id);
}

/** Active branches the user may work in, default branch first. */
export function accessibleBranches<T extends BranchLike>(access: BranchAccess, branches: T[]): T[] {
  return branches
    .filter((b) => canAccessBranch(access, b))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * The branch to work in: the requested one when allowed, otherwise the default
 * branch when allowed, otherwise the first allowed one. Null = no access at all.
 */
export function resolveActiveBranch<T extends BranchLike>(allowed: T[], requestedId: string | null | undefined): T | null {
  return allowed.find((b) => b.id === requestedId) ?? allowed.find((b) => b.isDefault) ?? allowed[0] ?? null;
}

export type BranchScope<T extends BranchLike> =
  /** One branch. */
  | { kind: "branch"; branch: T; branchIds: string[] }
  /**
   * Every branch the user may see. `branchIds` is null when that is the whole store
   * (no filter needed, online orders included), otherwise the allowed subset.
   */
  | { kind: "all"; branch: null; branchIds: string[] | null };

/**
 * Scope for read-only screens (reports, lists). "all" is only offered when the user
 * can see more than one branch; restricted members get their own branches only.
 */
export function resolveBranchScope<T extends BranchLike>(
  access: BranchAccess,
  allowed: T[],
  requested: string | null | undefined,
): BranchScope<T> | null {
  if (!allowed.length) return null;
  const wantsAll = requested === ALL_BRANCHES || (!requested && allowed.length > 1);
  if (wantsAll && allowed.length > 1) {
    return { kind: "all", branch: null, branchIds: hasAllBranchAccess(access) ? null : allowed.map((b) => b.id) };
  }
  const branch = resolveActiveBranch(allowed, requested)!;
  return { kind: "branch", branch, branchIds: [branch.id] };
}
