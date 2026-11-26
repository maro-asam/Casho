import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = { marker: "tx" };
const prismaMock = {
  store: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  domainRegistration: { findMany: vi.fn(async () => []) },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/actions/admin/admin-guard.actions", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/security-log", () => ({ logSecurityEvent: vi.fn() }));
vi.mock("@/lib/cloudinary/cleanup", () => ({ collectStoreMedia: vi.fn(async () => []), queueMediaPurge: vi.fn() }));
vi.mock("@/lib/custom-domain/vercel", () => ({ vercelConfigured: false, removeProjectDomain: vi.fn() }));
vi.mock("@/lib/admin/deletion", () => ({
  deleteStoreTree: vi.fn(),
  deleteUserTree: vi.fn(),
  getMoneySnapshot: vi.fn(async () => ({ balance: 5000, ledger: "TOPUP ×1 = 5000", commissions: 0, commissionsAmount: 0 })),
  getStoreDeletionBlockers: vi.fn(),
  getUserDeletionCheck: vi.fn(),
}));

const { requireAdmin } = await import("@/actions/admin/admin-guard.actions");
const deletion = await import("@/lib/admin/deletion");
const { logSecurityEvent } = await import("@/lib/auth/security-log");
const { adminDeleteStoreAction, adminDeleteUserAction } = await import("./admin-delete.actions");

const asRole = (role: "ADMIN" | "SUPER_ADMIN") => vi.mocked(requireAdmin).mockResolvedValue({ id: "admin1", email: "a@x.com", role } as never);

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.store.findUnique.mockResolvedValue({ id: "s1", name: "Shop", slug: "shop", customDomain: null, userId: "owner1" });
  prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "m@x.com" });
  vi.mocked(deletion.getStoreDeletionBlockers).mockResolvedValue(["رصيده ٥٠ ج.م"]);
  vi.mocked(deletion.getUserDeletionCheck).mockResolvedValue({
    hardBlockers: [],
    blockers: ["متجر «Shop»: رصيده ٥٠ ج.م"],
    stores: [{ id: "s1", name: "Shop", slug: "shop", customDomain: null }],
  });
});

describe("adminDeleteStoreAction", () => {
  it("refuses an admin a store with money history", async () => {
    asRole("ADMIN");
    const res = await adminDeleteStoreAction("s1", "shop");
    expect(res.success).toBe(false);
    expect(deletion.deleteStoreTree).not.toHaveBeenCalled();
  });

  it("lets a super admin delete past money history even without the force flag", async () => {
    asRole("SUPER_ADMIN");
    const res = await adminDeleteStoreAction("s1", "shop");
    expect(res.success).toBe(true);
    expect(deletion.getStoreDeletionBlockers).not.toHaveBeenCalled();
    expect(deletion.deleteStoreTree).toHaveBeenCalledWith(tx, "s1");
    expect(logSecurityEvent).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ forced: true, balance: 5000 }) }));
  });

  it("refuses force from a plain admin before touching anything", async () => {
    asRole("ADMIN");
    const res = await adminDeleteStoreAction("s1", "shop", true);
    expect(res).toEqual({ success: false, message: "الحذف الإجباري متاح للسوبر أدمن بس" });
    expect(prismaMock.store.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("lets a super admin force past money blockers and logs the money snapshot", async () => {
    asRole("SUPER_ADMIN");
    const res = await adminDeleteStoreAction("s1", "shop", true);
    expect(res.success).toBe(true);
    expect(deletion.getStoreDeletionBlockers).not.toHaveBeenCalled();
    expect(deletion.deleteStoreTree).toHaveBeenCalledWith(tx, "s1");
    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "STORE_DELETED", metadata: expect.objectContaining({ forced: true, balance: 5000, ledger: "TOPUP ×1 = 5000" }) }),
    );
  });

  it("still requires the typed slug when forcing", async () => {
    asRole("SUPER_ADMIN");
    const res = await adminDeleteStoreAction("s1", "nope", true);
    expect(res.success).toBe(false);
    expect(deletion.deleteStoreTree).not.toHaveBeenCalled();
  });
});

describe("adminDeleteUserAction", () => {
  it("refuses an admin an account with money history", async () => {
    asRole("ADMIN");
    const res = await adminDeleteUserAction("u1", "m@x.com");
    expect(res.success).toBe(false);
    expect(deletion.deleteUserTree).not.toHaveBeenCalled();
  });

  it("refuses force from a plain admin", async () => {
    asRole("ADMIN");
    const res = await adminDeleteUserAction("u1", "m@x.com", true);
    expect(res.success).toBe(false);
    expect(deletion.deleteUserTree).not.toHaveBeenCalled();
  });

  it("lets a super admin force past money blockers", async () => {
    asRole("SUPER_ADMIN");
    const res = await adminDeleteUserAction("u1", "M@x.com", true);
    expect(res.success).toBe(true);
    expect(deletion.deleteUserTree).toHaveBeenCalledWith(tx, "u1");
    expect(deletion.getMoneySnapshot).toHaveBeenCalledWith(["s1"], "u1");
  });

  it("lets a super admin delete an account with money history even without the force flag", async () => {
    asRole("SUPER_ADMIN");
    const res = await adminDeleteUserAction("u1", "m@x.com");
    expect(res.success).toBe(true);
    expect(deletion.deleteUserTree).toHaveBeenCalledWith(tx, "u1");
  });

  it("never forces past hard blockers", async () => {
    asRole("SUPER_ADMIN");
    vi.mocked(deletion.getUserDeletionCheck).mockResolvedValue({ hardBlockers: ["مينفعش تحذف حسابك إنت"], blockers: [], stores: [] });
    const res = await adminDeleteUserAction("u1", "m@x.com", true);
    expect(res.success).toBe(false);
    expect(res.message).toContain("حسابك");
    expect(deletion.deleteUserTree).not.toHaveBeenCalled();
  });
});
