import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * In-memory fake of exactly the Prisma calls the engine makes, so the
 * idempotency, tier-position and window logic run end to end without a DB.
 * Unique constraints mirror the schema (P2002 on duplicates).
 */
type Ledger = { id: string; storeId: string; userId: string; type: "SUBSCRIPTION_CHARGE" | "REFUND" | "TOPUP"; amount: number; createdAt: Date };
type Attribution = {
  id: string;
  customerUserId: string;
  salesRepId: string;
  originalSalesRepId: string;
  createdAt: Date;
  acquiredAt: Date | null;
  acquisitionTxId: string | null;
  cohortMonth: string | null;
  eligibleUntil: Date | null;
  changes: { toSalesRepId: string; createdAt: Date }[];
};
type Commission = {
  id: string;
  salesRepId: string;
  attributionId: string;
  balanceTransactionId: string;
  kind: string;
  status: string;
  rateBps: number;
  amount: number;
  basisAmount: number;
  tier: string | null;
  customerPosition: number | null;
  paymentAt: Date;
};
type Adjustment = { id: string; commissionId: string; amount: number; balanceTransactionId: string | null };

const db = {
  ledger: [] as Ledger[],
  attributions: [] as Attribution[],
  commissions: [] as Commission[],
  adjustments: [] as Adjustment[],
  reps: new Map<string, { status: "ACTIVE" | "DISABLED" }>(),
  audit: [] as unknown[],
};
let seq = 0;
const id = (p: string) => `${p}${++seq}`;
const unique = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

const RULE = {
  id: "rule1",
  starterRateBps: 1700,
  growthRateBps: 2000,
  proRateBps: 2200,
  starterMaxPosition: 10,
  growthMaxPosition: 20,
  renewalRateBps: 600,
  eligibilityMonths: 6,
  effectiveFrom: new Date("2020-01-01Z"),
  createdAt: new Date("2020-01-01Z"),
};

const fake = {
  $queryRaw: vi.fn(async () => [{ id: "locked" }]),
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(fake)),
  store: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const row = db.ledger.find((l) => l.storeId === where.id);
      return row ? { userId: row.userId } : { userId: where.id.replace("store-", "") };
    }),
  },
  salesCommissionRule: { findFirst: vi.fn(async () => RULE) },
  salesRep: {
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
      const rep = db.reps.get(where.id);
      if (!rep) throw new Error("rep not found");
      return rep;
    }),
  },
  salesAttribution: {
    findUnique: vi.fn(async ({ where }: { where: { customerUserId: string } }) => {
      const a = db.attributions.find((x) => x.customerUserId === where.customerUserId);
      return a ? { id: a.id } : null;
    }),
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
      const a = db.attributions.find((x) => x.id === where.id);
      if (!a) throw new Error("not found");
      return structuredClone(a);
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Attribution> }) => {
      const a = db.attributions.find((x) => x.id === where.id)!;
      Object.assign(a, data);
      return a;
    }),
    count: vi.fn(
      async ({ where }: { where: { salesRepId: string; id: { not: string }; acquiredAt: { lte: Date }; eligibleUntil: { gt: Date } } }) =>
        db.attributions.filter(
          (a) =>
            a.salesRepId === where.salesRepId &&
            a.id !== where.id.not &&
            a.acquiredAt !== null &&
            a.acquiredAt <= where.acquiredAt.lte &&
            a.eligibleUntil !== null &&
            a.eligibleUntil > where.eligibleUntil.gt,
        ).length,
    ),
  },
  balanceTransaction: {
    findMany: vi.fn(async ({ where }: { where: { store: { userId: string }; type: { in: string[] } } }) =>
      db.ledger
        .filter((l) => l.userId === where.store.userId && where.type.in.includes(l.type))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
        .map(({ userId: _userId, ...rest }) => rest),
    ),
  },
  salesCommission: {
    findMany: vi.fn(async ({ where }: { where: { attributionId: string } }) =>
      db.commissions
        .filter((c) => c.attributionId === where.attributionId)
        .map((c) => ({ ...c, adjustments: db.adjustments.filter((a) => a.commissionId === c.id).map((a) => ({ ...a })) })),
    ),
    create: vi.fn(async ({ data }: { data: Omit<Commission, "id"> }) => {
      if (db.commissions.some((c) => c.balanceTransactionId === data.balanceTransactionId && c.kind === data.kind)) throw unique();
      const row = { ...data, id: id("c") } as Commission;
      db.commissions.push(row);
      return { ...row };
    }),
  },
  salesCommissionAdjustment: {
    create: vi.fn(async ({ data }: { data: Omit<Adjustment, "id"> }) => {
      if (data.balanceTransactionId && db.adjustments.some((a) => a.balanceTransactionId === data.balanceTransactionId)) throw unique();
      const row = { ...data, id: id("adj") } as Adjustment;
      db.adjustments.push(row);
      return row;
    }),
  },
  salesAuditLog: { create: vi.fn(async ({ data }: { data: unknown }) => db.audit.push(data)) },
};

