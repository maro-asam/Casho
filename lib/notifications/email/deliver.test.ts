import { beforeEach, describe, expect, it, vi } from "vitest";

const logs: { kind: string; refId: string | null; status: string; attempts: number; error: string | null; createdAt: Date }[] = [];
let failures: unknown[] = [];

vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn(async () => {
    const next = failures.shift();
    if (next) throw next;
  }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: {
      create: vi.fn(async ({ data }: { data: (typeof logs)[number] }) => logs.push({ ...data, createdAt: new Date() })),
      count: vi.fn(async ({ where }: { where: { kind: string; refId: string; status: string; createdAt: { gte: Date } } }) =>
        logs.filter((l) => l.kind === where.kind && l.refId === where.refId && l.status === where.status && l.createdAt >= where.createdAt.gte).length,
      ),
    },
  },
}));

const { deliver, sentWithin } = await import("./deliver");
const { buildLowStockEmail } = await import("./store-alerts");

const mail = { to: "owner@example.com", subject: "طلب جديد", html: "<p></p>", text: "" };
const meta = { kind: "ORDER_NEW" as const, storeId: "s1", refId: "o1" };

beforeEach(() => {
  logs.length = 0;
  failures = [];
  vi.useFakeTimers();
});

describe("deliver", () => {
  it("logs a first-try success", async () => {
    expect(await deliver(mail, meta)).toBe(true);
    expect(logs).toMatchObject([{ status: "SENT", attempts: 1, error: null }]);
  });

  it("retries a passing SMTP hiccup", async () => {
    failures = [new Error("ETIMEDOUT"), new Error("ECONNRESET")];
    const sending = deliver(mail, meta);
    await vi.runAllTimersAsync();
    expect(await sending).toBe(true);
    expect(logs).toMatchObject([{ status: "SENT", attempts: 3 }]);
  });

  it("gives up after three tries and records why", async () => {
    failures = [new Error("down"), new Error("down"), new Error("still down")];
    const sending = deliver(mail, meta);
    await vi.runAllTimersAsync();
    expect(await sending).toBe(false);
    expect(logs).toMatchObject([{ status: "FAILED", attempts: 3, error: "still down" }]);
  });

  it("doesn't retry a permanent refusal", async () => {
    failures = [Object.assign(new Error("550 no such user"), { responseCode: 550 })];
    expect(await deliver(mail, meta)).toBe(false);
    expect(logs).toMatchObject([{ status: "FAILED", attempts: 1 }]);
  });
});

describe("sentWithin", () => {
  it("only counts emails that actually went out", async () => {
    failures = [Object.assign(new Error("550"), { responseCode: 550 })];
    await deliver(mail, { kind: "LOW_STOCK", refId: "p1" });
    expect(await sentWithin("LOW_STOCK", "p1", 24)).toBe(false);
    await deliver(mail, { kind: "LOW_STOCK", refId: "p1" });
    expect(await sentWithin("LOW_STOCK", "p1", 24)).toBe(true);
    expect(await sentWithin("OUT_OF_STOCK", "p1", 24)).toBe(false);
  });
});

describe("low stock email", () => {
  const brand = { name: "متجر نور", logo: null, accent: "#0f766e", url: "https://noor.casho.store" };

  it("says how many are left, and where", () => {
    const m = buildLowStockEmail(brand, { id: "p1", name: "تيشيرت", stock: 3, branchName: "مدينة نصر" }, "https://x/edit");
    expect(m.subject).toContain("قرب يخلص");
    expect(m.text).toContain("في فرع مدينة نصر");
  });

  it("calls a sold-out product sold out", () => {
    expect(buildLowStockEmail(brand, { id: "p1", name: "تيشيرت", stock: 0 }, "https://x/edit").subject).toContain("خلص من المخزون");
  });
});
