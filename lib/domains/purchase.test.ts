import { beforeEach, describe, expect, it, vi } from "vitest";

// Money invariants of domain purchases and renewals, against a small in-memory
// stand-in for the Prisma calls lib/domains/purchase.ts makes (with rollback on
// a thrown transaction) and a mocked Vercel registrar.

type Row = Record<string, unknown> & { id: string };
const db: { store: Row[]; domainRegistration: Row[]; balanceTransaction: Row[] } = { store: [], domainRegistration: [], balanceTransaction: [] };
let seq = 0;

function matches(row: Row, where: Record<string, unknown> = {}): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond === null) return value == null;
    if (cond instanceof Date) return value instanceof Date && value.getTime() === cond.getTime();
    if (typeof cond === "object") {
      const c = cond as Record<string, unknown>;
      if ("in" in c) return (c.in as unknown[]).includes(value);
      if ("not" in c) return c.not === null ? value != null : value !== c.not;
      if ("gte" in c) return (value as number) >= (c.gte as number);
      if ("lt" in c) return value instanceof Date && value.getTime() < (c.lt as Date).getTime();
      if ("lte" in c) return value instanceof Date && value.getTime() <= (c.lte as Date).getTime();
    }
    return value === cond;
  });
}

function apply(row: Row, data: Record<string, unknown>) {
  for (const [key, v] of Object.entries(data)) {
    if (v && typeof v === "object" && !(v instanceof Date) && ("increment" in v || "decrement" in v)) {
      const d = v as { increment?: number; decrement?: number };
      row[key] = (row[key] as number) + (d.increment ?? 0) - (d.decrement ?? 0);
    } else row[key] = v;
  }
  row.updatedAt = new Date();
}

function withStore(row: Row, select?: Record<string, unknown>) {
  if (select && "store" in select) return { ...row, store: { balance: db.store.find((s) => s.id === row.storeId)?.balance } };
  return { ...row };
}

function table(name: keyof typeof db) {
  return {
    findUnique: async ({ where, select }: { where: Record<string, unknown>; select?: Record<string, unknown> }) => {
      const row = db[name].find((r) => matches(r, where));
      return row ? withStore(row, select) : null;
    },
    findUniqueOrThrow: async ({ where }: { where: Record<string, unknown> }) => {
      const row = db[name].find((r) => matches(r, where));
      if (!row) throw new Error("not found");
      return { ...row };
    },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const row = db[name].find((r) => matches(r, where));
      return row ? { ...row } : null;
    },
    findMany: async ({ where, select, take }: { where?: Record<string, unknown>; select?: Record<string, unknown>; take?: number }) =>
      db[name].filter((r) => matches(r, where)).slice(0, take ?? 1000).map((r) => withStore(r, select)),
    count: async ({ where }: { where: Record<string, unknown> }) => db[name].filter((r) => matches(r, where)).length,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      if (name === "domainRegistration" && db.domainRegistration.some((r) => r.domain === data.domain)) {
        const { Prisma } = await import("@prisma/client");
        throw new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "test" });
      }
      const row = { id: `${name}-${++seq}`, createdAt: new Date(), updatedAt: new Date(), ...data } as Row;
      db[name].push(row);
      return { ...row };
    },
    update: async ({ where, data, select }: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, unknown> }) => {
      const row = db[name].find((r) => matches(r, where));
      if (!row) throw new Error("not found");
      apply(row, data);
      return withStore(row, select);
    },
    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const rows = db[name].filter((r) => matches(r, where));
      rows.forEach((r) => apply(r, data));
      return { count: rows.length };
    },
  };
}

const prismaMock = {
  store: table("store"),
  domainRegistration: table("domainRegistration"),
  balanceTransaction: table("balanceTransaction"),
  $transaction: async <T,>(fn: (tx: unknown) => Promise<T>) => {
    const snapshot = structuredClone(db);
    try {
      return await fn(prismaMock);
    } catch (error) {
      Object.assign(db, snapshot);
      throw error;
    }
  },
};