vi.mock("@/lib/prisma", () => ({ prisma: fake }));

const { syncSalesCommissionsForCustomer, recordSalesCommissionsForStore } = await import("./engine");

// ─── helpers ────────────────────────────────────────────────────────────────

function rep(repId: string, status: "ACTIVE" | "DISABLED" = "ACTIVE") {
  db.reps.set(repId, { status });
}

function attribute(customerUserId: string, salesRepId: string, createdAt = new Date("2026-01-01Z")) {
  const a: Attribution = {
    id: `att-${customerUserId}`,
    customerUserId,
    salesRepId,
    originalSalesRepId: salesRepId,
    createdAt,
    acquiredAt: null,
    acquisitionTxId: null,
    cohortMonth: null,
    eligibleUntil: null,
    changes: [],
  };
  db.attributions.push(a);
  return a;
}

function charge(userId: string, amount: number, at: string, storeId = `store-${userId}`) {
  const row: Ledger = { id: id("bt"), storeId, userId, type: "SUBSCRIPTION_CHARGE", amount: -amount, createdAt: new Date(at) };
  db.ledger.push(row);
  return row;
}

function refund(userId: string, amount: number, at: string) {
  const row: Ledger = { id: id("bt"), storeId: `store-${userId}`, userId, type: "REFUND", amount, createdAt: new Date(at) };
  db.ledger.push(row);
  return row;
}

/** n customers of `repId` already acquired (eligible until `until`). */
function seedEligible(repId: string, n: number, acquiredAt = new Date("2026-02-01Z"), until = new Date("2026-08-01Z")) {
  for (let i = 0; i < n; i++) {
    const a = attribute(`seed-${repId}-${i}-${seq++}`, repId);
    a.acquiredAt = acquiredAt;
    a.eligibleUntil = until;
    a.cohortMonth = "2026-02";
  }
}

const commissionsOf = (userId: string) => db.commissions.filter((c) => c.attributionId === `att-${userId}`);

beforeEach(() => {
  db.ledger = [];
  db.attributions = [];
  db.commissions = [];
  db.adjustments = [];
  db.reps = new Map();
  db.audit = [];
  seq = 0;
  vi.clearAllMocks();
});

// ─── tests ──────────────────────────────────────────────────────────────────

describe("attribution prerequisites", () => {
  it("ignores customers without a sales attribution", async () => {
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    expect(await syncSalesCommissionsForCustomer("u1")).toEqual({ commissions: 0, adjustments: 0 });
    expect(db.commissions).toHaveLength(0);
  });

  it("a signup without any charge is not an acquired customer", async () => {
    rep("A");
    const a = attribute("u1", "A");
    db.ledger.push({ id: "top", storeId: "store-u1", userId: "u1", type: "TOPUP", amount: 50_000, createdAt: new Date("2026-04-01Z") });
    await syncSalesCommissionsForCustomer("u1");
    expect(a.acquiredAt).toBeNull();
    expect(db.commissions).toHaveLength(0);
  });
});

