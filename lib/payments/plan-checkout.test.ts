import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymobTransaction } from "@/lib/paymob";

type Row = { id: string; event: string; metadata: Record<string, unknown> };
let row: Row | null;
const telegram: string[] = [];
let hmacOk = true;

vi.mock("@/lib/notifications/telegram", () => ({
  sendTelegramMessage: vi.fn(async (text: string) => {
    telegram.push(text);
  }),
}));
vi.mock("@/lib/paymob", () => ({
  getPlatformPaymobCredentials: () => ({ secretKey: "s", publicKey: "p", hmacSecret: "h", integrationIds: [1] }),
  verifyPaymobHmac: () => hmacOk,
}));
// A one-row securityLog with the conditional update the claim relies on.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    securityLog: {
      findFirst: vi.fn(async () => (row ? { ...row } : null)),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; event: string }; data: Partial<Row> }) => {
        if (!row || row.id !== where.id || row.event !== where.event) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      }),
    },
  },
}));

const { settlePlanCheckout, marketingBaseUrl } = await import("./plan-checkout");

const tx = (over: Partial<PaymobTransaction> = {}): PaymobTransaction => ({
  id: "tx-1",
  merchantOrderId: "plan_abc",
  amountCents: 49900,
  currency: "EGP",
  success: true,
  pending: false,
  sourceType: "card",
  hmacFields: [],
  ...over,
});

describe("settlePlanCheckout", () => {
  beforeEach(() => {
    hmacOk = true;
    telegram.length = 0;
    row = {
      id: "r1",
      event: "PLAN_CHECKOUT_STARTED",
      metadata: { reference: "plan_abc", planKey: "GOLD", planName: "جولد", cycle: "MONTHLY", amount: 49900, name: "Ali", phone: "01012345678", email: "a@b.co" },
    };
  });

  it("marks a paid checkout and tells the admin once, however many callbacks arrive", async () => {
    expect(await settlePlanCheckout(tx(), "sig")).toEqual({ outcome: "success", planKey: "GOLD" });
    expect(await settlePlanCheckout(tx(), "sig")).toEqual({ outcome: "success", planKey: "GOLD" });
    expect(row!.event).toBe("PLAN_CHECKOUT_PAID");
    expect(row!.metadata).toMatchObject({ transactionId: "tx-1", sourceType: "card" });
    expect(telegram).toHaveLength(1);
    expect(telegram[0]).toContain("01012345678");
  });

  it("rejects a bad HMAC, a foreign reference and a wrong amount", async () => {
    hmacOk = false;
    expect((await settlePlanCheckout(tx(), "sig")).outcome).toBe("invalid");
    hmacOk = true;
    expect((await settlePlanCheckout(tx({ merchantOrderId: "topup-123" }), "sig")).outcome).toBe("invalid");
    expect((await settlePlanCheckout(tx({ amountCents: 100 }), "sig")).outcome).toBe("invalid");
    expect((await settlePlanCheckout(tx({ currency: "USD" }), "sig")).outcome).toBe("invalid");
    row = null;
    expect((await settlePlanCheckout(tx(), "sig")).outcome).toBe("invalid");
    expect(telegram).toHaveLength(0);
  });

  it("leaves failed and pending payments open", async () => {
    expect((await settlePlanCheckout(tx({ success: false }), "sig")).outcome).toBe("failed");
    expect((await settlePlanCheckout(tx({ success: false, pending: true }), "sig")).outcome).toBe("pending");
    expect(row!.event).toBe("PLAN_CHECKOUT_STARTED");
    expect(telegram).toHaveLength(0);
  });
});

describe("marketingBaseUrl", () => {
  it("sends payers back to the root domain, not the dashboard host", () => {
    vi.stubEnv("ROOT_DOMAIN", "casho.store");
    vi.stubEnv("APP_URL", "https://app.casho.store");
    expect(marketingBaseUrl()).toBe("https://casho.store");
    vi.stubEnv("ROOT_DOMAIN", "localhost");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(marketingBaseUrl()).toBe("http://localhost:3000");
    vi.unstubAllEnvs();
  });
});
