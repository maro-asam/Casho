import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

const { getCurrentSession } = await import("@/lib/auth/session");
const { prisma } = await import("@/lib/prisma");
const { requireSalesRep, getSalesRepContext } = await import("./guard");

function session(userId: string | null) {
  vi.mocked(getCurrentSession).mockResolvedValue(userId ? ({ user: { id: userId } } as never) : null);
}
function account(role: string, salesRep: { id: string; status: string } | null, referralCode: string | null = "CODE1234") {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", name: "Rep", email: "r@x.com", role, referralCode, salesRep } as never);
}

beforeEach(() => vi.clearAllMocks());

describe("requireSalesRep", () => {
  it("redirects to /login without a session", async () => {
    session(null);
    await expect(requireSalesRep()).rejects.toThrow("REDIRECT:/login");
  });

  it("rejects a merchant (USER)", async () => {
    session("u1");
    account("USER", null);
    await expect(requireSalesRep()).rejects.toThrow("Unauthorized");
  });

  it("rejects an ADMIN — admins use /admin/sales, not the rep area", async () => {
    session("u1");
    account("ADMIN", null);
    await expect(requireSalesRep()).rejects.toThrow("Unauthorized");
  });

  it("rejects a disabled rep even with a live session", async () => {
    session("u1");
    account("SALES", { id: "rep1", status: "DISABLED" });
    await expect(requireSalesRep()).rejects.toThrow("Unauthorized");
    await expect(getSalesRepContext()).resolves.toBeNull();
  });

  it("rejects a SALES role without a rep profile", async () => {
    session("u1");
    account("SALES", null);
    await expect(requireSalesRep()).rejects.toThrow("Unauthorized");
  });

  it("returns the rep id from the session's account, re-read from the DB", async () => {
    session("u1");
    account("SALES", { id: "rep1", status: "ACTIVE" });
    await expect(requireSalesRep()).resolves.toMatchObject({ userId: "u1", salesRepId: "rep1", referralCode: "CODE1234" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" } }));
  });
});