describe("acquisition commissions", () => {
  it("first verified charge → 17% acquisition, position 1, eligibility dates persisted", async () => {
    rep("A");
    const a = attribute("u1", "A");
    const first = charge("u1", 29_900, "2026-04-10T10:00:00Z");

    expect(await syncSalesCommissionsForCustomer("u1")).toEqual({ commissions: 1, adjustments: 0 });
    expect(commissionsOf("u1")).toEqual([
      expect.objectContaining({ kind: "ACQUISITION", status: "APPROVED", basisAmount: 29_900, rateBps: 1700, amount: 5_083, tier: "STARTER", customerPosition: 1, balanceTransactionId: first.id }),
    ]);
    expect(a.acquiredAt?.toISOString()).toBe("2026-04-10T10:00:00.000Z");
    expect(a.acquisitionTxId).toBe(first.id);
    expect(a.cohortMonth).toBe("2026-04");
    expect(a.eligibleUntil?.toISOString()).toBe("2026-09-30T21:00:00.000Z"); // 1 Oct 2026 00:00 Cairo
  });

  it("11th eligible customer gets 20%, 21st gets 22% — earlier ones untouched", async () => {
    rep("A");
    seedEligible("A", 10);
    attribute("u11", "A");
    charge("u11", 10_000, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u11");
    expect(commissionsOf("u11")[0]).toMatchObject({ customerPosition: 11, tier: "GROWTH", rateBps: 2000, amount: 2_000 });

    seedEligible("A", 9);
    attribute("u21", "A");
    charge("u21", 10_000, "2026-04-11T10:00:00Z");
    await syncSalesCommissionsForCustomer("u21");
    expect(commissionsOf("u21")[0]).toMatchObject({ customerPosition: 21, tier: "PRO", rateBps: 2200, amount: 2_200 });
    expect(commissionsOf("u11")[0]).toMatchObject({ rateBps: 2000, amount: 2_000 });
  });

  it("expired cohorts drop out of the count: 25 acquired but 9 eligible → next is #10 at 17%", async () => {
    rep("A");
    seedEligible("A", 16, new Date("2025-09-01Z"), new Date("2026-03-01Z")); // expired before the payment
    seedEligible("A", 9);
    attribute("u1", "A");
    charge("u1", 10_000, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1")[0]).toMatchObject({ customerPosition: 10, tier: "STARTER", rateBps: 1700 });
  });

  it("counts a customer once even with several stores", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z", "store-a");
    charge("u1", 29_900, "2026-04-12T10:00:00Z", "store-b");
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1").map((c) => c.kind)).toEqual(["ACQUISITION", "RENEWAL"]);
  });

  it("a disabled rep's new commission is created ON_HOLD", async () => {
    rep("A", "DISABLED");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1")[0].status).toBe("ON_HOLD");
  });
});

describe("renewal commissions", () => {
  it("initial payment is never a renewal; later charges inside the window are 6%", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    charge("u1", 29_900, "2026-05-10T10:00:00Z");
    charge("u1", 15_000, "2026-05-20T10:00:00Z"); // upgrade proration counts too (approved policy)
    await syncSalesCommissionsForCustomer("u1");
    const rows = commissionsOf("u1");
    expect(rows.map((c) => [c.kind, c.rateBps, c.amount])).toEqual([
      ["ACQUISITION", 1700, 5_083],
      ["RENEWAL", 600, 1_794],
      ["RENEWAL", 600, 900],
    ]);
  });

  it("renewals on/after the customer's own window end earn nothing", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    charge("u1", 29_900, "2026-09-30T20:59:00Z"); // last minute of September in Cairo
    charge("u1", 29_900, "2026-09-30T21:00:00Z"); // 1 Oct 00:00 Cairo — window closed
    charge("u1", 29_900, "2026-11-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1").map((c) => c.kind)).toEqual(["ACQUISITION", "RENEWAL"]);
  });

  it("a failed renewal (no ledger charge) creates nothing", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    // balance too low → billing moves to grace, writes no SUBSCRIPTION_CHARGE
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1")).toHaveLength(1);
  });
});

