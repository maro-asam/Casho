import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
  id: string;
  status: "PENDING" | "FAILED" | "SUCCESS" | "DEAD_LETTER";
  nextRetryAt: Date | null;
  attempts: number;
  maxAttempts: number;
  event: string;
  payload: unknown;
  endpoint: { url: string; secret: string; status: "ACTIVE" | "DISABLED" };
};

const rows: Row[] = [];

const isDue = (r: Row, where: { status: { in: string[] }; nextRetryAt: { lte: Date } }) =>
  where.status.in.includes(r.status) && r.nextRetryAt !== null && r.nextRetryAt <= where.nextRetryAt.lte;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhookDelivery: {
      findMany: vi.fn(async ({ where }: { where: { status: { in: string[] }; nextRetryAt: { lte: Date } } }) =>
        rows.filter((r) => isDue(r, where)).map((r) => ({ id: r.id })),
      ),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; status: { in: string[] }; nextRetryAt: { lte: Date } }; data: Partial<Row> }) => {
        const row = rows.find((r) => r.id === where.id && isDue(r, where));
        if (row) Object.assign(row, data);
        return { count: row ? 1 : 0 };
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      }),
    },
  },
}));

const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
vi.stubGlobal("fetch", fetchMock);

const { claimDelivery, processRetryQueue, CLAIM_LEASE_MS } = await import("./engine");

function delivery(id: string, overrides: Partial<Row> = {}): Row {
  return {
    id,
    status: "PENDING",
    nextRetryAt: new Date(Date.now() - 1_000),
    attempts: 0,
    maxAttempts: 5,
    event: "order.created",
    payload: { id },
    endpoint: { url: "https://merchant.example/hook", secret: "s", status: "ACTIVE" },
    ...overrides,
  };
}

beforeEach(() => {
  rows.length = 0;
  fetchMock.mockClear();
});

describe("claimDelivery", () => {
  it("claims a due delivery once and hides it for the lease", async () => {
    rows.push(delivery("d1"));
    const now = new Date();
    expect(await claimDelivery("d1", now)).toBe(true);
    expect(rows[0].nextRetryAt!.getTime()).toBe(now.getTime() + CLAIM_LEASE_MS);
    expect(await claimDelivery("d1", now)).toBe(false);
  });

  it("does not claim a delivery that isn't due or is finished", async () => {
    rows.push(delivery("future", { nextRetryAt: new Date(Date.now() + 60_000) }), delivery("done", { status: "SUCCESS" }));
    expect(await claimDelivery("future")).toBe(false);
    expect(await claimDelivery("done")).toBe(false);
  });

  it("lets a delivery be claimed again once a dead run's lease has expired", async () => {
    rows.push(delivery("d1"));
    const start = new Date();
    expect(await claimDelivery("d1", start)).toBe(true);
    expect(await claimDelivery("d1", new Date(start.getTime() + CLAIM_LEASE_MS + 1))).toBe(true);
  });
});

describe("processRetryQueue", () => {
  it("sends each delivery once even when two runs overlap", async () => {
    rows.push(delivery("d1"), delivery("d2"));
    const [a, b] = await Promise.all([processRetryQueue(), processRetryQueue()]);
    expect(a + b).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rows.map((r) => r.status)).toEqual(["SUCCESS", "SUCCESS"]);
  });

  it("schedules a retry after a failed send, as before", async () => {
    rows.push(delivery("d1"));
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    await processRetryQueue();
    expect(rows[0]).toMatchObject({ status: "FAILED", attempts: 1 });
    expect(rows[0].nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
  });
});
