import { describe, expect, it } from "vitest";

import { STORE_CURRENCIES, STORE_CURRENCY_NAMES, supportsOnlinePayment, toStoreCurrency } from "./currency";

describe("store currency", () => {
  it("keeps known codes and falls back to EGP", () => {
    expect(toStoreCurrency("SDG")).toBe("SDG");
    expect(toStoreCurrency("sdg")).toBe("EGP");
    expect(toStoreCurrency(null)).toBe("EGP");
    expect(toStoreCurrency("XYZ")).toBe("EGP");
  });

  it("names every currency and only lets EGP pay online", () => {
    for (const code of STORE_CURRENCIES) expect(STORE_CURRENCY_NAMES[code].ar).toBeTruthy();
    expect(supportsOnlinePayment("EGP")).toBe(true);
    expect(supportsOnlinePayment(undefined)).toBe(true);
    expect(supportsOnlinePayment("SDG")).toBe(false);
  });

  it("is a currency Intl can write", () => {
    for (const code of STORE_CURRENCIES) {
      expect(() => new Intl.NumberFormat("ar-EG", { style: "currency", currency: code }).format(1)).not.toThrow();
    }
  });
});
