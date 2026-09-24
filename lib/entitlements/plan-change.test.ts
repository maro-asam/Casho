import { describe, it, expect, vi } from "vitest";
import { FEATURE_KEYS, PLAN_KEYS } from "./feature-keys";

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
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 3 }),
    feature(FEATURE_KEYS.AI, false),
    feature(FEATURE_KEYS.CUSTOM_DOMAIN, false),
  ],
};

const GOLD = {
  id: "plan-gold",
  key: PLAN_KEYS.GOLD,
  slug: "gold",
  name: "Gold",
  sortOrder: 2,
  planFeatures: [
    feature(FEATURE_KEYS.DISCOUNT_CODES, true, { limitValue: 20 }),
    feature(FEATURE_KEYS.AI, true),
    feature(FEATURE_KEYS.CUSTOM_DOMAIN, true),
  ],
};

const PLANS = [SILVER, GOLD];

type World = { plan: (typeof PLANS)[number]; couponCount: number };
const STORE_WORLD = new Map<string, World>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    store: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const entry = STORE_WORLD.get(where.id);
        return entry ? { plan: entry.plan } : null;
      }),
    },
    plan: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => PLANS.find((p) => p.id === where.id) ?? null),
    },
    coupon: {
      count: vi.fn(async ({ where }: { where: { storeId: string } }) => STORE_WORLD.get(where.storeId)?.couponCount ?? 0),
    },
    product: { count: vi.fn(async () => 0) },
    storeMember: { count: vi.fn(async () => 0) },
  },
}));

const { previewPlanChange } = await import("./plan-change");

describe("previewPlanChange", () => {
  it("upgrade: reports gained features and no overages", async () => {
    STORE_WORLD.set("store-up", { plan: SILVER, couponCount: 2 });

    const preview = await previewPlanChange("store-up", GOLD.id);

    expect(preview.direction).toBe("upgrade");
    expect(preview.featuresGained.map((f) => f.key)).toEqual(
      expect.arrayContaining([FEATURE_KEYS.AI, FEATURE_KEYS.CUSTOM_DOMAIN]),
    );
    expect(preview.featuresLost).toEqual([]);
    expect(preview.overages).toEqual([]);
  });

  it("downgrade: reports lost features and flags an overage without deleting anything", async () => {
    STORE_WORLD.set("store-down", { plan: GOLD, couponCount: 15 });

    const preview = await previewPlanChange("store-down", SILVER.id);

    expect(preview.direction).toBe("downgrade");
    expect(preview.featuresLost.map((f) => f.key)).toEqual(
      expect.arrayContaining([FEATURE_KEYS.AI, FEATURE_KEYS.CUSTOM_DOMAIN]),
    );
    expect(preview.overages).toEqual([
      expect.objectContaining({ key: FEATURE_KEYS.DISCOUNT_CODES, current: 15, newLimit: 3 }),
    ]);
  });

  it("downgrade with usage already within the new limit reports no overage", async () => {
    STORE_WORLD.set("store-down-ok", { plan: GOLD, couponCount: 2 });

    const preview = await previewPlanChange("store-down-ok", SILVER.id);

    expect(preview.overages).toEqual([]);
  });
});
