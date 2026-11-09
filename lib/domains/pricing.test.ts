import { describe, expect, it } from "vitest";
import {
  candidateDomains,
  isEgyptianTld,
  nextExpiry,
  parseDomainQuery,
  renewalAction,
  sellPrice,
  shouldSendRenewalNotice,
  toOffer,
  SEARCH_TLDS,
} from "./pricing";

const DAY = 86_400_000;
const now = new Date("2026-11-08T12:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * DAY);

describe("sellPrice", () => {
  it("converts at the rate, adds the markup and rounds up to 5 EGP", () => {
    // 12.03 USD × 50 EGP × 1.2 = 721.8 EGP → 725 EGP
    expect(sellPrice(12.03, { usdRate: 5000, markupBps: 2000 })).toBe(72_500);
  });

  it("keeps an exact multiple of 5 EGP as is", () => {
    // 10 USD × 50 × 1.0 = 500 EGP
    expect(sellPrice(10, { usdRate: 5000, markupBps: 0 })).toBe(50_000);
  });

  it("never rounds a cheap promo down to zero", () => {
    expect(sellPrice(1.49, { usdRate: 5000, markupBps: 2000 })).toBe(9_000); // 89.4 → 90
    expect(sellPrice(0.01, { usdRate: 5000, markupBps: 0 })).toBe(500);
  });

  it("always returns whole piasters", () => {
    for (const usd of [0.99, 2.99, 13.5, 44, 38.39]) {
      expect(Number.isInteger(sellPrice(usd, { usdRate: 4987, markupBps: 1750 }))).toBe(true);
    }
  });
});

describe("parseDomainQuery", () => {
  it("takes a bare name", () => {
    expect(parseDomainQuery("mystore")).toEqual({ label: "mystore", tld: null });
  });

  it("strips protocol, www, path and spaces", () => {
    expect(parseDomainQuery("https://www.My Store.com/about")).toEqual({ label: "mystore", tld: "com" });
  });

  it("keeps multi-part TLDs", () => {
    expect(parseDomainQuery("brand.com.eg")).toEqual({ label: "brand", tld: "com.eg" });
  });

  it("cleans hyphens", () => {
    expect(parseDomainQuery("--casho--woman-")).toEqual({ label: "casho-woman", tld: null });
  });

  it("rejects Arabic-only and one-letter names", () => {
    expect(parseDomainQuery("متجري")).toBeNull();
    expect(parseDomainQuery("a")).toBeNull();
    expect(parseDomainQuery("")).toBeNull();
  });
});

describe("candidateDomains", () => {
  it("puts the typed TLD first without duplicating it", () => {
    const list = candidateDomains({ label: "shop1", tld: "store" });
    expect(list[0]).toBe("shop1.store");
    expect(list.filter((d) => d === "shop1.store")).toHaveLength(1);
    expect(list).toHaveLength(SEARCH_TLDS.length);
  });

  it("adds an unusual TLD on top of the usual list", () => {
    const list = candidateDomains({ label: "shop1", tld: "xyz" });
    expect(list[0]).toBe("shop1.xyz");
    expect(list).toHaveLength(SEARCH_TLDS.length + 1);
  });

  it("starts with .com when no TLD was typed", () => {
    expect(candidateDomains({ label: "shop1", tld: null })[0]).toBe("shop1.com");
  });
});

describe("isEgyptianTld", () => {
  it("spots .eg names", () => {
    expect(isEgyptianTld("eg")).toBe(true);
    expect(isEgyptianTld("com.eg")).toBe(true);
    expect(isEgyptianTld("com")).toBe(false);
    expect(isEgyptianTld(null)).toBe(false);
  });
});

describe("renewalAction", () => {
  it("does nothing far from expiry", () => {
    expect(renewalAction({ autoRenew: true, expiresAt: inDays(60) }, now)).toBe("none");
  });

  it("renews inside the 30-day window and through the grace week", () => {
    expect(renewalAction({ autoRenew: true, expiresAt: inDays(30) }, now)).toBe("renew");
    expect(renewalAction({ autoRenew: true, expiresAt: inDays(1) }, now)).toBe("renew");
    expect(renewalAction({ autoRenew: true, expiresAt: inDays(-6) }, now)).toBe("renew");
  });

  it("lets it go after the grace week", () => {
    expect(renewalAction({ autoRenew: true, expiresAt: inDays(-8) }, now)).toBe("expire");
  });

  it("with auto-renew off, expires right at the end date", () => {
    expect(renewalAction({ autoRenew: false, expiresAt: inDays(10) }, now)).toBe("none");
    expect(renewalAction({ autoRenew: false, expiresAt: inDays(-1) }, now)).toBe("expire");
  });

  it("ignores a registration without an end date", () => {
    expect(renewalAction({ autoRenew: true, expiresAt: null }, now)).toBe("none");
  });
});

describe("shouldSendRenewalNotice", () => {
  it("sends the first one right away", () => {
    expect(shouldSendRenewalNotice(inDays(20), null, now)).toBe(true);
  });

  it("waits 5 days between reminders, then daily in the last 3 days", () => {
    expect(shouldSendRenewalNotice(inDays(20), inDays(-4), now)).toBe(false);
    expect(shouldSendRenewalNotice(inDays(20), inDays(-5), now)).toBe(true);
    expect(shouldSendRenewalNotice(inDays(2), inDays(-1), now)).toBe(true);
    expect(shouldSendRenewalNotice(inDays(2), new Date(now.getTime() - DAY / 2), now)).toBe(false);
  });
});

describe("nextExpiry", () => {
  it("adds a year to a future end date", () => {
    expect(nextExpiry(new Date("2026-12-01T00:00:00Z"), now).toISOString()).toBe("2027-12-01T00:00:00.000Z");
  });

  it("counts from now when it already lapsed", () => {
    expect(nextExpiry(new Date("2026-11-01T00:00:00Z"), now).toISOString()).toBe("2027-11-08T12:00:00.000Z");
  });
});

describe("toOffer", () => {
  const pricing = { usdRate: 5000, markupBps: 2000 };

  it("prices an available name in piasters, first year and renewal", () => {
    expect(toOffer({ domain: "a1.store", available: true, years: 1, price: 1.49, renewalPrice: 44, premium: false }, pricing)).toEqual({
      domain: "a1.store",
      available: true,
      price: 9_000,
      renewalPrice: 264_000,
    });
  });

  it("marks taken names", () => {
    expect(toOffer({ domain: "google.com", available: false }, pricing)).toEqual({ domain: "google.com", available: false, reason: "taken" });
  });

  it("doesn't sell premium or too-expensive names", () => {
    expect(toOffer({ domain: "x.com", available: true, years: 1, price: 12, renewalPrice: 12, premium: true }, pricing)).toMatchObject({ available: false, reason: "premium" });
    expect(toOffer({ domain: "x.ai", available: true, years: 1, price: 160, renewalPrice: 160, premium: false }, pricing)).toMatchObject({ available: false, reason: "unsupported" });
  });

  it("only sells names registered by the year", () => {
    expect(toOffer({ domain: "x.ai", available: true, years: 2, price: 30, renewalPrice: 30, premium: false }, pricing)).toMatchObject({ available: false, reason: "unsupported" });
  });
});
