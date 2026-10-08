import { describe, it, expect, vi } from "vitest";
import { runSlice, RETRY_BATCH_SIZE, type ItemFailure, type ItemRef, type SliceDeps, type SliceState } from "./core";
import { initialProgress } from "./progress";
import {
  ImportItemFailure,
  type ApplyOutcome,
  type ImportSink,
  type ImportSource,
  type ImportableEntity,
  type NormalizedRecord,
} from "./types";

// ─── In-memory fakes ─────────────────────────────────────────────────────────

function record(entity: ImportableEntity, n: number): NormalizedRecord {
  const externalId = `gid://test/${entity}/${n}`;
  switch (entity) {
    case "COLLECTION":
      return { entity, externalId, label: `C${n}`, name: `C${n}`, handle: `c-${n}`, imageUrl: null };
    case "PRODUCT":
      return {
        entity, externalId, label: `P${n}`, name: `P${n}`, handle: `p-${n}`, description: null, brand: null, productType: null,
        tags: [], isActive: true, images: [], collectionExternalIds: [], options: [], variants: [], weight: null, createdAt: null,
      };
    case "CUSTOMER":
      return { entity, externalId, label: `U${n}`, name: `U${n}`, email: null, phone: n % 5 === 0 ? null : `0100000${n}`, address: null, note: null, tags: [], createdAt: null };
    case "ORDER":
      return {
        entity, externalId, label: `#${n}`, name: `#${n}`, createdAt: new Date(0), status: "PAID", paymentStatus: "PAID", paymentMethod: "x",
        currencyCode: "EGP", subtotal: 1, shipping: 0, discount: 0, total: 1, couponCode: null, note: null, fullName: null, phone: null,
        email: null, address: null, customerExternalId: null, lines: [],
      };
  }
}

function dataset(counts: Partial<Record<ImportableEntity, number>>) {
  const data: Partial<Record<ImportableEntity, NormalizedRecord[]>> = {};
  for (const [entity, n] of Object.entries(counts) as [ImportableEntity, number][]) {
    data[entity] = Array.from({ length: n }, (_, i) => record(entity, i + 1));
  }
  return data;
}

class MemorySource implements ImportSource {
  provider = "SHOPIFY" as const;
  externalShopId = "shop-1";
  fetchPage = vi.fn(async (entity: ImportableEntity, cursor: string | null) => {
    if (this.failOnFetch?.()) throw new Error("network down");
    const all = this.data[entity] ?? [];
    const start = cursor ? Number(cursor) : 0;
    const end = start + this.pageSize;
    return { items: all.slice(start, end), nextCursor: end < all.length ? String(end) : null };
  });
  constructor(
    public data: Partial<Record<ImportableEntity, NormalizedRecord[]>>,
    private pageSize = 3,
    public failOnFetch?: () => boolean,
  ) {}
  async count(entity: ImportableEntity) {
    return this.data[entity]?.length ?? 0;
  }
  async fetchByIds(entity: ImportableEntity, ids: string[]) {
    return (this.data[entity] ?? []).filter((r) => ids.includes(r.externalId));
  }
}

/**
 * Mirrors the Prisma sink's contract: a (entity, externalId) key is unique —
 * first apply creates, later applies update (orders: left unchanged).
 */
class MemorySink implements ImportSink {
  records = new Map<string, NormalizedRecord>();
  creates = 0;
  failIds = new Set<string>();
  async apply(r: NormalizedRecord): Promise<ApplyOutcome> {
    if (this.failIds.has(r.externalId)) throw new ImportItemFailure("صورة غير صالحة");
    if (r.entity === "CUSTOMER" && !r.phone) return { result: "skipped", reason: "NO_PHONE" };
    const key = `${r.entity}:${r.externalId}`;
    if (this.records.has(key)) {
      if (r.entity === "ORDER") return { result: "unchanged" };
      this.records.set(key, r);
      return { result: "updated" };
    }
    this.records.set(key, r);
    this.creates++;
    return { result: "imported" };
  }
  count(entity: ImportableEntity) {
    return [...this.records.keys()].filter((k) => k.startsWith(`${entity}:`)).length;
  }
}

