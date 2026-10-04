import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { changeBranchStock, syncDefaultBranch } from "./branch-stock";

/** Fake transaction: `branchQty` is what the branch row returns after the update (null = not enough). */
function fakeTx({ branchQty, defaultBranchId = "main" }: { branchQty: number | null; defaultBranchId?: string | null }) {
  return {
    $queryRaw: vi.fn(async () => (branchQty === null ? [] : [{ quantity: branchQty }])),
    product: { update: vi.fn(async () => ({})) },
    branch: { findFirst: vi.fn(async () => (defaultBranchId ? { id: defaultBranchId } : null)) },
  };
}

/** Values interpolated into the tagged SQL of the n-th $queryRaw call. */
const sqlValues = (tx: ReturnType<typeof fakeTx>, n = 0) => (tx.$queryRaw.mock.calls[n] as unknown[]).slice(1);

describe("changeBranchStock", () => {
  it("a sale only touches the selling branch's row and the store total", async () => {
    const tx = fakeTx({ branchQty: 97 });
    const res = await changeBranchStock(tx as never, {
      storeId: "s1",
      branchId: "downtown",
      productId: "coke",
      delta: -3,
      requireAvailable: true,
    });

    expect(res).toEqual({ before: 100, after: 97 });
    const values = sqlValues(tx);
    expect(values).toContain("downtown");
    expect(values).not.toContain("nasr");
    expect(values).toContain("coke");
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "coke" }, data: { stock: { increment: -3 } } });
  });

  it("refuses to oversell a branch and leaves the store total alone", async () => {
    const tx = fakeTx({ branchQty: null });
    const res = await changeBranchStock(tx as never, {
      storeId: "s1",
      branchId: "nasr",
      productId: "coke",
      delta: -50,
      requireAvailable: true,
    });

    expect(res).toBeNull();
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it("a return/receipt adds to the branch (upsert) and the store total", async () => {
    const tx = fakeTx({ branchQty: 5 });
    const res = await changeBranchStock(tx as never, { storeId: "s1", branchId: "alex", productId: "coke", delta: 2 });

    expect(res).toEqual({ before: 3, after: 5 });
    expect(sqlValues(tx)).toEqual(expect.arrayContaining(["s1", "alex", "coke", 2]));
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "coke" }, data: { stock: { increment: 2 } } });
  });
});

describe("syncDefaultBranch", () => {
  it("books a store-wide change on the main branch", async () => {
    const tx = fakeTx({ branchQty: 8 });
    await syncDefaultBranch(tx as never, { storeId: "s1", productId: "p", delta: -2 });
    expect(sqlValues(tx)).toEqual(expect.arrayContaining(["s1", "main", "p", -2]));
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it("does nothing for a zero change or a store without branches", async () => {
    const zero = fakeTx({ branchQty: 1 });
    await syncDefaultBranch(zero as never, { storeId: "s1", productId: "p", delta: 0 });
    expect(zero.$queryRaw).not.toHaveBeenCalled();

    const noBranch = fakeTx({ branchQty: 1, defaultBranchId: null });
    await syncDefaultBranch(noBranch as never, { storeId: "s1", productId: "p", delta: 4 });
    expect(noBranch.$queryRaw).not.toHaveBeenCalled();
  });
});