const registrar = vi.hoisted(() => ({
  registrarConfigured: true,
  searchDomains: vi.fn(),
  buyDomain: vi.fn(),
  renewDomain: vi.fn(),
  getOrderOutcome: vi.fn(),
  getTeamDomain: vi.fn(),
  getDomainPrice: vi.fn(),
}));
const notify = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/storefront-cache", () => ({ revalidateStorefront: vi.fn() }));
vi.mock("@/lib/notifications/in-app", () => ({ createStoreNotification: notify, formatPiastersAsEgp: (p: number) => `${p / 100} EGP` }));
vi.mock("@/lib/custom-domain/vercel", () => ({ vercelConfigured: true, addProjectDomain: vi.fn(async () => ({ ok: true })), removeProjectDomain: vi.fn() }));
vi.mock("@/lib/custom-domain/verify", () => ({ runDomainCheck: vi.fn(async () => ({ status: "PENDING" })) }));
vi.mock("./registrar", () => registrar);
vi.mock("./settings", () => ({
  getDomainSettings: vi.fn(async () => ({
    enabled: true,
    usdRate: 5000,
    markupBps: 2000,
    registrant: { firstName: "A", lastName: "B", email: "a@b.co", phone: "+201001234567", address1: "x", city: "Cairo", state: "Cairo", zip: "11511", country: "EG" },
  })),
  domainSalesOpen: () => true,
}));

const { purchaseDomain, settlePurchase, sweepDomainRegistrations } = await import("./purchase");

const DAY = 86_400_000;
const PRICE = 72_500; // 12.03 USD × 50 × 1.2 → 725 EGP
const hit = { domain: "shop1.com", available: true, years: 1, price: 12.03, renewalPrice: 12.03, premium: false };

const store = () => db.store[0];
const ledger = () => db.balanceTransaction.map((t) => [t.type, t.amount]);
const reg = () => db.domainRegistration[0];

async function run<T>(p: Promise<T>) {
  await vi.runAllTimersAsync();
  return p;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.clearAllMocks();
  db.store = [{ id: "s1", slug: "shop1", balance: 100_000, customDomain: null, customDomainStatus: "PENDING", customDomainConnectedAt: null, subdomainEnabled: true }];
  db.domainRegistration = [];
  db.balanceTransaction = [];
  registrar.searchDomains.mockResolvedValue([hit]);
  registrar.getTeamDomain.mockResolvedValue({ expiresAt: new Date(Date.now() + 365 * DAY), boughtAt: new Date() });
});