function fullState(entities: ImportableEntity[]): SliceState {
  return { kind: "FULL", entities, currentEntity: null, cursor: null, progress: initialProgress(entities) };
}

function harness(source: ImportSource, sink: ImportSink, extra: Partial<SliceDeps> = {}) {
  const failures: ItemFailure[] = [];
  const resolved: ItemRef[] = [];
  let persisted: SliceState | null = null;
  const deps: SliceDeps = {
    source,
    sink,
    shouldStop: () => false,
    checkpoint: vi.fn(async (state, f, r) => {
      persisted = structuredClone(state);
      failures.push(...f);
      resolved.push(...r);
    }),
    ...extra,
  };
  return { deps, failures, resolved, persisted: () => persisted };
}

const ALL: ImportableEntity[] = ["COLLECTION", "PRODUCT", "CUSTOMER", "ORDER"];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("import engine", () => {
  it("imports products, customers and orders in dependency order", async () => {
    const source = new MemorySource(dataset({ COLLECTION: 2, PRODUCT: 7, CUSTOMER: 10, ORDER: 4 }));
    const sink = new MemorySink();
    const state = fullState(ALL);
    const { deps } = harness(source, sink);

    expect(await runSlice(state, deps)).toBe("done");

    const order = source.fetchPage.mock.calls.map((c) => c[0]);
    expect(order.indexOf("COLLECTION")).toBeLessThan(order.indexOf("PRODUCT"));
    expect(order.lastIndexOf("PRODUCT")).toBeLessThan(order.indexOf("CUSTOMER"));
    expect(order.lastIndexOf("CUSTOMER")).toBeLessThan(order.indexOf("ORDER"));

    expect(sink.count("PRODUCT")).toBe(7);
    expect(sink.count("ORDER")).toBe(4);
    expect(state.progress.PRODUCT).toMatchObject({ total: 7, processed: 7, imported: 7, done: true });
    expect(state.progress.CUSTOMER).toMatchObject({ imported: 8, skipped: 2, skipReasons: { NO_PHONE: 2 }, done: true });
    expect(state.progress.ORDER).toMatchObject({ imported: 4, failed: 0, done: true });
    expect(state.currentEntity).toBeNull();
  });

  it("pagination: walks every page and checkpoints after each one", async () => {
    const source = new MemorySource(dataset({ PRODUCT: 7 }), 3);
    const { deps } = harness(source, new MemorySink());
    await runSlice(fullState(["PRODUCT"]), deps);
    expect(source.fetchPage.mock.calls.map((c) => c[1])).toEqual([null, "3", "6"]);
    expect(deps.checkpoint).toHaveBeenCalledTimes(3);
  });

  it("partial failure: one bad record doesn't stop the import", async () => {
    const source = new MemorySource(dataset({ PRODUCT: 5, ORDER: 2 }));
    const sink = new MemorySink();
    sink.failIds.add("gid://test/PRODUCT/2");
    const state = fullState(["PRODUCT", "ORDER"]);
    const { deps, failures } = harness(source, sink);

    expect(await runSlice(state, deps)).toBe("done");
    expect(state.progress.PRODUCT).toMatchObject({ processed: 5, imported: 4, failed: 1 });
    expect(state.progress.ORDER).toMatchObject({ imported: 2 });
    expect(failures).toEqual([{ entity: "PRODUCT", externalId: "gid://test/PRODUCT/2", label: "P2", message: "صورة غير صالحة" }]);
  });

  it("failure reasons never echo raw database errors (they can contain customer data)", async () => {
    const source = new MemorySource(dataset({ CUSTOMER: 1 }));
    const sink: ImportSink = { apply: async () => Promise.reject(new Error('duplicate key (phone)=(01001234567)')) };
    const { deps, failures } = harness(source, sink);
    await runSlice(fullState(["CUSTOMER"]), deps);
    expect(failures[0].message).not.toContain("0100");
  });

  it("duplicate import: running again never duplicates records", async () => {
    const data = dataset({ COLLECTION: 2, PRODUCT: 6, CUSTOMER: 4, ORDER: 5 });
    const sink = new MemorySink();
    await runSlice(fullState(ALL), harness(new MemorySource(data), sink).deps);
    const createsAfterFirst = sink.creates;

    const second = fullState(ALL);
    await runSlice(second, harness(new MemorySource(data), sink).deps);

    expect(sink.creates).toBe(createsAfterFirst);
    expect(sink.count("PRODUCT")).toBe(6);
    expect(second.progress.PRODUCT).toMatchObject({ imported: 0, updated: 6 });
    expect(second.progress.ORDER).toMatchObject({ imported: 0, unchanged: 5 });
  });

  it("interrupted import: resumes from the last checkpoint without duplicates", async () => {
    const data = dataset({ PRODUCT: 9, ORDER: 3 });
    const sink = new MemorySink();
    let calls = 0;
    const flaky = new MemorySource(data, 3, () => ++calls === 3); // dies on the 3rd page
    const first = harness(flaky, sink);

    await expect(runSlice(fullState(["PRODUCT", "ORDER"]), first.deps)).rejects.toThrow("network down");
    const saved = first.persisted()!;
    expect(saved).toMatchObject({ currentEntity: "PRODUCT", cursor: "6" });
    expect(saved.progress.PRODUCT!.processed).toBe(6);

    // A later run (cron / page poll) continues from the persisted state.
    const resumed = new MemorySource(data, 3);
    expect(await runSlice(saved, harness(resumed, sink).deps)).toBe("done");
    expect(resumed.fetchPage.mock.calls[0]).toEqual(["PRODUCT", "6"]);
    expect(sink.count("PRODUCT")).toBe(9);
    expect(sink.creates).toBe(12);
    expect(saved.progress.PRODUCT).toMatchObject({ processed: 9, imported: 9, done: true });
  });

  it("stops at the time budget and continues in the next run", async () => {
    const data = dataset({ PRODUCT: 9 });
    const sink = new MemorySink();
    const state = fullState(["PRODUCT"]);
    expect(await runSlice(state, harness(new MemorySource(data), sink, { shouldStop: () => true }).deps)).toBe("more");
    expect(state.cursor).toBe("3");
    expect(await runSlice(state, harness(new MemorySource(data), sink).deps)).toBe("done");
    expect(sink.count("PRODUCT")).toBe(9);
  });

  it("retry: re-imports only the failed items and hands them over", async () => {
    const data = dataset({ PRODUCT: 5 });
    const sink = new MemorySink();
    const failedRows = [
      { rowId: "r1", externalId: "gid://test/PRODUCT/2", label: "P2" },
      { rowId: "r2", externalId: "gid://test/PRODUCT/gone", label: "Deleted" },
    ];
    const source = new MemorySource(data);
    const { deps, failures, resolved } = harness(source, sink, {
      nextRetryBatch: vi.fn(async (_e: ImportableEntity, after: string | null) => (after ? [] : failedRows)),
    });
    const state: SliceState = { kind: "RETRY", entities: ["PRODUCT"], currentEntity: null, cursor: null, progress: initialProgress(["PRODUCT"], { PRODUCT: 2 }) };

    expect(await runSlice(state, deps)).toBe("done");
    expect(source.fetchPage).not.toHaveBeenCalled();
    expect(sink.count("PRODUCT")).toBe(1);
    expect(state.progress.PRODUCT).toMatchObject({ imported: 1, failed: 1, done: true });
    expect(failures).toEqual([{ entity: "PRODUCT", externalId: "gid://test/PRODUCT/gone", label: "Deleted", message: "لم يعد موجوداً في المتجر الأصلي" }]);
    expect(resolved.map((r) => r.externalId)).toEqual(failedRows.map((r) => r.externalId));
    expect(failedRows.length).toBeLessThan(RETRY_BATCH_SIZE);
  });
});
