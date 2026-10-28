import { describe, expect, it } from "vitest";

import {
  buildOrderPayload,
  isValidWebhookUrl,
  readCallbackOrderRef,
  readCallbackReason,
  readCallbackStatus,
  readConfirmItSettings,
  type ConfirmItOrder,
} from "./payload";

const order: ConfirmItOrder = {
  id: "0b8f6c1e-1d2a-4c3b-9e8f-a1b2c3d4e5f6",
  createdAt: new Date("2026-10-28T10:00:00Z"),
  fullName: "منى علي",
  phone: "01012345678",
  email: null,
  address: "12 شارع التحرير",
  governorate: "CAIRO",
  notes: null,
  paymentMethod: "cash_on_delivery",
  paymentLabel: "الدفع عند الاستلام",
  subtotal: 25_000,
  shipping: 5_050,
  discount: 0,
  total: 30_050,
  items: [{ quantity: 2, price: 12_500, product: { id: "p1", name: "تيشيرت", sku: "TS-1" } }],
};

describe("buildOrderPayload", () => {
  const payload = buildOrderPayload({
    event: "order.created",
    order,
    store: { id: "s1", name: "متجري", url: "https://mystore.casho.store" },
    callbackUrl: "https://app.casho.store/api/apps/confirm-it/callback/abc",
  });

  it("sends EGP amounts with exact piaster twins", () => {
    expect(payload.order.total).toBe(300.5);
    expect(payload.order.total_piasters).toBe(30_050);
    expect(payload.order.items[0]).toMatchObject({ price: 125, price_piasters: 12_500, quantity: 2, sku: "TS-1" });
  });

  it("carries the customer-facing number, COD flag and callback", () => {
    expect(payload.order.number).toBe("#D4E5F6");
    expect(payload.order.is_cod).toBe(true);
    expect(payload.callback_url).toContain("/callback/abc");
    expect(payload.order.customer.phone).toBe("01012345678");
  });
});

describe("readCallbackStatus", () => {
  it.each([
    ["confirmed", "confirm"],
    ["CONFIRMED", "confirm"],
    ["approved", "confirm"],
    ["cancelled", "cancel"],
    ["canceled", "cancel"],
    ["rejected", "cancel"],
    ["no_answer", "pending"],
    ["", "pending"],
    [undefined, "pending"],
  ])("%s → %s", (status, expected) => {
    expect(readCallbackStatus(status)).toBe(expected);
  });
});

describe("readCallbackOrderRef", () => {
  it("finds the id at the top level or nested", () => {
    expect(readCallbackOrderRef({ order_id: "abc" })).toBe("abc");
    expect(readCallbackOrderRef({ orderId: " #A1B2C3 " })).toBe("#A1B2C3");
    expect(readCallbackOrderRef({ order: { id: "nested" } })).toBe("nested");
    expect(readCallbackOrderRef({ status: "confirmed" })).toBeNull();
  });

  it("trims and caps the reason", () => {
    expect(readCallbackReason({ reason: "  غالي  " })).toBe("غالي");
    expect(readCallbackReason({ cancel_reason: "x".repeat(400) })).toHaveLength(300);
    expect(readCallbackReason({})).toBeNull();
  });
});

describe("settings", () => {
  it("defaults to COD-only", () => {
    expect(readConfirmItSettings(null)).toEqual({ webhookUrl: "", codOnly: true });
    expect(readConfirmItSettings({ webhookUrl: "https://x.io", codOnly: false })).toEqual({ webhookUrl: "https://x.io", codOnly: false });
  });

  it("accepts https webhooks only (http on localhost)", () => {
    expect(isValidWebhookUrl("https://api.confirmit-eg.com/hook")).toBe(true);
    expect(isValidWebhookUrl("http://localhost:4000/hook")).toBe(true);
    expect(isValidWebhookUrl("http://example.com/hook")).toBe(false);
    expect(isValidWebhookUrl("not a url")).toBe(false);
  });
});