describe("purchaseDomain", () => {
  it("charges once, buys at Vercel's quoted USD price and connects the domain", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: true, data: { orderId: "o1" } });
    registrar.getOrderOutcome.mockResolvedValue({ outcome: "completed" });

    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));

    expect(res).toMatchObject({ ok: true, status: "ACTIVE" });
    expect(registrar.buyDomain).toHaveBeenCalledWith("shop1.com", expect.objectContaining({ expectedPrice: 12.03 }));
    expect(store().balance).toBe(100_000 - PRICE);
    expect(ledger()).toEqual([["DOMAIN_CHARGE", -PRICE]]);
    expect(reg()).toMatchObject({ status: "ACTIVE", pricePaid: PRICE, costUsdCents: 1203, autoRenew: true });
    expect(store().customDomain).toBe("shop1.com");
  });

  it("stops without charging when the live price differs from the one confirmed", async () => {
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE - 500 }));
    expect(res).toMatchObject({ ok: false, reason: "price-changed", price: PRICE });
    expect(store().balance).toBe(100_000);
    expect(db.domainRegistration).toHaveLength(0);
    expect(registrar.buyDomain).not.toHaveBeenCalled();
  });

  it("stops without charging when the balance is short", async () => {
    store().balance = PRICE - 1;
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(res).toMatchObject({ ok: false, reason: "short" });
    expect(store().balance).toBe(PRICE - 1);
    expect(db.domainRegistration).toHaveLength(0);
    expect(ledger()).toEqual([]);
    expect(registrar.buyDomain).not.toHaveBeenCalled();
  });

  it("won't sell a name that's already registered or being registered", async () => {
    db.domainRegistration.push({ id: "r0", domain: "shop1.com", status: "PENDING", storeId: "s2" });
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(res).toMatchObject({ ok: false, reason: "busy" });
    expect(store().balance).toBe(100_000);
    expect(registrar.buyDomain).not.toHaveBeenCalled();
  });

  it("refunds in full when Vercel refuses the order", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: false, status: 400, code: "domain_not_available", definite: true });
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(res).toMatchObject({ ok: false, reason: "failed" });
    expect(store().balance).toBe(100_000);
    expect(ledger()).toEqual([
      ["DOMAIN_CHARGE", -PRICE],
      ["DOMAIN_REFUND", PRICE],
    ]);
    expect(reg().status).toBe("FAILED");
  });

  it("reuses a failed row when the name is bought again", async () => {
    registrar.buyDomain.mockResolvedValueOnce({ ok: false, status: 400, definite: true });
    await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    registrar.buyDomain.mockResolvedValueOnce({ ok: true, data: { orderId: "o2" } });
    registrar.getOrderOutcome.mockResolvedValue({ outcome: "completed" });
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(res).toMatchObject({ ok: true, status: "ACTIVE" });
    expect(db.domainRegistration).toHaveLength(1);
    expect(store().balance).toBe(100_000 - PRICE);
  });

  it("keeps a purchase with a lost answer pending, then refunds it once when Vercel confirms it never happened", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: false, status: 0, definite: false });
    registrar.getTeamDomain.mockResolvedValue(null); // can't ask Vercel either, at first
    const res = await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(res).toMatchObject({ ok: true, status: "PENDING" });
    expect(store().balance).toBe(100_000 - PRICE);

    // Recent: wait, whatever Vercel says.
    registrar.getTeamDomain.mockResolvedValue("missing");
    expect(await settlePurchase(reg().id)).toBe("PENDING");

    // Hours later and not on the team: refund — exactly once.
    reg().updatedAt = new Date(Date.now() - 3 * 3_600_000);
    expect(await settlePurchase(reg().id)).toBe("FAILED");
    expect(await settlePurchase(reg().id)).toBe("FAILED");
    expect(store().balance).toBe(100_000);
    expect(ledger().filter(([t]) => t === "DOMAIN_REFUND")).toHaveLength(1);
  });

  it("activates a purchase with a lost answer once the domain shows up as bought", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: false, status: 0, definite: false });
    registrar.getTeamDomain.mockResolvedValue("missing");
    await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    registrar.getTeamDomain.mockResolvedValue({ expiresAt: new Date(Date.now() + 365 * DAY), boughtAt: new Date() });
    expect(await settlePurchase(reg().id)).toBe("ACTIVE");
    expect(store().balance).toBe(100_000 - PRICE);
  });

  it("doesn't refund an order Vercel can't find yet — only a stale one that never landed", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: true, data: { orderId: "o1" } });
    registrar.getOrderOutcome.mockResolvedValue(null);
    await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    expect(reg().status).toBe("PENDING");

    reg().updatedAt = new Date(Date.now() - 3 * 3_600_000);
    registrar.getTeamDomain.mockResolvedValue("missing");
    expect(await settlePurchase(reg().id)).toBe("FAILED");
    expect(store().balance).toBe(100_000);
  });

  it("refunds an order that fails after it was placed", async () => {
    registrar.buyDomain.mockResolvedValue({ ok: true, data: { orderId: "o1" } });
    registrar.getOrderOutcome.mockResolvedValue({ outcome: "pending" });
    await run(purchaseDomain({ storeId: "s1", domain: "shop1.com", expectedPrice: PRICE }));
    registrar.getOrderOutcome.mockResolvedValue({ outcome: "failed", error: "payment-failed" });
    expect(await settlePurchase(reg().id)).toBe("FAILED");
    expect(store().balance).toBe(100_000);
    expect(reg().lastError).toBe("payment-failed");
  });
});

