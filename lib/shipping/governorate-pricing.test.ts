import { describe, expect, it } from "vitest";
import { shippingPriceFor } from "./governorate-pricing";

const method = {
  price: 5000,
  governorateRates: [
    { governorate: "aswan", price: 9000 },
    { governorate: "cairo", price: 0 },
  ],
};

describe("shippingPriceFor", () => {
  it("uses the governorate override when one exists", () => {
    expect(shippingPriceFor(method, "aswan")).toBe(9000);
  });

  it("keeps a free (0) override", () => {
    expect(shippingPriceFor(method, "cairo")).toBe(0);
  });

  it("falls back to the method's default price", () => {
    expect(shippingPriceFor(method, "giza")).toBe(5000);
    expect(shippingPriceFor(method, null)).toBe(5000);
    expect(shippingPriceFor({ price: 3000 }, "aswan")).toBe(3000);
  });
});
