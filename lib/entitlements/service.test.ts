import { describe, it, expect, vi, beforeEach } from "vitest";
import { FEATURE_KEYS, PLAN_KEYS } from "./feature-keys";

// ─── Fixture: Silver / Gold / Platinum, mirroring the spec's own worked
// examples (discount_codes 3/20/unlimited; AI, custom domain and advanced
// analytics from Gold; CRM/POS/Inventory/unlimited bundles Platinum-only).

type FixtureFeature = {
  enabled: boolean;
  limitValue: number | null;
  isUnlimited: boolean;
  configuration: null;
  feature: { key: string; name: string; unit: string | null; isActive: boolean; sortOrder: number };
};

function feature(key: string, enabled: boolean, opts: { limitValue?: number | null; isUnlimited?: boolean } = {}): FixtureFeature {
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
  description: null,
  monthlyPrice: 30000,
  yearlyPrice: 300000,
  currency: "EGP",
  originalMonthlyPrice: null,
  originalYearlyPrice: null,
  discountPercent: null,
  sortOrder: 1,
  planFeatures: [
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 3 }),
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.CUSTOM_DOMAIN, false),
    feature(FEATURE_KEYS.AI, false),
    feature(FEATURE_KEYS.ANALYTICS_ADVANCED, false),
    feature(FEATURE_KEYS.CRM, false),
    feature(FEATURE_KEYS.POS, false),
    feature(FEATURE_KEYS.INVENTORY, false),
    feature(FEATURE_KEYS.BUNDLES, false),
  ],
};

const GOLD = {
  ...SILVER,
  id: "plan-gold",
  key: PLAN_KEYS.GOLD,
  slug: "gold",
  name: "Gold",
  sortOrder: 2,
  planFeatures: [
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 20 }),
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.CUSTOM_DOMAIN, true),
    feature(FEATURE_KEYS.AI, true),
    feature(FEATURE_KEYS.ANALYTICS_ADVANCED, true),
    feature(FEATURE_KEYS.CRM, false),
    feature(FEATURE_KEYS.POS, false),
    feature(FEATURE_KEYS.INVENTORY, false),
    feature(FEATURE_KEYS.BUNDLES, true, { limitValue: 10 }),
  ],
};

const PLATINUM = {
  ...SILVER,
  id: "plan-platinum",
  key: PLAN_KEYS.PLATINUM,
  slug: "platinum",
  name: "Platinum",
  sortOrder: 3,
  planFeatures: [
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.PRODUCTS, true, { isUnlimited: true }),
    feature(FEATURE_KEYS.CUSTOM_DOMAIN, true),
    feature(FEATURE_KEYS.AI, true),
    feature(FEATURE_KEYS.ANALYTICS_ADVANCED, true),
    feature(FEATURE_KEYS.CRM, true),
    feature(FEATURE_KEYS.POS, true),
    feature(FEATURE_KEYS.INVENTORY, true),
    feature(FEATURE_KEYS.BUNDLES, true, { isUnlimited: true }),
  ],
};

const PLANS = [SILVER, GOLD, PLATINUM];

// storeId -> { planId, couponCount } — each test uses its own unique storeId
// so cross-test memoization (from React's cache()) can never leak stale data.
const STORE_WORLD = new Map<string, { plan: (typeof PLANS)[number]; couponCount: number }>();

function registerStore(storeId: string, plan: (typeof PLANS)[number], couponCount = 0) {
  STORE_WORLD.set(storeId, { plan, couponCount });
}

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
        if (!entry) return null;
        return { plan: entry.plan };
      }),
    },
    coupon: {
      count: vi.fn(async ({ where }: { where: { storeId: string } }) => STORE_WORLD.get(where.storeId)?.couponCount ?? 0),
    },
    product: { count: vi.fn(async () => 0) },
    storeMember: { count: vi.fn(async () => 0) },
  },
}));

const { hasFeature, isUnlimited, getLimit, checkLimit, assertCanUse, getEntitlementsSnapshot } = await import(
  "./service"
);
const { FeatureNotAvailableError, PlanLimitReachedError } = await import("./errors");

beforeEach(() => {
  STORE_WORLD.clear();
});

