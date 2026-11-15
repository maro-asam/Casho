import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = { notification: { findFirst: vi.fn() } };
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/notifications/in-app", () => ({ createNotification: vi.fn(async () => ({ id: "n1" })), formatPiastersAsEgp: (n: number) => String(n) }));
vi.mock("@/lib/mail", () => ({ isMailConfigured: vi.fn(() => true) }));
vi.mock("@/lib/notifications/email/deliver", () => ({ deliver: vi.fn(async () => true), inBackground: (task: () => Promise<void>) => void task() }));

const { commissionNotice, sendRepNotice, signupNotice, storeClosedNotice, trialEndingNotice } = await import("./notify");
const { createNotification } = await import("@/lib/notifications/in-app");
const { deliver } = await import("@/lib/notifications/email/deliver");

const customer = { id: "c1", name: "منى علي", phone: "01012345678", storeName: "بيت الأزياء" };
const rep = { userId: "repUser", email: "rep@example.com", name: "أحمد سمير" };

beforeEach(() => vi.clearAllMocks());

describe("notice copy", () => {
  it("each moment has its own stable key", () => {
    const end = new Date("2026-11-16T10:00:00Z");
    expect(signupNotice(customer).key).toBe("signup:c1");
    expect(trialEndingNotice(customer, "s1", end, new Date("2026-11-15T22:00:00Z")).key).toBe("trial_ending:s1:2026-11-16T10:00:00.000Z");
    expect(storeClosedNotice(customer, "s1", end).key).toBe("store_closed:s1:2026-11-16T10:00:00.000Z");
  });

  it("acquisitions and bonuses email; monthly renewals stay in-app", () => {
    const base = { id: "k1", amount: 5_083, basisAmount: 29_900, rateBps: 1_700 };
    expect(commissionNotice(customer, { ...base, kind: "ACQUISITION" }).email).toBeDefined();
    expect(commissionNotice(customer, { ...base, kind: "BONUS" }).email).toBeDefined();
    expect(commissionNotice(customer, { ...base, kind: "RENEWAL" }).email).toBeUndefined();
  });

  it("links to the rep's own pages", () => {
    expect(signupNotice(customer).href).toBe("/sales/customers/c1");
    expect(commissionNotice(customer, { id: "k1", kind: "RENEWAL", amount: 1, basisAmount: 1, rateBps: 600 }).href).toBe("/sales/commissions");
  });
});

describe("sendRepNotice", () => {
  it("notifies in-app with the key and emails the rep", async () => {
    prismaMock.notification.findFirst.mockResolvedValue(null);
    await expect(sendRepNotice(rep, signupNotice(customer))).resolves.toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "repUser", type: "SYSTEM", href: "/sales/customers/c1", data: { kind: "sales", salesKey: "signup:c1" } }),
    );
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ to: "rep@example.com" }), expect.objectContaining({ kind: "SALES_ALERT", refId: "signup:c1" }));
  });

  it("a key that already went out is a no-op", async () => {
    prismaMock.notification.findFirst.mockResolvedValue({ id: "old" });
    await expect(sendRepNotice(rep, signupNotice(customer))).resolves.toBe(false);
    expect(createNotification).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

  it("an in-app-only notice sends no email", async () => {
    prismaMock.notification.findFirst.mockResolvedValue(null);
    await sendRepNotice(rep, commissionNotice(customer, { id: "k1", kind: "RENEWAL", amount: 1_794, basisAmount: 29_900, rateBps: 600 }));
    expect(createNotification).toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });
});
