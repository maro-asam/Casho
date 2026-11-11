import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = { showcaseSite: { findMany: vi.fn() } };
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { getPublishedShowcase, resizeCloudinary, toShowcaseCard } = await import("./public");
const { showcaseSiteSchema } = await import("./validation");
const { showcaseCategory } = await import("./catalog");

beforeEach(() => vi.clearAllMocks());

const row = (over: Partial<Parameters<typeof toShowcaseCard>[0]> = {}) => ({
  id: "s1",
  name: "متجر نور",
  category: "fashion",
  url: "https://nour.example.com/",
  imageUrl: "https://img.example.com/nour.png",
  store: null,
  ...over,
});

describe("toShowcaseCard", () => {
  it("uses the typed URL for an example without a store", () => {
    expect(toShowcaseCard(row())).toMatchObject({ url: "https://nour.example.com/", host: "nour.example.com" });
  });

  it("follows a linked store's live address, custom domain first", () => {
    const store = { slug: "nour", customDomain: "nour.com", customDomainStatus: "ACTIVE", subscriptionStatus: "ACTIVE" as const };
    expect(toShowcaseCard(row({ store }))?.url).toBe("https://nour.com");
    const pending = { ...store, customDomainStatus: "PENDING" };
    expect(toShowcaseCard(row({ store: pending }))?.host).toMatch(/^nour\./);
  });

  it("hides an example whose store is closed", () => {
    const store = { slug: "nour", customDomain: null, customDomainStatus: null, subscriptionStatus: "PAST_DUE" as const };
    expect(toShowcaseCard(row({ store }))).toBeNull();
  });

  it("maps an unknown category to other", () => {
    expect(toShowcaseCard(row({ category: "gone" }))?.category).toBe("other");
    expect(showcaseCategory("beauty")).toBe("beauty");
  });
});

describe("resizeCloudinary", () => {
  it("adds a width cap to plain Cloudinary uploads only", () => {
    expect(resizeCloudinary("https://res.cloudinary.com/x/image/upload/v1/casho/a.png", 960)).toBe(
      "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_960/v1/casho/a.png",
    );
    const transformed = "https://res.cloudinary.com/x/image/upload/w_400,c_fill/v1/a.png";
    expect(resizeCloudinary(transformed, 960)).toBe(transformed);
    expect(resizeCloudinary("https://img.example.com/a.png", 960)).toBe("https://img.example.com/a.png");
  });
});

describe("getPublishedShowcase", () => {
  it("asks for published rows only and never throws", async () => {
    prismaMock.showcaseSite.findMany.mockResolvedValueOnce([row()]);
    expect(await getPublishedShowcase()).toHaveLength(1);
    expect(prismaMock.showcaseSite.findMany.mock.calls[0][0].where).toEqual({ published: true });

    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    prismaMock.showcaseSite.findMany.mockRejectedValueOnce(new Error("relation does not exist"));
    expect(await getPublishedShowcase()).toEqual([]);
  });
});

describe("showcaseSiteSchema", () => {
  const base = { name: "متجر نور", category: "fashion", imageUrl: "https://img.example.com/a.png" };

  it("needs a store or a URL", () => {
    expect(showcaseSiteSchema.safeParse(base).success).toBe(false);
    expect(showcaseSiteSchema.safeParse({ ...base, url: "https://nour.com" }).success).toBe(true);
    expect(showcaseSiteSchema.safeParse({ ...base, storeSlug: " Nour " }).data?.storeSlug).toBe("nour");
  });

  it("rejects non-web links and unknown categories", () => {
    expect(showcaseSiteSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(showcaseSiteSchema.safeParse({ ...base, url: "https://nour.com", category: "weapons" }).success).toBe(false);
    expect(showcaseSiteSchema.safeParse({ ...base, url: "https://nour.com", imageUrl: "data:image/png;base64,AA" }).success).toBe(false);
  });
});

describe("parseStoreRef", async () => {
  const { parseStoreRef } = await import("./store-ref");

  it("reads a slug, a Casho address or a custom domain", () => {
    expect(parseStoreRef(" Nour ")).toEqual({ slug: "nour" });
    expect(parseStoreRef("https://nour.casho.store/products/x")).toEqual({ slug: "nour" });
    expect(parseStoreRef("nour.casho.store")).toEqual({ slug: "nour" });
    expect(parseStoreRef("https://www.nour.com/")).toEqual({ domain: "nour.com" });
    expect(parseStoreRef("nour.localhost", "localhost")).toEqual({ slug: "nour" });
  });

  it("rejects junk", () => {
    expect(parseStoreRef("")).toBeNull();
    expect(parseStoreRef("a.b.casho.store")).toBeNull();
    expect(parseStoreRef("not a store")).toBeNull();
  });
});
