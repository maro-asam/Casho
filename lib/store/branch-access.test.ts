import { describe, it, expect } from "vitest";
import {
  ALL_BRANCHES,
  accessibleBranches,
  canAccessBranch,
  resolveActiveBranch,
  resolveBranchScope,
  type BranchAccess,
} from "./branch-access";

const downtown = { id: "downtown", isActive: true, isDefault: true };
const nasr = { id: "nasr", isActive: true, isDefault: false };
const alex = { id: "alex", isActive: true, isDefault: false };
const closed = { id: "closed", isActive: false, isDefault: false };
const all = [nasr, closed, downtown, alex];

const owner: BranchAccess = { isOwner: true, allBranches: false, assignedBranchIds: [] };
const legacyMember: BranchAccess = { isOwner: false, allBranches: true, assignedBranchIds: [] };
const ahmed: BranchAccess = { isOwner: false, allBranches: false, assignedBranchIds: ["downtown"] };
const sara: BranchAccess = { isOwner: false, allBranches: false, assignedBranchIds: ["downtown", "nasr"] };
const nobody: BranchAccess = { isOwner: false, allBranches: false, assignedBranchIds: [] };

describe("branch access", () => {
  it("owner and all-branches members see every active branch, default first", () => {
    expect(accessibleBranches(owner, all).map((b) => b.id)).toEqual(["downtown", "nasr", "alex"]);
    expect(accessibleBranches(legacyMember, all).map((b) => b.id)).toEqual(["downtown", "nasr", "alex"]);
  });

  it("a member assigned to one branch cannot access another", () => {
    expect(canAccessBranch(ahmed, downtown)).toBe(true);
    expect(canAccessBranch(ahmed, nasr)).toBe(false);
    expect(accessibleBranches(ahmed, all).map((b) => b.id)).toEqual(["downtown"]);
  });

  it("a member assigned to two branches can access both, and only those", () => {
    expect(accessibleBranches(sara, all).map((b) => b.id)).toEqual(["downtown", "nasr"]);
    expect(canAccessBranch(sara, alex)).toBe(false);
  });

  it("inactive branches are never accessible, even for the owner", () => {
    expect(canAccessBranch(owner, closed)).toBe(false);
    expect(canAccessBranch({ ...sara, assignedBranchIds: ["closed"] }, closed)).toBe(false);
  });

  it("a member with no branches gets nothing", () => {
    expect(accessibleBranches(nobody, all)).toEqual([]);
    expect(resolveActiveBranch([], "downtown")).toBeNull();
    expect(resolveBranchScope(nobody, [], ALL_BRANCHES)).toBeNull();
  });
});

describe("active branch (POS)", () => {
  const sarasBranches = accessibleBranches(sara, all);

  it("uses the picked branch when allowed", () => {
    expect(resolveActiveBranch(sarasBranches, "nasr")?.id).toBe("nasr");
  });

  it("ignores a forged or foreign branch id and falls back to the default", () => {
    expect(resolveActiveBranch(sarasBranches, "alex")?.id).toBe("downtown");
    expect(resolveActiveBranch(sarasBranches, "branch-of-another-store")?.id).toBe("downtown");
    expect(resolveActiveBranch(sarasBranches, ALL_BRANCHES)?.id).toBe("downtown");
  });

  it("falls back to the first allowed branch when the default isn't allowed", () => {
    const onlyNasr = accessibleBranches({ ...nobody, assignedBranchIds: ["nasr"] }, all);
    expect(resolveActiveBranch(onlyNasr, null)?.id).toBe("nasr");
  });
});

describe("branch scope (reports)", () => {
  it("owner viewing all branches gets no filter (whole store, online included)", () => {
    const scope = resolveBranchScope(owner, accessibleBranches(owner, all), ALL_BRANCHES);
    expect(scope).toMatchObject({ kind: "all", branchIds: null });
  });

  it("a restricted member's 'all branches' is only their own branches", () => {
    const scope = resolveBranchScope(sara, accessibleBranches(sara, all), ALL_BRANCHES);
    expect(scope).toMatchObject({ kind: "all", branchIds: ["downtown", "nasr"] });
  });

  it("a single branch filters to that branch", () => {
    const scope = resolveBranchScope(owner, accessibleBranches(owner, all), "nasr");
    expect(scope).toMatchObject({ kind: "branch", branchIds: ["nasr"] });
  });

  it("single-branch stores never get an 'all' scope", () => {
    const scope = resolveBranchScope(owner, [downtown], ALL_BRANCHES);
    expect(scope).toMatchObject({ kind: "branch", branchIds: ["downtown"] });
  });

  it("a forged branch id falls back to an allowed branch", () => {
    const scope = resolveBranchScope(ahmed, accessibleBranches(ahmed, all), "nasr");
    expect(scope).toMatchObject({ kind: "branch", branchIds: ["downtown"] });
  });
});