describe("sweepDomainRegistrations — renewals", () => {
  const RENEWAL = 72_500;
  const expiresIn = (days: number) => new Date(Date.now() + days * DAY);

  function active(over: Record<string, unknown> = {}) {
    db.domainRegistration.push({
      id: "r1",
      storeId: "s1",
      domain: "shop1.com",
      status: "ACTIVE",
      autoRenew: true,
      expiresAt: expiresIn(10),
      renewalOrderId: null,
      renewalCharge: null,
      renewalStartedAt: null,
      renewalFailedAt: null,
      renewalNoticeAt: null,
      updatedAt: new Date(),
      ...over,
    });
    store().customDomain = "shop1.com";
  }

  beforeEach(() => {
    registrar.getDomainPrice.mockResolvedValue({ purchase: 12.03, renewal: 12.03 });
  });

  it("charges the renewal, renews at Vercel and moves the expiry a year", async () => {
    active();
    const expiry = reg().expiresAt as Date;
    registrar.renewDomain.mockResolvedValue({ ok: true, data: { orderId: "rn1" } });
    registrar.getOrderOutcome.mockResolvedValue({ outcome: "completed" });
    registrar.getTeamDomain.mockResolvedValue({ expiresAt: new Date(expiry.getTime() + 365 * DAY), boughtAt: new Date() });

    await run(sweepDomainRegistrations());

    expect(registrar.renewDomain).toHaveBeenCalledWith("shop1.com", { expectedPrice: 12.03 });
    expect(store().balance).toBe(100_000 - RENEWAL);
    expect(ledger()).toEqual([["DOMAIN_CHARGE", -RENEWAL]]);
    expect((reg().expiresAt as Date).getTime()).toBe(expiry.getTime() + 365 * DAY);
    expect(reg().renewalOrderId).toBeNull();
  });

  it("doesn't renew far from expiry", async () => {
    active({ expiresAt: expiresIn(60) });
    await run(sweepDomainRegistrations());
    expect(registrar.renewDomain).not.toHaveBeenCalled();
    expect(store().balance).toBe(100_000);
  });

  it("reminds instead of charging when the balance is short — once, not every hour", async () => {
    active();
    store().balance = 1_000;
    await run(sweepDomainRegistrations());
    await run(sweepDomainRegistrations());
    expect(registrar.renewDomain).not.toHaveBeenCalled();
    expect(store().balance).toBe(1_000);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toMatchObject({ title: "رصيدك مش مكفي لتجديد الدومين" });
  });

  it("refunds a renewal Vercel refuses, and waits a day before trying again", async () => {
    active();
    registrar.renewDomain.mockResolvedValue({ ok: false, status: 400, definite: true });
    await run(sweepDomainRegistrations());
    expect(store().balance).toBe(100_000);
    expect(ledger()).toEqual([
      ["DOMAIN_CHARGE", -RENEWAL],
      ["DOMAIN_REFUND", RENEWAL],
    ]);
    expect(reg().renewalFailedAt).toBeInstanceOf(Date);

    await run(sweepDomainRegistrations());
    expect(registrar.renewDomain).toHaveBeenCalledTimes(1);
  });

  it("keeps a renewal with a lost answer charged until Vercel answers, then settles it", async () => {
    active();
    const expiry = reg().expiresAt as Date;
    registrar.renewDomain.mockResolvedValue({ ok: false, status: 0, definite: false });
    await run(sweepDomainRegistrations());
    expect(reg().renewalOrderId).toBe("unknown");
    expect(store().balance).toBe(100_000 - RENEWAL);

    // Vercel unreachable hours later: no refund on a guess.
    reg().renewalStartedAt = new Date(Date.now() - 3 * 3_600_000);
    registrar.getTeamDomain.mockResolvedValue(null);
    await run(sweepDomainRegistrations());
    expect(store().balance).toBe(100_000 - RENEWAL);

    // Vercel shows the new expiry: renewed, no refund.
    registrar.getTeamDomain.mockResolvedValue({ expiresAt: new Date(expiry.getTime() + 365 * DAY), boughtAt: new Date() });
    await run(sweepDomainRegistrations());
    expect(reg().renewalOrderId).toBeNull();
    expect(store().balance).toBe(100_000 - RENEWAL);
    expect(ledger().filter(([t]) => t === "DOMAIN_REFUND")).toHaveLength(0);
  });

  it("lets a domain with auto-renew off expire and puts the store back on its Casho address", async () => {
    active({ autoRenew: false, expiresAt: expiresIn(-1) });
    store().subdomainEnabled = false;
    await run(sweepDomainRegistrations());
    expect(reg().status).toBe("EXPIRED");
    expect(store()).toMatchObject({ customDomain: null, subdomainEnabled: true });
    expect(registrar.renewDomain).not.toHaveBeenCalled();
    expect(store().balance).toBe(100_000);
  });
});
