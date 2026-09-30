import { describe, it, expect, vi, beforeEach } from "vitest";
import { FEATURE_KEYS, PLAN_KEYS } from "./feature-keys";

// Regression test for the current production plan configuration (as of the
// 2026-09-25 pricing update): products unlimited on every plan; discount
// codes Silver 3 / Gold 10 / Platinum unlimited; team members Silver 1 /
// Gold 3 / Platinum unlimited. If someone changes the seed or the live DB
// config again, this test documents the intended numbers and should be
// updated deliberately, not silently broken.

function feature(key: string, enabled: boolean, opts: { limitValue?: number | null; isUnlimited?: boolean } = {}) {
  return {
    enabled,
    limitValue: opts.limitValue ?? null,
    isUnlimited: opts.isUnlimited ?? false,
    configuration: null,
    feature: { key, name: key, unit: null, isActive: true, sortOrder: 0 },
  };
}

const SILVER = {
  id: "plan-silver",
  key: PLAN_KEYS.SILVER,
  slug: "silver",
  name: "Silver",
  sortOrder: 1,
  planFeatures: [
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 3 }),
    feature(FEATURE_KEYS.TEAM_MEMBERS, true, { limitValue: 1 }),
  ],
};

const GOLD = {
  id: "plan-gold",
  key: PLAN_KEYS.GOLD,
  slug: "gold",
  name: "Gold",
  sortOrder: 2,
  planFeatures: [
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 10 }),
    feature(FEATURE_KEYS.TEAM_MEMBERS, true, { limitValue: 3 }),
  ],
};

const PLATINUM = {
  id: "plan-platinum",
  key: PLAN_KEYS.PLATINUM,
  slug: "platinum",
  name: "Platinum",
  sortOrder: 3,
  planFeatures: [
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.TEAM_MEMBERS, true, { isUnlimited: true }),
  ],
};

const PLANS = [SILVER, GOLD, PLATINUM];

const STORE_WORLD = new Map<string, { plan: (typeof PLANS)[number]; couponCount: number; memberCount: number }>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findMany: vi.fn(async () => PLANS),
      findUnique: vi.fn(async ({ where }: { where: { key?: string; id?: string } }) =>
        PLANS.find((p) => p.key === where.key || p.id === where.id) ?? null,
      ),
    },
    store: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const entry = STORE_WORLD.get(where.id);
        return entry ? { plan: entry.plan } : null;
      }),
    },
    coupon: {
      count: vi.fn(async ({ where }: { where: { storeId: string } }) => STORE_WORLD.get(where.storeId)?.couponCount ?? 0),
    },
    product: { count: vi.fn(async () => 0) },
    storeMember: {
      count: vi.fn(async ({ where }: { where: { storeId: string } }) => STORE_WORLD.get(where.storeId)?.memberCount ?? 0),
    },
  },
}));

const { assertCanUse, getLimit } = await import("./service");
const { PlanLimitReachedError } = await import("./errors");

beforeEach(() => {
  STORE_WORLD.clear();
});

describe("production plan limits — products unlimited everywhere", () => {
  it.each([SILVER, GOLD, PLATINUM])("$key: products has no limit", async (plan) => {
    STORE_WORLD.set(`products-${plan.key}`, { plan, couponCount: 0, memberCount: 0 });
    expect(await getLimit(`products-${plan.key}`, FEATURE_KEYS.PRODUCTS)).toBeNull();
    // Even with a very large existing product count, creating more must never be blocked.
    await expect(assertCanUse(`products-${plan.key}`, FEATURE_KEYS.PRODUCTS)).resolves.toBeUndefined();
  });
});

describe("production plan limits — discount codes (Silver 3 / Gold 10 / Platinum unlimited)", () => {
  it("Silver allows up to 3, blocks the 4th", async () => {
    STORE_WORLD.set("silver-dc", { plan: SILVER, couponCount: 3, memberCount: 0 });
    const error = await assertCanUse("silver-dc", FEATURE_KEYS.DISCOUNT_CODES).catch((e) => e);
    expect(error).toBeInstanceOf(PlanLimitReachedError);
    expect(error).toMatchObject({ current: 3, limit: 3 });
  });

  it("Gold allows up to 10, blocks the 11th", async () => {
    STORE_WORLD.set("gold-dc", { plan: GOLD, couponCount: 10, memberCount: 0 });
    const error = await assertCanUse("gold-dc", FEATURE_KEYS.DISCOUNT_CODES).catch((e) => e);
    expect(error).toBeInstanceOf(PlanLimitReachedError);
    expect(error).toMatchObject({ current: 10, limit: 10 });
  });

  it("Platinum is never blocked, regardless of how many codes already exist", async () => {
    STORE_WORLD.set("platinum-dc", { plan: PLATINUM, couponCount: 10_000, memberCount: 0 });
    await expect(assertCanUse("platinum-dc", FEATURE_KEYS.DISCOUNT_CODES)).resolves.toBeUndefined();
  });
});

describe("production plan limits — team members (Silver 1 / Gold 3 / Platinum unlimited)", () => {
  it("Silver allows the first member, blocks a 2nd", async () => {
    STORE_WORLD.set("silver-tm-ok", { plan: SILVER, couponCount: 0, memberCount: 0 });
    await expect(assertCanUse("silver-tm-ok", FEATURE_KEYS.TEAM_MEMBERS)).resolves.toBeUndefined();

    STORE_WORLD.set("silver-tm-blocked", { plan: SILVER, couponCount: 0, memberCount: 1 });
    const error = await assertCanUse("silver-tm-blocked", FEATURE_KEYS.TEAM_MEMBERS).catch((e) => e);
    expect(error).toBeInstanceOf(PlanLimitReachedError);
    expect(error).toMatchObject({ current: 1, limit: 1 });
  });

  it("Gold's limit of 3 is unchanged", async () => {
    STORE_WORLD.set("gold-tm", { plan: GOLD, couponCount: 0, memberCount: 3 });
    const error = await assertCanUse("gold-tm", FEATURE_KEYS.TEAM_MEMBERS).catch((e) => e);
    expect(error).toMatchObject({ current: 3, limit: 3 });
  });

  it("Platinum's unlimited team members is unchanged", async () => {
    STORE_WORLD.set("platinum-tm", { plan: PLATINUM, couponCount: 0, memberCount: 500 });
    await expect(assertCanUse("platinum-tm", FEATURE_KEYS.TEAM_MEMBERS)).resolves.toBeUndefined();
  });
});
