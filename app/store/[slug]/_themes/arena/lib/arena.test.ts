import { describe, expect, it } from "vitest";

import { featuredGameIds, initialPackage, orderGames, sameGame, sortPackages, splitHeadline } from "./arena";

const pkg = (id: string, price: number, extra: Partial<{ stock: number; isFeatured: boolean; slug: string }> = {}) => ({
  id,
  slug: extra.slug ?? id,
  price,
  stock: extra.stock ?? 10,
  isFeatured: extra.isFeatured ?? false,
});

describe("sortPackages", () => {
  it("orders by price and keeps ties stable", () => {
    expect(sortPackages([pkg("c", 300), pkg("a", 100), pkg("b", 100)]).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("initialPackage", () => {
  const list = [pkg("a", 1, { stock: 0 }), pkg("b", 2), pkg("c", 3, { isFeatured: true }), pkg("d", 4, { slug: "big" })];
  it("prefers the requested package, by id or slug", () => {
    expect(initialPackage(list, "d")?.id).toBe("d");
    expect(initialPackage(list, "big")?.id).toBe("d");
  });
  it("falls back to a featured one, then the first in stock, never a sold-out one", () => {
    expect(initialPackage(list)?.id).toBe("c");
    expect(initialPackage(list, "a")?.id).toBe("c");
    expect(initialPackage([pkg("x", 1, { stock: 0 }), pkg("y", 2)])?.id).toBe("y");
    expect(initialPackage([pkg("x", 1, { stock: 0 })])).toBeNull();
  });
});

describe("splitHeadline", () => {
  it("splits on the merchant's line break first", () => {
    expect(splitHeadline("اشحن لعبتك بنفسك\nبدون وسطاء")).toEqual(["اشحن لعبتك بنفسك", "بدون وسطاء"]);
  });
  it("splits on an Arabic comma and drops a trailing mark", () => {
    expect(splitHeadline("اشحن لعبتك بنفسك، بدون وسطاء وبدون انتظار.")).toEqual(["اشحن لعبتك بنفسك", "بدون وسطاء وبدون انتظار"]);
  });
  it("keeps a short headline whole", () => {
    expect(splitHeadline("Casho Store")).toEqual(["Casho Store", null]);
  });
});

describe("games", () => {
  const cats = [
    { id: "1", name: "FC", slug: "fc", image: null, productCount: 0 },
    { id: "2", name: "Free Fire", slug: "ff", image: null, productCount: 7 },
    { id: "3", name: "PUBG", slug: "pubg", image: null, productCount: 10 },
  ];
  it("puts games with packages before the empty ones", () => {
    expect(orderGames(cats).map((c) => c.id)).toEqual(["2", "3", "1"]);
  });
  it("marks games that hold a featured package", () => {
    expect([...featuredGameIds(cats, [{ isFeatured: true, categoryName: "PUBG" }, { isFeatured: false, categoryName: "Free Fire" }])]).toEqual(["3"]);
  });
  it("marks none when every game with packages has one", () => {
    expect(featuredGameIds(cats, [{ isFeatured: true, categoryName: "PUBG" }, { isFeatured: true, categoryName: "Free Fire" }]).size).toBe(0);
  });
  it("keeps related packages of the same game only", () => {
    const related = [
      { id: "a", categoryName: "PUBG" },
      { id: "b", categoryName: "Free Fire" },
      { id: "c", categoryName: "PUBG" },
    ];
    expect(sameGame(related, "PUBG", "c").map((p) => p.id)).toEqual(["a"]);
  });
});
