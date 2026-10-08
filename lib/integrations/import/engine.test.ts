import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ImportJob } from "@prisma/client";
import { SourceApiError } from "./errors";
import type { ImportSource } from "./types";

const tx = {
  importJob: { updateMany: vi.fn() },
  importItemError: { upsert: vi.fn(), updateMany: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    importJob: { updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    importConnection: { update: vi.fn() },
    importItemError: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  },
}));
vi.mock("@/lib/notifications/in-app", () => ({ createNotification: vi.fn() }));
vi.mock("./registry", () => ({ createImportSource: vi.fn() }));
vi.mock("./sink", () => ({ createPrismaSink: vi.fn(() => ({ apply: vi.fn(async () => ({ result: "imported" })) })) }));

const { prisma } = await import("@/lib/prisma");
const { createImportSource } = await import("./registry");
const { createNotification } = await import("@/lib/notifications/in-app");
const { runImportJob, MAX_ATTEMPTS, retryDelayMs, isRunnable } = await import("./engine");

function job(over: Partial<ImportJob> = {}) {
  return {
    id: "job-1",
    storeId: "store-A",
    connectionId: "conn-1",
    provider: "SHOPIFY",
    externalShopId: "shop-1",
    kind: "FULL",
    retryOfJobId: null,
    status: "RUNNING",
    entities: ["PRODUCT"],
    currentEntity: null,
    cursor: null,
    progress: { PRODUCT: { total: 1, processed: 0, imported: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, skipReasons: {}, done: false } },
    attempts: 0,
    nextRunAt: new Date(),
    lockedUntil: null,
    lockToken: null,
    lastError: null,
    startedByUserId: null,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    connection: { id: "conn-1", storeId: "store-A", externalShopId: "shop-1", status: "ACTIVE", provider: "SHOPIFY" },
    ...over,
  };
}

function source(fetchPage: ImportSource["fetchPage"]): ImportSource {
  return { provider: "SHOPIFY", externalShopId: "shop-1", count: async () => 1, fetchPage, fetchByIds: async () => [] };
}

/** The data passed to the final lease release (updateMany guarded by lockToken). */
function released() {
  const calls = vi.mocked(prisma.importJob.updateMany).mock.calls;
  return calls[calls.length - 1][0]!.data as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.importJob.updateMany).mockResolvedValue({ count: 1 });
  tx.importJob.updateMany.mockResolvedValue({ count: 1 });
});

describe("runImportJob", () => {
  it("a second worker can't take a job that is already leased", async () => {
    vi.mocked(prisma.importJob.updateMany).mockResolvedValueOnce({ count: 0 });
    expect(await runImportJob("job-1")).toBe("busy");
    expect(prisma.importJob.findUnique).not.toHaveBeenCalled();
  });

  it("completes the job and notifies the store", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job() as never);
    vi.mocked(createImportSource).mockReturnValue(
      source(async () => ({ items: [{ entity: "COLLECTION", externalId: "c1", label: "c", name: "c", handle: "c", imageUrl: null }], nextCursor: null })),
    );
    expect(await runImportJob("job-1")).toBe("done");
    expect(released()).toMatchObject({ status: "COMPLETED", lockToken: null });
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ storeId: "store-A" }));
  });

  it("tenant guard: refuses a job whose connection belongs to another store", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job({ connection: { storeId: "store-B" } } as never) as never);
    expect(await runImportJob("job-1")).toBe("paused");
    expect(createImportSource).not.toHaveBeenCalled();
    expect(released()).toMatchObject({ status: "PAUSED" });
  });

  it("temporary failure: schedules a retry with backoff", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job() as never);
    vi.mocked(createImportSource).mockReturnValue(source(async () => Promise.reject(new SourceApiError("network", "down"))));
    const before = Date.now();
    expect(await runImportJob("job-1")).toBe("retrying");
    const data = released();
    expect(data).toMatchObject({ status: "RUNNING", attempts: 1 });
    expect((data.nextRunAt as Date).getTime()).toBeGreaterThanOrEqual(before + retryDelayMs(1));
  });

  it("pauses after too many consecutive failures", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job({ attempts: MAX_ATTEMPTS - 1 }) as never);
    vi.mocked(createImportSource).mockReturnValue(source(async () => Promise.reject(new SourceApiError("server", "503"))));
    expect(await runImportJob("job-1")).toBe("paused");
    expect(released()).toMatchObject({ status: "PAUSED", lastError: expect.any(String) });
  });

  it("revoked token: pauses and asks the merchant to reconnect", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job() as never);
    vi.mocked(createImportSource).mockReturnValue(source(async () => Promise.reject(new SourceApiError("unauthorized", "401"))));
    expect(await runImportJob("job-1")).toBe("paused");
    expect(prisma.importConnection.update).toHaveBeenCalledWith({ where: { id: "conn-1" }, data: { status: "NEEDS_RECONNECT" } });
  });

  it("a worker whose lease expired can't overwrite newer progress", async () => {
    vi.mocked(prisma.importJob.findUnique).mockResolvedValue(job() as never);
    vi.mocked(createImportSource).mockReturnValue(source(async () => ({ items: [], nextCursor: "next" })));
    tx.importJob.updateMany.mockResolvedValue({ count: 0 }); // lockToken no longer matches
    expect(await runImportJob("job-1")).toBe("busy");
  });
});

describe("scheduling helpers", () => {
  it("backoff grows and is capped", () => {
    expect(retryDelayMs(1)).toBe(15_000);
    expect(retryDelayMs(2)).toBe(30_000);
    expect(retryDelayMs(20)).toBe(10 * 60 * 1000);
  });

  it("isRunnable respects status, schedule and lease", () => {
    const now = new Date();
    const base = { status: "RUNNING" as const, nextRunAt: new Date(now.getTime() - 1), lockedUntil: null };
    expect(isRunnable(base, now)).toBe(true);
    expect(isRunnable({ ...base, lockedUntil: new Date(now.getTime() + 1000) }, now)).toBe(false);
    expect(isRunnable({ ...base, nextRunAt: new Date(now.getTime() + 1000) }, now)).toBe(false);
    expect(isRunnable({ ...base, status: "PAUSED" }, now)).toBe(false);
  });
});
