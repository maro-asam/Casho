import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { DIGITAL_ADDRESS } from "@/lib/products/digital";
import {
  buildTrackedOrder,
  orderNumber,
  orderTrackPath,
  parseOrderCode,
  verifyOrderTrackToken,
  type TrackableOrder,
} from "./tracking";

const ID = "0f6c5a1e-aaaa-bbbb-cccc-1234567890ab";

function makeOrder(overrides: Partial<TrackableOrder> = {}): TrackableOrder {
  return {
    id: ID,
    status: "PENDING",
    confirmationStatus: "NOT_REQUIRED",
    paymentMethod: "cash_on_delivery",
    address: "القاهرة — 12 شارع التحرير",
    total: 45000,
    createdAt: new Date("2026-10-20T10:00:00Z"),
    paidAt: null,
    returnedAt: null,
    trackingNumber: null,
    shippingProvider: null,
    items: [{ quantity: 2, selectedFeatures: { size: "L" }, product: { name: "تيشيرت", image: "/a.png" } }],
    shipments: [],
    ...overrides,
  };
}

const shipment = (overrides: Partial<TrackableOrder["shipments"][number]> = {}): TrackableOrder["shipments"][number] => ({
  createdAt: new Date("2026-10-21T09:00:00Z"),
  courierName: "بوسطة",
  trackingNumber: "BOS-123",
  trackingUrl: "https://bosta.co/track/BOS-123",
  status: "IN_TRANSIT",
  codAmount: 45000,
  estimatedDelivery: null,
  deliveredAt: null,
  events: [],
  ...overrides,
});

describe("order numbers", () => {
  it("shows the last 6 characters, upper-cased", () => {
    expect(orderNumber(ID)).toBe("#7890AB");
  });

  it("reads what customers type", () => {
    expect(parseOrderCode("#7890ab")).toEqual({ kind: "suffix", value: "7890ab" });
    expect(parseOrderCode(" 7890AB ")).toEqual({ kind: "suffix", value: "7890ab" });
    expect(parseOrderCode("٧٨٩٠AB")).toEqual({ kind: "suffix", value: "7890ab" });
    expect(parseOrderCode("0F6C5A1E")).toEqual({ kind: "prefix", value: "0f6c5a1e" });
    expect(parseOrderCode(ID.toUpperCase())).toEqual({ kind: "id", value: ID });
  });

  it("refuses anything that can't be an order number", () => {
    expect(parseOrderCode("")).toBeNull();
    expect(parseOrderCode("12345")).toBeNull();
    expect(parseOrderCode("ZZZZZZ")).toBeNull();
    expect(parseOrderCode("7890ab' OR 1=1")).toBeNull();
  });
});

describe("signed tracking links", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs per order and rejects other orders or tampered tokens", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "test-secret");
    const token = new URLSearchParams(orderTrackPath(ID).split("?")[1]).get("t");
    expect(verifyOrderTrackToken(ID, token)).toBe(true);
    expect(verifyOrderTrackToken("11111111-aaaa-bbbb-cccc-1234567890ab", token)).toBe(false);
    expect(verifyOrderTrackToken(ID, `${token}x`)).toBe(false);
    expect(verifyOrderTrackToken(ID, null)).toBe(false);
  });

  it("falls back to a pre-filled search without a secret", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "");
    vi.stubEnv("CRON_SECRET", "");
    expect(orderTrackPath(ID)).toBe("/track?order=7890AB");
    expect(verifyOrderTrackToken(ID, "anything")).toBe(false);
  });
});

