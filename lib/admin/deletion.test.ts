import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { deleteStoreTree, deleteUserTree } = await import("./deletion");

/**
 * A fake transaction client that records every call as "model.method" in
 * order. An override is a fixed result or a function of the call count.
 */
function fakeTx(overrides: Record<string, Record<string, unknown>> = {}) {
  const calls: { name: string; args: unknown }[] = [];
  const counts = new Map<string, number>();
  const models = new Map<string, Record<string, unknown>>();
  const tx = new Proxy({} as Record<string, unknown>, {
    get(_, model: string) {
      if (!models.has(model)) {
        models.set(
          model,
          new Proxy({} as Record<string, unknown>, {
            get(__, method: string) {
              return async (args: unknown) => {
                const name = `${model}.${method}`;
                calls.push({ name, args });
                const n = counts.get(name) ?? 0;
                counts.set(name, n + 1);
                const fixed = overrides[model]?.[method];
                if (typeof fixed === "function") return fixed(n);
                if (fixed !== undefined) return fixed;
                return method === "findMany" ? [] : method === "findUnique" ? null : { count: 0 };
              };
            },
          }),
        );
      }
      return models.get(model);
    },
  });
  const order = () => calls.map((c) => c.name);
  return { tx: tx as never, calls, order };
}

describe("deleteStoreTree", () => {
  it("removes the store's money history before the store itself", async () => {
    const { tx, order } = fakeTx();
    await deleteStoreTree(tx, "s1");
    const names = order();
    const at = (n: string) => names.indexOf(n);
    for (const n of ["salesCommissionAdjustment.deleteMany", "salesCommission.deleteMany", "domainRegistration.deleteMany", "balanceTransaction.deleteMany"]) {
      expect(at(n)).toBeGreaterThan(-1);
      expect(at(n)).toBeLessThan(at("store.delete"));
    }
    expect(at("salesCommissionAdjustment.deleteMany")).toBeLessThan(at("salesCommission.deleteMany"));
    expect(names.at(-1)).toBe("store.delete");
  });
});

describe("deleteUserTree", () => {
  it("deletes every owned store, the attribution with its commissions, referrals, then the user", async () => {
    const { tx, calls, order } = fakeTx({
      store: { findMany: [{ id: "s1" }, { id: "s2" }] },
      salesAttribution: { findUnique: { id: "att1" } },
    });
    await deleteUserTree(tx, "u1");
    const names = order();
    expect(calls.filter((c) => c.name === "store.delete").map((c) => c.args)).toEqual([{ where: { id: "s1" } }, { where: { id: "s2" } }]);
    const at = (n: string) => names.indexOf(n);
    expect(at("salesCommission.deleteMany")).toBeLessThan(at("salesAttribution.delete"));
    expect(calls).toContainEqual({ name: "referralTransaction.deleteMany", args: { where: { OR: [{ referrerId: "u1" }, { referredUserId: "u1" }] } } });
    expect(calls).toContainEqual({ name: "referralRewardLog.deleteMany", args: { where: { referrerId: "u1" } } });
    expect(names.at(-1)).toBe("user.delete");
  });

  it("hands work done in another merchant's store to that store's owner", async () => {
    const { tx, calls } = fakeTx({
      // 1st read: the user's own stores (none); 2nd: owners of the stores they worked in.
      store: { findMany: (n: number) => (n === 0 ? [] : [{ id: "other", userId: "owner2" }]) },
      posShift: { findMany: [{ storeId: "other" }] },
    });
    await deleteUserTree(tx, "u1");
    expect(calls).toContainEqual({ name: "posHeldOrder.deleteMany", args: { where: { cashierId: "u1" } } });
    expect(calls).toContainEqual({ name: "posShift.updateMany", args: { where: { storeId: "other", cashierId: "u1" }, data: { cashierId: "owner2" } } });
  });
});
