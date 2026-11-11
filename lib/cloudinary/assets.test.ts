import { describe, expect, it } from "vitest";

import { deletionBatches, extractCloudinaryAssets, likeContains, publicIdFromPath, referencePattern } from "./assets";

const CLOUD = "casho-cloud";
const base = `https://res.cloudinary.com/${CLOUD}`;

describe("publicIdFromPath", () => {
  it("drops the version and the image extension", () => {
    expect(publicIdFromPath("image", "v1731000000/casho/uploads/products/abc123.jpg")).toBe("casho/uploads/products/abc123");
  });

  it("skips transformations, commas included", () => {
    expect(publicIdFromPath("image", "f_auto,q_auto,c_limit,w_960/v1/casho/uploads/logos/x.png")).toBe("casho/uploads/logos/x");
  });

  it("keeps the extension of raw files and decodes the name", () => {
    expect(publicIdFromPath("raw", "v1/casho/uploads/digital/My%20Book_q1w2e3.pdf")).toBe("casho/uploads/digital/My Book_q1w2e3.pdf");
  });

  it("only takes files under casho/", () => {
    expect(publicIdFromPath("image", "v1/sample.jpg")).toBeNull();
    expect(publicIdFromPath("image", "v1/other/casho.jpg")).toBeNull();
    expect(publicIdFromPath("image", "v1/casho")).toBeNull();
    expect(publicIdFromPath("image", "v1/casho//x.jpg")).toBeNull();
  });
});

describe("extractCloudinaryAssets", () => {
  it("finds files in plain columns, joined arrays and JSON text, once each", () => {
    const text = [
      `${base}/image/upload/v1/casho/uploads/products/a.jpg ${base}/image/upload/v2/casho/uploads/products/b.webp`,
      JSON.stringify({ hero: { image: `${base}/image/upload/v3/casho/uploads/sections/c.png` }, again: `${base}/image/upload/v1/casho/uploads/products/a.jpg` }),
      `<img src="${base}/video/upload/v1/casho/uploads/sharks/reel.mp4">`,
    ].join(" ");

    expect(extractCloudinaryAssets(text, CLOUD)).toEqual([
      { resourceType: "image", publicId: "casho/uploads/products/a" },
      { resourceType: "image", publicId: "casho/uploads/products/b" },
      { resourceType: "image", publicId: "casho/uploads/sections/c" },
      { resourceType: "video", publicId: "casho/uploads/sharks/reel" },
    ]);
  });

  it("ignores other clouds, other hosts and query strings", () => {
    const text = [
      "https://res.cloudinary.com/someone-else/image/upload/v1/casho/uploads/products/a.jpg",
      "https://cdn.shopify.com/s/files/casho/uploads/products/a.jpg",
      `${base}/image/upload/v1/casho/uploads/banners/d.jpg?_a=xyz`,
    ].join("\n");
    expect(extractCloudinaryAssets(text, CLOUD)).toEqual([{ resourceType: "image", publicId: "casho/uploads/banners/d" }]);
  });

  it("treats the same id in image and raw as two files", () => {
    const text = `${base}/image/upload/v1/casho/uploads/x/f.pdf ${base}/raw/upload/v1/casho/uploads/x/f.pdf`;
    expect(extractCloudinaryAssets(text, CLOUD)).toHaveLength(2);
  });
});

describe("referencePattern", () => {
  it("matches the encoded and decoded forms, with LIKE wildcards escaped", () => {
    expect(referencePattern({ resourceType: "raw", publicId: "casho/uploads/digital/My Book_q1.pdf" })).toBe("%casho/uploads/digital/My%");
    expect(referencePattern({ resourceType: "image", publicId: "casho/uploads/products/a_b" })).toBe("%casho/uploads/products/a\\_b%");
    expect(likeContains("100%")).toBe("%100\\%%");
  });
});

describe("deletionBatches", () => {
  it("groups by resource type in chunks", () => {
    const assets = [
      ...Array.from({ length: 5 }, (_, i) => ({ resourceType: "image" as const, publicId: `casho/i${i}` })),
      { resourceType: "raw" as const, publicId: "casho/r.pdf" },
    ];
    expect(deletionBatches(assets, 2)).toEqual([
      { resourceType: "image", publicIds: ["casho/i0", "casho/i1"] },
      { resourceType: "image", publicIds: ["casho/i2", "casho/i3"] },
      { resourceType: "image", publicIds: ["casho/i4"] },
      { resourceType: "raw", publicIds: ["casho/r.pdf"] },
    ]);
  });
});