describe("Silver plan", () => {
  it("allows creating discount codes up to the limit of 3", async () => {
    registerStore("silver-1", SILVER, 0);
    await expect(assertCanUse("silver-1", FEATURE_KEYS.DISCOUNT_CODES)).resolves.toBeUndefined();

    registerStore("silver-2", SILVER, 2);
    await expect(assertCanUse("silver-2", FEATURE_KEYS.DISCOUNT_CODES)).resolves.toBeUndefined();
  });

  it("blocks creating a 4th discount code once the limit of 3 is reached", async () => {
    registerStore("silver-3", SILVER, 3);
    const error = await assertCanUse("silver-3", FEATURE_KEYS.DISCOUNT_CODES).catch((e) => e);
    expect(error).toBeInstanceOf(PlanLimitReachedError);
    expect(error).toMatchObject({ code: "PLAN_LIMIT_REACHED", feature: FEATURE_KEYS.DISCOUNT_CODES, current: 3, limit: 3 });
    // Gold (20) is the cheapest plan that actually raises this limit.
    expect(error.requiredPlan).toBe("gold");
  });

  it("blocks AI, custom domain, and advanced analytics", async () => {
    registerStore("silver-4", SILVER);
    expect(await hasFeature("silver-4", FEATURE_KEYS.AI)).toBe(false);
    expect(await hasFeature("silver-4", FEATURE_KEYS.CUSTOM_DOMAIN)).toBe(false);
    expect(await hasFeature("silver-4", FEATURE_KEYS.ANALYTICS_ADVANCED)).toBe(false);

    const error = await assertCanUse("silver-4", FEATURE_KEYS.AI).catch((e) => e);
    expect(error).toBeInstanceOf(FeatureNotAvailableError);
    expect(error).toMatchObject({ code: "FEATURE_NOT_AVAILABLE", feature: FEATURE_KEYS.AI, requiredPlan: "gold" });
  });
});

describe("Gold plan", () => {
  it("keeps Silver-tier capabilities available", async () => {
    registerStore("gold-1", GOLD, 5);
    await expect(assertCanUse("gold-1", FEATURE_KEYS.DISCOUNT_CODES)).resolves.toBeUndefined();
  });

  it("unlocks Gold-tier capabilities: AI, custom domain, advanced analytics", async () => {
    registerStore("gold-2", GOLD);
    expect(await hasFeature("gold-2", FEATURE_KEYS.AI)).toBe(true);
    expect(await hasFeature("gold-2", FEATURE_KEYS.CUSTOM_DOMAIN)).toBe(true);
    expect(await hasFeature("gold-2", FEATURE_KEYS.ANALYTICS_ADVANCED)).toBe(true);
  });

  it("still blocks Platinum-only capabilities: CRM, POS, inventory", async () => {
    registerStore("gold-3", GOLD);
    expect(await hasFeature("gold-3", FEATURE_KEYS.CRM)).toBe(false);
    expect(await hasFeature("gold-3", FEATURE_KEYS.POS)).toBe(false);
    expect(await hasFeature("gold-3", FEATURE_KEYS.INVENTORY)).toBe(false);

    const error = await assertCanUse("gold-3", FEATURE_KEYS.POS).catch((e) => e);
    expect(error).toMatchObject({ code: "FEATURE_NOT_AVAILABLE", requiredPlan: "platinum" });
  });

  it("enforces its own (higher) discount code limit of 20", async () => {
    registerStore("gold-4", GOLD, 20);
    const error = await assertCanUse("gold-4", FEATURE_KEYS.DISCOUNT_CODES).catch((e) => e);
    expect(error).toBeInstanceOf(PlanLimitReachedError);
    expect(error).toMatchObject({ current: 20, limit: 20, requiredPlan: "platinum" });
  });
});

describe("Platinum plan", () => {
  it("allows every configured capability", async () => {
    registerStore("platinum-1", PLATINUM);
    for (const key of [FEATURE_KEYS.AI, FEATURE_KEYS.CUSTOM_DOMAIN, FEATURE_KEYS.CRM, FEATURE_KEYS.POS, FEATURE_KEYS.INVENTORY]) {
      expect(await hasFeature("platinum-1", key)).toBe(true);
    }
  });

  it("treats unlimited numeric features as truly unbounded regardless of usage", async () => {
    registerStore("platinum-2", PLATINUM, 5000);
    expect(await isUnlimited("platinum-2", FEATURE_KEYS.DISCOUNT_CODES)).toBe(true);
    expect(await getLimit("platinum-2", FEATURE_KEYS.DISCOUNT_CODES)).toBeNull();
    await expect(assertCanUse("platinum-2", FEATURE_KEYS.DISCOUNT_CODES)).resolves.toBeUndefined();
  });

  it("allows unlimited bundles", async () => {
    registerStore("platinum-3", PLATINUM);
    const result = await checkLimit("platinum-3", FEATURE_KEYS.BUNDLES);
    expect(result).toMatchObject({ allowed: true, enabled: true, isUnlimited: true, limit: null });
  });
});

describe("getEntitlementsSnapshot", () => {
  it("bundles plan, entitlements, and usage in one call", async () => {
    registerStore("snapshot-1", GOLD, 4);
    const snapshot = await getEntitlementsSnapshot("snapshot-1");
    expect(snapshot.plan.slug).toBe("gold");
    expect(snapshot.entitlements[FEATURE_KEYS.AI]).toEqual({ enabled: true, isUnlimited: false, limit: null });
    expect(snapshot.usage[FEATURE_KEYS.DISCOUNT_CODES]).toMatchObject({ used: 4, limit: 20, isUnlimited: false });
  });
});
