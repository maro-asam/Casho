import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ImportConnection, ImportJob } from "@prisma/client";

vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/store/store-guard", () => ({ requireStoreContext: vi.fn() }));
vi.mock("@/lib/integrations/import/engine", () => ({ isRunnable: vi.fn(() => false), runImportJob: vi.fn() }));
vi.mock("@/lib/integrations/shopify/source", () => ({ fetchPreviewCounts: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    importJob: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    importItemError: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), groupBy: vi.fn() },
    importConnection: { findUnique: vi.fn() },
    store: { findUnique: vi.fn() },
    storeMember: { findUnique: vi.fn() },
  },
}));

const { requireStoreContext } = await import("@/lib/store/store-guard");
const { prisma } = await import("@/lib/prisma");
const { canManageImports, userCanManageImports } = await import("./access");
const { redactSecrets } = await import("./errors");
const { toConnectionView } = await import("./views");
const actions = await import("@/actions/integrations/shopify-import.actions");

const OWNER_A = { userId: "owner-a", storeId: "store-A", role: "STORE_OWNER" as const, isOwner: true };

const CONNECTION: ImportConnection = {
  id: "conn-A",
  storeId: "store-A",
  provider: "SHOPIFY",
  externalShopId: "gid://shopify/Shop/1",
  shopName: "Acme",
  shopDomain: "acme.myshopify.com",
  currencyCode: "EGP",
  accessTokenEnc: "v1:iv:tag:ENCRYPTED_ACCESS",
  accessTokenExpiresAt: new Date(),
  refreshTokenEnc: "v1:iv:tag:ENCRYPTED_REFRESH",
  refreshTokenExpiresAt: new Date(),
  scopes: ["read_products"],
  status: "ACTIVE",
  connectedByUserId: "owner-a",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const JOB: ImportJob = {
  id: "job-A",
  storeId: "store-A",
  connectionId: "conn-A",
  provider: "SHOPIFY",
  externalShopId: "gid://shopify/Shop/1",
  kind: "FULL",
  retryOfJobId: null,
  status: "RUNNING",
  entities: ["PRODUCT"],
  currentEntity: "PRODUCT",
  cursor: '{"after":"secret-cursor"}',
  progress: {},
  attempts: 0,
  nextRunAt: new Date(),
  lockedUntil: null,
  lockToken: "lease-token",
  lastError: null,
  startedByUserId: "owner-a",
  startedAt: new Date(),
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireStoreContext).mockResolvedValue(OWNER_A);
});

describe("authorization", () => {
  it("only owners may manage imports", () => {
    expect(canManageImports({ isOwner: true, role: "STORE_OWNER" })).toBe(true);
    expect(canManageImports({ isOwner: false, role: "STORE_MANAGER" })).toBe(false);
    expect(canManageImports({ isOwner: false, role: "STORE_STAFF" })).toBe(false);
  });

  it("a staff member gets an error and touches no import data", async () => {
    vi.mocked(requireStoreContext).mockResolvedValue({ userId: "staff", storeId: "store-A", role: "STORE_STAFF", isOwner: false });
    const result = await actions.GetImportJobStatusAction("job-A");
    expect(result.ok).toBe(false);
    expect(prisma.importJob.findFirst).not.toHaveBeenCalled();
  });

  it("a user of another store can't finish an OAuth flow for this store", async () => {
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ userId: "owner-a" } as never);
    vi.mocked(prisma.storeMember.findUnique).mockResolvedValue(null);
    expect(await userCanManageImports("owner-b", "store-A")).toBe(false);
    expect(await userCanManageImports("owner-a", "store-A")).toBe(true);
  });
});

describe("tenant isolation", () => {
  it("unauthorized user cannot read another store's import", async () => {
    vi.mocked(prisma.importJob.findFirst).mockResolvedValue(null); // job-B is not in store-A
    const result = await actions.GetImportJobStatusAction("job-B");
    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(prisma.importJob.findFirst).toHaveBeenCalledWith({ where: { id: "job-B", storeId: "store-A" } });
  });

  it("cancel / resume / retry are scoped to the caller's store", async () => {
    vi.mocked(prisma.importJob.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.importJob.findFirst).mockResolvedValue(null);

    await actions.CancelImportJobAction("job-B");
    expect(vi.mocked(prisma.importJob.updateMany).mock.calls[0][0]!.where).toMatchObject({ id: "job-B", storeId: "store-A" });

    expect((await actions.ResumeImportJobAction("job-B")).ok).toBe(false);
    expect((await actions.RetryFailedItemsAction("job-B")).ok).toBe(false);
    for (const call of vi.mocked(prisma.importJob.findFirst).mock.calls) {
      expect(call[0]!.where).toMatchObject({ storeId: "store-A" });
    }
  });
});

describe("tokens are never exposed", () => {
  it("page state contains no tokens, lease or cursor", async () => {
    vi.mocked(prisma.importConnection.findUnique).mockResolvedValue(CONNECTION);
    vi.mocked(prisma.importJob.findMany).mockResolvedValue([JOB]);
    vi.mocked(prisma.importJob.findFirst).mockResolvedValue(JOB);

    const state = await actions.GetShopifyImportStateAction();
    const serialized = JSON.stringify(state);
    expect(state.ok).toBe(true);
    for (const secret of ["ENCRYPTED_ACCESS", "ENCRYPTED_REFRESH", "lease-token", "secret-cursor", "accessTokenEnc", "refreshTokenEnc"]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("the connection view is built field by field", () => {
    expect(Object.keys(toConnectionView(CONNECTION)).sort()).toEqual(
      ["connectedAt", "currencyCode", "hasAllOrders", "provider", "shopDomain", "shopName", "status"].sort(),
    );
  });

  it("log redaction strips Shopify tokens and secrets", () => {
    const line = redactSecrets('POST code=abc&client_secret=xyz {"access_token":"shpat_123"} X-Shopify-Access-Token: shpat_456 shprt_789');
    for (const leaked of ["abc", "xyz", "shpat_123", "shpat_456", "shprt_789"]) expect(line).not.toContain(leaked);
  });
});
