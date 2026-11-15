import { describe, expect, it } from "vitest";
import { createElement, isValidElement, type ReactElement } from "react";

import { interpolate } from "../catalog";
import { ensureStoreEnglish } from "./load-english";
import { formatPrice, st, stIn, stList, stRich, storeDir, storeNumberFormat } from "./runtime";

await ensureStoreEnglish();

/** The test runs in node with no window — the runtime takes the SSR path, so drive it through stIn / explicit locales. */
describe("storefront i18n", () => {
  it("translates Arabic source text with positional slots", () => {
    expect(stIn("en", "أضف للسلة")).toBe("Add to cart");
    expect(stIn("en", "مفيش منتجات باسم «{0}»", "شنطة")).toBe("No products named “شنطة”");
    expect(stIn("ar", "مفيش منتجات باسم «{0}»", "شنطة")).toBe("مفيش منتجات باسم «شنطة»");
  });

  it("picks the English word by count, also from formatted numbers", () => {
    expect(stIn("en", "{0} منتج", 1)).toBe("1 product");
    expect(stIn("en", "{0} منتج", 12)).toBe("12 products");
    expect(stIn("en", "{0} منتج", "1,250")).toBe("1,250 products");
    expect(interpolate("{0|item|items}", ["١"])).toBe("item");
  });

  it("matches text that was built before it reached the UI", () => {
    // lib/orders/tracking builds this on the server, in Arabic.
    expect(stIn("en", "طلبك مع Bosta. تقدر تتابع كل خطوة في الشحنة تحت.")).toBe("Your order is with Bosta. You can follow every step of the shipment below.");
  });

  it("falls back to Arabic for text it doesn't know (merchant content)", () => {
    expect(stIn("en", "تيشيرت قطن")).toBe("تيشيرت قطن");
  });

  it("defaults to Arabic outside a store render", () => {
    expect(st("أضف للسلة")).toBe("أضف للسلة");
    expect(storeDir()).toBe("rtl");
    expect(formatPrice(1250)).toBe(storeNumberFormat({ style: "currency", currency: "EGP", maximumFractionDigits: 0 }, "ar").format(1250));
    expect(stList(["الأحدث"])[0]).toBe("الأحدث");
  });

  it("keeps elements in their slots, in the language's word order", () => {
    const node = stRich("عرض {0} من {1} منتج", createElement("b", null, "1–20"), createElement("b", null, "45")) as ReactElement<{
      children: unknown[];
    }>;
    expect(isValidElement(node)).toBe(true);
    const parts = node.props.children;
    // No store render in tests → Arabic, with both elements kept in their slots.
    expect(parts[0]).toBe("عرض ");
    expect(parts.filter(isValidElement)).toHaveLength(2);
  });

  it("formats English store numbers with Western digits", () => {
    expect(storeNumberFormat(undefined, "en").format(1250)).toBe("1,250");
    expect(storeNumberFormat(undefined, "ar").format(1250)).not.toBe("1,250");
  });
});
