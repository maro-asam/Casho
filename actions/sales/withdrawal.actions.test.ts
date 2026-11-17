import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  $queryRaw: vi.fn(async () => [{ id: "rep1" }]),
  salesWithdrawalRequest: {
    findFirst: vi.fn(async () => null as { id: string } | null),
    create: vi.fn(async () => ({ id: "wr1" })),
  },
  salesAuditLog: { create: vi.fn(async () => ({})) },
};
const prismaMock = {
  ...tx,
  salesWithdrawalRequest: { ...tx.salesWithdrawalRequest, updateMany: vi.fn(async () => ({ count: 1 })) },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/sales/guard", () => ({ requireSalesRep: vi.fn() }));
vi.mock("@/lib/sales/queries", () => ({ getPayableItems: vi.fn() }));

const { requireSalesRep } = await import("@/lib/sales/guard");
const { getPayableItems } = await import("@/lib/sales/queries");
const { requestWithdrawalAction, cancelWithdrawalAction } = await import("./withdrawal.actions");

const REQUEST = "55555555-5555-4555-8555-555555555555";
const valid = { method: "فودافون كاش", account: "01012345678", note: "" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireSalesRep).mockResolvedValue({ userId: "u1", salesRepId: "rep1", name: "Rep", email: "r@x.com", referralCode: "CODE" });
  vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: ["c1"], adjustmentIds: [], repAdjustmentIds: [], total: 12_500 });
});

describe("requestWithdrawalAction", () => {
  it("rejects anyone who isn't an active rep before touching the DB", async () => {
    vi.mocked(requireSalesRep).mockRejectedValue(new Error("Unauthorized"));
    await expect(requestWithdrawalAction(valid)).rejects.toThrow("Unauthorized");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("asks for the whole payable, read server-side, for the session's rep", async () => {
    const res = await requestWithdrawalAction({ ...valid, amount: 1, salesRepId: "someone-else" });
    expect(res.success).toBe(true);
    expect(tx.$queryRaw).toHaveBeenCalled(); // SalesRep row lock
    expect(tx.salesWithdrawalRequest.create).toHaveBeenCalledWith({
      data: { salesRepId: "rep1", amount: 12_500, currency: "EGP", method: "فودافون كاش", account: "01012345678", note: null },
      select: { id: true },
    });
    expect(tx.salesAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "withdrawal_requested", actorUserId: "u1", salesRepId: "rep1" }) });
  });

  it("allows only one open request at a time", async () => {
    tx.salesWithdrawalRequest.findFirst.mockResolvedValueOnce({ id: "open" });
    const res = await requestWithdrawalAction(valid);
    expect(res.success).toBe(false);
    expect(tx.salesWithdrawalRequest.create).not.toHaveBeenCalled();
  });

  it("refuses when nothing is payable (or deductions exceed it)", async () => {
    vi.mocked(getPayableItems).mockResolvedValue({ commissionIds: [], adjustmentIds: [], repAdjustmentIds: ["r1"], total: -500 });
    const res = await requestWithdrawalAction(valid);
    expect(res.success).toBe(false);
    expect(tx.salesWithdrawalRequest.create).not.toHaveBeenCalled();
  });

  it("validates the method and the account", async () => {
    const res = await requestWithdrawalAction({ method: "PayPal", account: "x" });
    expect(res.success).toBe(false);
    expect(res.fieldErrors).toMatchObject({ method: expect.any(String), account: expect.any(String) });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("cancelWithdrawalAction", () => {
  it("cancels only the rep's own open request", async () => {
    const res = await cancelWithdrawalAction(REQUEST);
    expect(res.success).toBe(true);
    expect(prismaMock.salesWithdrawalRequest.updateMany).toHaveBeenCalledWith({
      where: { id: REQUEST, salesRepId: "rep1", status: "PENDING" },
      data: expect.objectContaining({ status: "CANCELED", decidedById: "u1" }),
    });
  });

  it("says so when the request was already closed (or isn't theirs)", async () => {
    prismaMock.salesWithdrawalRequest.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await cancelWithdrawalAction(REQUEST);
    expect(res.success).toBe(false);
  });
});