describe("idempotency", () => {
  it("re-running the sync never duplicates commissions or adjustments", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    charge("u1", 29_900, "2026-05-10T10:00:00Z");
    refund("u1", 10_000, "2026-05-15T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    const snapshot = JSON.stringify([db.commissions, db.adjustments]);
    expect(await syncSalesCommissionsForCustomer("u1")).toEqual({ commissions: 0, adjustments: 0 });
    expect(await syncSalesCommissionsForCustomer("u1")).toEqual({ commissions: 0, adjustments: 0 });
    expect(JSON.stringify([db.commissions, db.adjustments])).toBe(snapshot);
  });

  it("a concurrent duplicate write (P2002) is swallowed by the billing hook", async () => {
    rep("A");
    attribute("u1", "A");
    const first = charge("u1", 29_900, "2026-04-10T10:00:00Z");
    // Simulate another process inserting the same commission between read and write.
    fake.salesCommission.findMany.mockResolvedValueOnce([]);
    db.commissions.push({ id: "other", salesRepId: "A", attributionId: "att-u1", balanceTransactionId: first.id, kind: "ACQUISITION", status: "APPROVED", rateBps: 1700, amount: 5_083, basisAmount: 29_900, tier: "STARTER", customerPosition: 1, paymentAt: first.createdAt });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordSalesCommissionsForStore("store-u1")).resolves.toBeUndefined();
    expect(error).not.toHaveBeenCalled();
    expect(commissionsOf("u1")).toHaveLength(1);
    error.mockRestore();
  });

  it("the billing hook never throws even if the engine fails", async () => {
    fake.salesAttribution.findUnique.mockRejectedValueOnce(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordSalesCommissionsForStore("store-u1")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("refund credits (downgrade proration)", () => {
  it("claw back refund × rate of the funding commission, capped at its net", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    charge("u1", 29_900, "2026-05-10T10:00:00Z");
    const r1 = refund("u1", 15_000, "2026-05-15T10:00:00Z"); // → 6% renewal → 900
    const r2 = refund("u1", 99_000, "2026-05-16T10:00:00Z"); // → capped at remaining 894
    await syncSalesCommissionsForCustomer("u1");
    const renewal = commissionsOf("u1")[1];
    expect(db.adjustments).toEqual([
      expect.objectContaining({ commissionId: renewal.id, amount: -900, balanceTransactionId: r1.id }),
      expect.objectContaining({ commissionId: renewal.id, amount: -894, balanceTransactionId: r2.id }),
    ]);
    // the original commission row is never rewritten
    expect(renewal).toMatchObject({ amount: 1_794, rateBps: 600 });
  });

  it("no clawback against a reversed commission", async () => {
    rep("A");
    attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    db.commissions[0].status = "REVERSED";
    refund("u1", 10_000, "2026-04-15T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    expect(db.adjustments).toHaveLength(0);
  });
});

describe("attribution changes", () => {
  it("an admin attribution created after payment gets no retroactive commission, but acquisition dates are recorded", async () => {
    rep("A");
    charge("u1", 29_900, "2026-03-10T10:00:00Z");
    const a = attribute("u1", "A", new Date("2026-04-01Z"));
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");
    expect(a.cohortMonth).toBe("2026-03");
    expect(commissionsOf("u1").map((c) => [c.kind, c.salesRepId])).toEqual([["RENEWAL", "A"]]);
  });

  it("reassignment: earned commissions stay with the old rep, later charges go to the new rep", async () => {
    rep("A");
    rep("B");
    const a = attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");

    a.salesRepId = "B";
    a.changes.push({ toSalesRepId: "B", createdAt: new Date("2026-04-20Z") });
    charge("u1", 29_900, "2026-05-10T10:00:00Z");
    await syncSalesCommissionsForCustomer("u1");

    expect(commissionsOf("u1").map((c) => [c.kind, c.salesRepId, c.amount])).toEqual([
      ["ACQUISITION", "A", 5_083],
      ["RENEWAL", "B", 1_794],
    ]);
  });

  it("a charge missed before a reassignment is still credited to the rep of that moment", async () => {
    rep("A");
    rep("B");
    const a = attribute("u1", "A");
    charge("u1", 29_900, "2026-04-10T10:00:00Z"); // hook failed, not synced
    a.salesRepId = "B";
    a.changes.push({ toSalesRepId: "B", createdAt: new Date("2026-04-20Z") });
    await syncSalesCommissionsForCustomer("u1");
    expect(commissionsOf("u1")[0]).toMatchObject({ kind: "ACQUISITION", salesRepId: "A" });
  });
});
