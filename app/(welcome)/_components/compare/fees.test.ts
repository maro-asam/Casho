import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_STEP, MONTHLY_SALES_STEPS, SHOPIFY_THIRD_PARTY_FEES, formatRate, shopifyFee } from "./fees";

describe("Shopify third-party fee", () => {
  it("matches Shopify's published rates", () => {
    expect(SHOPIFY_THIRD_PARTY_FEES.map((p) => formatRate(p.bp))).toEqual(["2%", "1%", "0.6%"]);
  });

  it("is a whole number of pounds without float noise", () => {
    expect(shopifyFee(100_000, 200)).toBe(2_000);
    expect(shopifyFee(100_000, 60)).toBe(600);
    expect(shopifyFee(75_000, 60)).toBe(450);
    expect(shopifyFee(10_000, 60)).toBe(60);
  });

  it("starts the calculator at 100k a month", () => {
    expect(MONTHLY_SALES_STEPS[DEFAULT_SALES_STEP]).toBe(100_000);
  });
});
