import { describe, expect, it } from "vitest";
import { CARRIERS, buildTrackingUrl, getCarrier, isValidTrackingTemplate } from "./carriers";
import { mergeCarrierEvents, orderStatusForShipment, type ShipmentEvent } from "./shipment-status";

describe("carrier registry", () => {
  it("has unique keys and at least 10 Egyptian-market carriers", () => {
    const keys = CARRIERS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(10);
  });

  it("API carriers declare their credentials; known tracking links are valid templates", () => {
    for (const c of CARRIERS) {
      if (c.integration === "api") expect(c.credentialFields?.length).toBeGreaterThan(0);
      if (c.trackingUrl) expect(isValidTrackingTemplate(c.trackingUrl)).toBe(true);
    }
  });

  it("resolves legacy lowercase keys", () => {
    expect(getCarrier("bosta")?.key).toBe("BOSTA");
    expect(getCarrier("nope")).toBeNull();
  });
});

describe("buildTrackingUrl", () => {
  const dhl = getCarrier("DHL");
  it("fills the carrier template and encodes the number", () => {
    expect(buildTrackingUrl(dhl, {}, "12 34")).toBe(
      "https://www.dhl.com/eg-en/home/tracking.html?tracking-id=12%2034&submit=1",
    );
  });
  it("prefers the store's template", () => {
    expect(buildTrackingUrl(dhl, { trackingUrlTemplate: "https://x.eg/t/{tracking}" }, "9")).toBe("https://x.eg/t/9");
  });
  it("returns null without a usable template or number", () => {
    expect(buildTrackingUrl(getCarrier("MYLERZ"), {}, "9")).toBeNull();
    expect(buildTrackingUrl(dhl, {}, null)).toBeNull();
    expect(buildTrackingUrl(dhl, { trackingUrlTemplate: "http://insecure/{tracking}" }, "9")).toContain("dhl.com");
  });
});

describe("shipment → order status", () => {
  it("maps the lifecycle", () => {
    expect(orderStatusForShipment("IN_TRANSIT")).toEqual({ status: "SHIPPED" });
    expect(orderStatusForShipment("DELIVERED")).toEqual({ status: "DELIVERED" });
    expect(orderStatusForShipment("RETURNED")).toEqual({ status: "CANCELED", returned: true });
    expect(orderStatusForShipment("CANCELED")).toBeNull();
    expect(orderStatusForShipment("FAILED_DELIVERY")).toBeNull();
  });

  it("carrier sync keeps merchant notes and sorts by time", () => {
    const merchant: ShipmentEvent = { at: "2026-10-02T10:00:00Z", status: "IN_TRANSIT", source: "merchant", note: "اتصلت بالعميل" };
    const oldCarrier: ShipmentEvent = { at: "2026-10-01T10:00:00Z", status: "CREATED", source: "carrier" };
    const fresh: ShipmentEvent[] = [
      { at: "2026-10-01T09:00:00Z", status: "CREATED", source: "carrier" },
      { at: "2026-10-03T09:00:00Z", status: "DELIVERED", source: "carrier" },
    ];
    const merged = mergeCarrierEvents([oldCarrier, merchant], fresh);
    expect(merged.map((e) => e.at)).toEqual([fresh[0].at, merchant.at, fresh[1].at]);
  });
});
