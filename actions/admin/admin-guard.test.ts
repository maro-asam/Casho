import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

const { getCurrentSession } = await import("@/lib/auth/session");
const { prisma } = await import("@/lib/prisma");
const { requireAdmin, requireSuperAdmin } = await import("./admin-guard.actions");

function mockSession(userId: string | null) {
  vi.mocked(getCurrentSession).mockResolvedValue(
    userId ? ({ user: { id: userId } } as never) : null,
  );
}

function mockUserRole(role: "USER" | "ADMIN" | "SUPER_ADMIN") {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", email: "x@x.com", role } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAdmin — unauthorized access attempts", () => {
  it("redirects to /login when there is no session at all", async () => {
    mockSession(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login");
  });

  it("throws Unauthorized for a plain USER trying to call an admin action directly", async () => {
    mockSession("u1");
    mockUserRole("USER");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("allows ADMIN", async () => {
    mockSession("u1");
    mockUserRole("ADMIN");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("allows SUPER_ADMIN", async () => {
    mockSession("u1");
    mockUserRole("SUPER_ADMIN");
    await expect(requireAdmin()).resolves.toMatchObject({ role: "SUPER_ADMIN" });
  });
});

describe("requireSuperAdmin — a regular ADMIN cannot escalate to super-admin-only actions", () => {
  it("rejects an ADMIN (not SUPER_ADMIN)", async () => {
    mockSession("u1");
    mockUserRole("ADMIN");
    await expect(requireSuperAdmin()).rejects.toThrow("Unauthorized");
  });

  it("allows SUPER_ADMIN", async () => {
    mockSession("u1");
    mockUserRole("SUPER_ADMIN");
    await expect(requireSuperAdmin()).resolves.toMatchObject({ role: "SUPER_ADMIN" });
  });
});
