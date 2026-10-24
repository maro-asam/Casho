import { beforeEach, describe, expect, it, vi } from "vitest";

type Topup = { id: string; amount: number; status: "PENDING" | "APPROVED" | "REJECTED"; storeId: string; store: { userId: string } };
let topup: Topup;
const credits: number[] = [];

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/billing/renewal", () => ({ renewIfDue: vi.fn(async () => undefined) }));
vi.mock("@/lib/notifications/in-app", () => ({ createNotification: vi.fn(async () => undefined), formatPiastersAsEgp: (n: number) => `${n / 100} EGP` }));
vi.mock("@/lib/pixels/server", () => ({ queueStoreServerEvent: vi.fn() }));
vi.mock("@/lib/inventory/order-stock", () => ({ adjustStockForOrderStatus: vi.fn() }));
vi.mock("@/lib/balance", () => ({
  applyBalanceChangeTx: vi.fn(async (_tx: unknown, input: { amount: number }) => {
    credits.push(input.amount);
  }),
}));

// A tiny in-memory topupRequest table with the conditional updates the code relies on.
const topupRequest = {
  findUnique: vi.fn(async () => ({ ...topup })),
  updateMany: vi.fn(async ({ where, data }: { where: { status: string | { in: string[] } }; data: Partial<Topup> }) => {
    const allowed = typeof where.status === "string" ? [where.status] : where.status.in;
    if (!allowed.includes(topup.status)) return { count: 0 };
    Object.assign(topup, data);
    return { count: 1 };
  }),
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    topupRequest,
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ topupRequest })),
  },
}));

const { settleTopupPayment } = await import("./settle");

const settle = (paid: boolean) => settleTopupPayment({ topupRequestId: "t1", paid, paymentReference: "tx", providerLabel: "Paymob" });

describe("settleTopupPayment", () => {
  beforeEach(() => {
    topup = { id: "t1", amount: 50000, status: "PENDING", storeId: "s1", store: { userId: "u1" } };
    credits.length = 0;
  });

  it("credits a paid top-up exactly once, however many callbacks arrive", async () => {
    expect(await settle(true)).toBe("credited");
    expect(await settle(true)).toBe("already");
    expect(credits).toEqual([50000]);
    expect(topup.status).toBe("APPROVED");
  });

  it("still credits a success that follows a failed attempt", async () => {
    expect(await settle(false)).toBe("failed");
    expect(topup.status).toBe("REJECTED");
    expect(await settle(true)).toBe("credited");
    expect(credits).toEqual([50000]);
  });

  it("never un-approves a credited top-up", async () => {
    await settle(true);
    expect(await settle(false)).toBe("already");
    expect(topup.status).toBe("APPROVED");
  });
});