describe("buildTrackedOrder", () => {
  const labels = (o: TrackableOrder) => buildTrackedOrder(o).steps.map((s) => s.label);
  const current = (o: TrackableOrder) => buildTrackedOrder(o).steps.find((s) => s.current)?.label;

  it("follows the cash-on-delivery flow (no paid step)", () => {
    expect(labels(makeOrder())).toEqual(["استلمنا طلبك", "اتشحن", "اتسلّم"]);
    expect(current(makeOrder())).toBe("استلمنا طلبك");
    expect(buildTrackedOrder(makeOrder()).headline).toBe("طلبك وصل للمتجر");
  });

  it("adds the paid step for prepaid orders and dates it", () => {
    const order = makeOrder({ paymentMethod: "paymob", status: "PAID", paidAt: new Date("2026-10-20T10:05:00Z") });
    const tracked = buildTrackedOrder(order);
    expect(tracked.steps.map((s) => s.label)).toEqual(["استلمنا طلبك", "اتدفع", "اتشحن", "اتسلّم"]);
    expect(tracked.steps[1]).toMatchObject({ done: true, current: true, at: "2026-10-20T10:05:00.000Z" });
    expect(tracked.headline).toBe("بنجهّز طلبك");
  });

  it("shows the shipment with its tracking number, carrier link and cash due", () => {
    const tracked = buildTrackedOrder(makeOrder({ status: "SHIPPED", shipments: [shipment()] }));
    expect(tracked.steps.find((s) => s.current)?.label).toBe("اتشحن");
    expect(tracked.shipment).toMatchObject({
      courier: "بوسطة",
      trackingNumber: "BOS-123",
      trackingUrl: "https://bosta.co/track/BOS-123",
      statusLabel: "طلبك في الطريق",
      codDue: 45000,
    });
    expect(tracked.shipment?.progress.find((p) => p.current)?.label).toBe("في الطريق");
  });

  it("keeps the merchant's shipment notes private and lists scans newest first", () => {
    const events = [
      { at: "2026-10-21T09:00:00Z", status: "PICKED_UP", source: "carrier", note: "Picked up from merchant", location: "Cairo Hub" },
      { at: "2026-10-21T12:00:00Z", status: "IN_TRANSIT", source: "merchant", note: "العميل مزعج اتصل قبلها" },
    ];
    const tracked = buildTrackedOrder(makeOrder({ status: "SHIPPED", shipments: [shipment({ events })] }));
    expect(tracked.shipment?.events).toEqual([
      { at: "2026-10-21T12:00:00Z", label: "طلبك في الطريق", location: null },
      { at: "2026-10-21T09:00:00Z", label: "Picked up from merchant", location: "Cairo Hub" },
    ]);
    // The shipped step is dated by the first scan.
    expect(tracked.steps.find((s) => s.label === "اتشحن")?.at).toBe("2026-10-21T09:00:00Z");
  });

  it("shows a tracking number typed on the order before shipments existed", () => {
    const tracked = buildTrackedOrder(makeOrder({ status: "SHIPPED", trackingNumber: "ARX-9", shippingProvider: "Aramex" }));
    expect(tracked.shipment).toMatchObject({ courier: "Aramex", trackingNumber: "ARX-9", trackingUrl: null });
  });

  it("calls a paid cash-on-delivery order confirmed, not paid", () => {
    const tracked = buildTrackedOrder(makeOrder({ status: "PAID" }));
    expect(tracked.steps.map((s) => s.label)).toEqual(["استلمنا طلبك", "اتأكد", "اتشحن", "اتسلّم"]);
    expect(tracked.detail).not.toContain("الدفع");
  });

  it("ends the timeline on a cancellation or a return", () => {
    const canceled = buildTrackedOrder(makeOrder({ status: "CANCELED" }));
    expect(canceled.tone).toBe("ended");
    expect(canceled.steps.map((s) => s.label)).toEqual(["استلمنا طلبك", "اتلغى"]);

    const returned = buildTrackedOrder(
      makeOrder({ status: "CANCELED", returnedAt: new Date("2026-10-25T10:00:00Z"), shipments: [shipment({ status: "RETURNED" })] }),
    );
    expect(returned.headline).toBe("الشحنة رجعت للمتجر");
    expect(returned.steps.map((s) => s.label)).toEqual(["استلمنا طلبك", "اتشحن", "رجع للمتجر"]);
    expect(returned.steps.at(-1)).toMatchObject({ ended: true, current: true });
  });

  it("asks the shopper to act when their code or transfer is pending", () => {
    expect(buildTrackedOrder(makeOrder({ confirmationStatus: "PENDING" })).headline).toBe("طلبك مستني تأكيدك");
    expect(buildTrackedOrder(makeOrder({ paymentMethod: "instapay" })).tone).toBe("attention");
  });

  it("has no shipping steps for digital orders", () => {
    const tracked = buildTrackedOrder(makeOrder({ address: DIGITAL_ADDRESS, paymentMethod: "paymob", status: "PAID", paidAt: new Date() }));
    expect(tracked.steps.map((s) => s.label)).toEqual(["استلمنا طلبك", "اتدفع"]);
    expect(tracked.shipment).toBeNull();
    expect(tracked.tone).toBe("done");
  });

  it("exposes items and totals but never the address", () => {
    const tracked = buildTrackedOrder(makeOrder());
    expect(tracked.items).toEqual([{ name: "تيشيرت", detail: "المقاس: L", quantity: 2, image: "/a.png" }]);
    expect(JSON.stringify(tracked)).not.toContain("التحرير");
  });
});
