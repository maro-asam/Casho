import { describe, expect, it } from "vitest";

import { acceptRate, offerMatches, offerUnitPrice, rankOffers, validOfferLineIds, type OfferRule } from "./offer-pricing";

const rule = (over: Partial<OfferRule> = {}): OfferRule => ({
  type: "CROSS_SELL",
  isActive: true,
  offerProductId: "belt",
  triggerProductIds: ["shirt"],
  discountType: "PERCENTAGE",
  discountValue: 10,
  ...over,
});

describe("offerUnitPrice", () => {
  it("applies percent and fixed discounts", () => {
    expect(offerUnitPrice(200, { discountType: "PERCENTAGE", discountValue: 15 })).toBe(170);
    expect(offerUnitPrice(200, { discountType: "FIXED", discountValue: 50 })).toBe(150);
    expect(offerUnitPrice(200, { discountType: "NONE", discountValue: 50 })).toBe(200);
  });

  it("never goes below zero and rounds to piasters", () => {
    expect(offerUnitPrice(40, { discountType: "FIXED", discountValue: 90 })).toBe(0);
    expect(offerUnitPrice(99.99, { discountType: "PERCENTAGE", discountValue: 33 })).toBe(66.99);
    expect(offerUnitPrice(100, { discountType: "PERCENTAGE", discountValue: 250 })).toBe(0);
  });
});

describe("offerMatches", () => {
  it("matches listed triggers or any product, never itself", () => {
    expect(offerMatches(rule(), "shirt")).toBe(true);
    expect(offerMatches(rule(), "pants")).toBe(false);
    expect(offerMatches(rule({ triggerProductIds: [] }), "pants")).toBe(true);
    expect(offerMatches(rule({ triggerProductIds: [] }), "belt")).toBe(false);
  });
});

describe("rankOffers", () => {
  it("orders by priority, then specific before any-product", () => {
    const ranked = rankOffers([
      { id: "any", priority: 0, triggerProductIds: [] },
      { id: "specific", priority: 0, triggerProductIds: ["shirt"] },
      { id: "top", priority: 5, triggerProductIds: [] },
    ]);
    expect(ranked.map((o) => o.id)).toEqual(["top", "specific", "any"]);
  });
});

describe("validOfferLineIds", () => {
  it("keeps a cross-sell only while its trigger is in the cart", () => {
    const withShirt = [
      { id: "1", productId: "shirt", offer: null },
      { id: "2", productId: "belt", offer: rule() },
    ];
    expect([...validOfferLineIds(withShirt)]).toEqual(["2"]);
    expect(validOfferLineIds([{ id: "2", productId: "belt", offer: rule() }]).size).toBe(0);
  });

  it("does not let two any-product cross-sells validate each other", () => {
    const lines = [
      { id: "1", productId: "belt", offer: rule({ triggerProductIds: [] }) },
      { id: "2", productId: "socks", offer: rule({ offerProductId: "socks", triggerProductIds: [] }) },
    ];
    expect(validOfferLineIds(lines).size).toBe(0);
  });

  it("counts an upgraded (upsell) line as a trigger", () => {
    const lines = [
      { id: "1", productId: "shirt-pro", offer: rule({ type: "UPSELL", offerProductId: "shirt-pro", triggerProductIds: ["shirt"] }) },
      { id: "2", productId: "belt", offer: rule({ triggerProductIds: ["shirt-pro"] }) },
    ];
    expect(validOfferLineIds(lines)).toEqual(new Set(["1", "2"]));
  });

  it("drops inactive offers and offers for another product", () => {
    const lines = [
      { id: "1", productId: "shirt", offer: null },
      { id: "2", productId: "belt", offer: rule({ isActive: false }) },
      { id: "3", productId: "hat", offer: rule() },
    ];
    expect(validOfferLineIds(lines).size).toBe(0);
  });
});

describe("acceptRate", () => {
  it("is a percent with one decimal", () => {
    expect(acceptRate(0, 0)).toBe(0);
    expect(acceptRate(3, 1)).toBe(33.3);
  });
});
