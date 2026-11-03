import { describe, expect, it } from "vitest";

import { activeCustomDomain, buildStoreUrl, displayHost, storePublicUrl } from "./BuildStoreURL";

describe("storePublicUrl", () => {
  const sub = (path = "") => buildStoreUrl("mystore", path);

  it("uses the Casho subdomain when there's no custom domain", () => {
    expect(storePublicUrl({ slug: "mystore" })).toBe(sub());
    expect(storePublicUrl({ slug: "mystore", customDomain: null, customDomainStatus: "PENDING" }, "/products")).toBe(sub("/products"));
  });

  it("switches to the custom domain only once it's ACTIVE", () => {
    expect(storePublicUrl({ slug: "mystore", customDomain: "shop.com", customDomainStatus: "PENDING" })).toBe(sub());
    expect(storePublicUrl({ slug: "mystore", customDomain: "shop.com", customDomainStatus: "FAILED" })).toBe(sub());
    expect(storePublicUrl({ slug: "mystore", customDomain: "shop.com", customDomainStatus: "ACTIVE" })).toBe("https://shop.com");
  });

  it("appends paths with or without a leading slash", () => {
    const store = { slug: "mystore", customDomain: "shop.com", customDomainStatus: "ACTIVE" };
    expect(storePublicUrl(store, "/products/x")).toBe("https://shop.com/products/x");
    expect(storePublicUrl(store, "products/x")).toBe("https://shop.com/products/x");
  });

  it("activeCustomDomain / displayHost", () => {
    expect(activeCustomDomain({ slug: "s", customDomain: "shop.com", customDomainStatus: "ACTIVE" })).toBe("shop.com");
    expect(activeCustomDomain({ slug: "s", customDomain: "shop.com", customDomainStatus: "PENDING" })).toBeNull();
    expect(displayHost("https://shop.com/")).toBe("shop.com");
  });
});
