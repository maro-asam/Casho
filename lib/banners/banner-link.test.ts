import { describe, expect, it } from "vitest";

import { bannerStatus, cleanBannerLink, resolveBannerLink, type BannerLinkSource } from "./banner-link";

const src = (over: Partial<BannerLinkSource>): BannerLinkSource => ({
  linkType: "PRODUCTS",
  linkValue: null,
  openInNewTab: false,
  linkCategory: null,
  linkProduct: null,
  ...over,
});

describe("resolveBannerLink", () => {
  it("NONE is not clickable", () => {
    expect(resolveBannerLink(src({ linkType: "NONE" }))).toBeNull();
  });

  it("links a category and a product by slug", () => {
    expect(resolveBannerLink(src({ linkType: "CATEGORY", linkCategory: { slug: "summer" } }))?.href).toBe("/categories/summer");
    expect(
      resolveBannerLink(src({ linkType: "PRODUCT", linkProduct: { slug: "red-dress", isActive: true } }))?.href,
    ).toBe("/products/red-dress");
  });

  it("falls back to all products when the target is gone or hidden", () => {
    expect(resolveBannerLink(src({ linkType: "CATEGORY" }))?.href).toBe("/products");
    expect(resolveBannerLink(src({ linkType: "PRODUCT", linkProduct: { slug: "x", isActive: false } }))?.href).toBe("/products");
    expect(resolveBannerLink(src({ linkType: "WHATSAPP", linkValue: "hi" }), { whatsapp: null })?.href).toBe("/products");
  });

  it("encodes search keywords", () => {
    expect(resolveBannerLink(src({ linkType: "SEARCH", linkValue: "فستان صيفي" }))?.href).toBe(
      `/products?search=${encodeURIComponent("فستان صيفي")}`,
    );
  });

  it("builds a wa.me link with the prefilled message", () => {
    const link = resolveBannerLink(src({ linkType: "WHATSAPP", linkValue: "عايز العرض" }), { whatsapp: "01012345678" });
    expect(link).toEqual({ href: `https://wa.me/201012345678?text=${encodeURIComponent("عايز العرض")}`, external: true, newTab: true });
  });

  it("keeps store-relative custom URLs internal and rejects protocol-relative ones", () => {
    expect(resolveBannerLink(src({ linkType: "URL", linkValue: "/products?sort=price-asc" }))).toMatchObject({ external: false });
    expect(resolveBannerLink(src({ linkType: "URL", linkValue: "https://x.com/a", openInNewTab: true }))).toEqual({
      href: "https://x.com/a",
      external: true,
      newTab: true,
    });
    expect(resolveBannerLink(src({ linkType: "URL", linkValue: "//evil.com" }))?.href).toBe("/products");
    expect(resolveBannerLink(src({ linkType: "URL", linkValue: "javascript:alert(1)" }))?.href).toBe("/products");
  });
});

describe("cleanBannerLink", () => {
  it("keeps only the field the type uses", () => {
    expect(cleanBannerLink({ linkType: "CATEGORY", linkCategoryId: "c1", linkProductId: "p1", linkValue: "x" })).toEqual({
      linkType: "CATEGORY",
      linkCategoryId: "c1",
      linkProductId: null,
      linkValue: null,
      openInNewTab: false,
    });
  });

  it("rejects incomplete destinations", () => {
    expect(cleanBannerLink({ linkType: "PRODUCT" })).toHaveProperty("error");
    expect(cleanBannerLink({ linkType: "SEARCH", linkValue: "  " })).toHaveProperty("error");
    expect(cleanBannerLink({ linkType: "PAGE", linkValue: "admin" })).toHaveProperty("error");
    expect(cleanBannerLink({ linkType: "URL", linkValue: "javascript:alert(1)" })).toHaveProperty("error");
    expect(cleanBannerLink({ linkType: "URL", linkValue: "//evil.com" })).toHaveProperty("error");
  });

  it("accepts https and store paths", () => {
    expect(cleanBannerLink({ linkType: "URL", linkValue: "https://instagram.com/store" })).not.toHaveProperty("error");
    expect(cleanBannerLink({ linkType: "URL", linkValue: "/products?featured=true" })).not.toHaveProperty("error");
  });
});

describe("bannerStatus", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000);

  it("derives status from visibility and schedule", () => {
    expect(bannerStatus({ isActive: false, startsAt: null, endsAt: null }, now)).toBe("hidden");
    expect(bannerStatus({ isActive: true, startsAt: at(2), endsAt: null }, now)).toBe("scheduled");
    expect(bannerStatus({ isActive: true, startsAt: null, endsAt: at(-1) }, now)).toBe("expired");
    expect(bannerStatus({ isActive: true, startsAt: at(-1), endsAt: at(1) }, now)).toBe("live");
  });
});
