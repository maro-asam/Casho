import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  salesAttribution: { findFirst: vi.fn(), findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
  salesCommission: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), aggregate: vi.fn(async () => ({ _sum: {} })) },
  balanceTransaction: { findMany: vi.fn(async () => []) },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { getAttributedCustomer, listAttributedCustomers, listCommissions } = await import("./queries");

beforeEach(() => vi.clearAllMocks());

describe("data scoping (IDOR)", () => {
  it("a rep asking for another rep's customer gets null and no payment data is read", async () => {
    prismaMock.salesAttribution.findFirst.mockResolvedValue(null);
    await expect(getAttributedCustomer({ salesRepId: "repA" }, "customer-of-repB")).resolves.toBeNull();
    expect(prismaMock.salesAttribution.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerUserId: "customer-of-repB", salesRepId: "repA" } }),
    );
    expect(prismaMock.balanceTransaction.findMany).not.toHaveBeenCalled();
  });

  it("the customer's commissions are filtered to the rep as well", async () => {
    prismaMock.salesAttribution.findFirst.mockResolvedValue({ id: "att1" });
    await getAttributedCustomer({ salesRepId: "repA" }, "c1");
    expect(prismaMock.salesCommission.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { attributionId: "att1", salesRepId: "repA" } }));
  });

  it("customer lists always carry the rep filter", async () => {
    await listAttributedCustomers({ salesRepId: "repA" }, { q: "shop", filter: "eligible" });
    for (const call of [...prismaMock.salesAttribution.count.mock.calls, ...prismaMock.salesAttribution.findMany.mock.calls] as unknown as [{ where: { salesRepId?: string } }][]) {
      expect(call[0].where.salesRepId).toBe("repA");
    }
  });

  it("commission lists always carry the rep filter", async () => {
    await listCommissions({ salesRepId: "repA" }, { q: "x", status: "APPROVED" });
    for (const call of [...prismaMock.salesCommission.count.mock.calls, ...prismaMock.salesCommission.findMany.mock.calls] as unknown as [{ where: { salesRepId?: string } }][]) {
      expect(call[0].where.salesRepId).toBe("repA");
    }
  });

  it("only the explicit admin scope reads across reps", async () => {
    await listCommissions({ all: true }, {});
    const where = (prismaMock.salesCommission.count.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    expect(where).not.toHaveProperty("salesRepId");
  });
});
