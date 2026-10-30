import { beforeEach, describe, expect, it, vi } from "vitest";

const markers = new Set<string>();
const stored: string[] = [];
let failNextUpsert = false;
let signatureOk = true;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    igProcessedWebhookEvent: {
      create: vi.fn(async ({ data }: { data: { eventKey: string } }) => {
        if (markers.has(data.eventKey)) throw Object.assign(new Error("Unique constraint"), { code: "P2002" });
        markers.add(data.eventKey);
      }),
      deleteMany: vi.fn(async ({ where }: { where: { eventKey: string } }) => {
        markers.delete(where.eventKey);
        return { count: 1 };
      }),
    },
  },
}));
vi.mock("@/lib/instagram/sync", () => ({
  upsertWebhookMessage: vi.fn(async (event: { messageId: string }) => {
    if (failNextUpsert) {
      failNextUpsert = false;
      throw new Error("db down");
    }
    stored.push(event.messageId);
  }),
}));
vi.mock("@/lib/instagram/webhook", () => ({
  verifyWebhookSignature: vi.fn(() => signatureOk),
  parseWebhookPayload: vi.fn((raw: string) => JSON.parse(raw)),
  extractMessageEvents: vi.fn((payload: { ids: string[] }) =>
    payload.ids.map((id) => ({
      merchantIgId: "m",
      customerIgId: "c",
      messageId: id,
      text: "hi",
      attachmentUrl: null,
      messageType: "text",
      timestamp: new Date(),
    })),
  ),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock("@/lib/feature-flags", () => ({ featureFlags: { instagramAiOrders: () => true } }));

const { POST } = await import("./route");

function post(ids: string[]) {
  return POST(
    new Request("https://casho.store/api/instagram/webhook", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=x" },
      body: JSON.stringify({ ids }),
    }) as never,
  );
}

beforeEach(() => {
  markers.clear();
  stored.length = 0;
  failNextUpsert = false;
  signatureOk = true;
});

describe("POST /api/instagram/webhook", () => {
  it("stores new events before answering 200", async () => {
    const res = await post(["m1", "m2"]);
    expect(res.status).toBe(200);
    expect(stored).toEqual(["m1", "m2"]);
  });

  it("skips an event Meta delivers twice", async () => {
    await post(["m1"]);
    const res = await post(["m1"]);
    expect(res.status).toBe(200);
    expect(stored).toEqual(["m1"]);
  });

  it("answers 500 and releases the event when storing fails, so the redelivery is processed", async () => {
    failNextUpsert = true;
    const first = await post(["m1", "m2"]);
    expect(first.status).toBe(500);
    expect(stored).toEqual(["m2"]);
    expect(markers.has("m1")).toBe(false);

    const retry = await post(["m1", "m2"]);
    expect(retry.status).toBe(200);
    expect(stored).toEqual(["m2", "m1"]);
  });

  it("still rejects a bad signature", async () => {
    signatureOk = false;
    const res = await post(["m1"]);
    expect(res.status).toBe(403);
    expect(stored).toEqual([]);
  });
});
