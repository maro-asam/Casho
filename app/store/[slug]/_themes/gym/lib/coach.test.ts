import { describe, expect, it } from "vitest";
import { BookOpen, Cookie, CookingPot, Dumbbell, Flame, Footprints, Gamepad2, Glasses, Hand, Headphones, Milk, Pill, Shirt, Smartphone, Sparkles, SprayCan, Tag, Zap } from "lucide-react";

import { categoryIcon } from "./category-icon";
import { askAboutMessage, isFlavor, isSupplement, proteinCategory, sellsSupplements, waWith } from "./coach";

describe("isFlavor", () => {
  it("reads a supplement's flavors even when one of them maps to a swatch", () => {
    expect(isFlavor(["شوكولاتة", "فانيليا", "فراولة"], "واي بروتين")).toBe(true);
    expect(isFlavor(["Chocolate", "Vanilla"], "Gold Standard Whey")).toBe(true);
    expect(isFlavor(["شوكولاتة"], "Nitro Tech", "بروتين")).toBe(true);
  });
  it("reads a supplement's list with no real color as flavors", () => {
    expect(isFlavor(["بلو راسبيري", "مكس"], "بري وركاوت")).toBe(true);
  });
  it("reads unmistakable flavors without a supplement name", () => {
    expect(isFlavor(["شوكولاتة", "فراولة", "كوكيز"])).toBe(true);
    expect(isFlavor(["Strawberry", "Vanilla"])).toBe(true);
  });
  it("keeps colors as colors in other fields", () => {
    expect(isFlavor(["أسود", "أحمر"])).toBe(false);
    expect(isFlavor(["كراميل", "شوكولاتة", "بيج"], "شنطة جلد")).toBe(false);
    expect(isFlavor(["خوخي", "كحلي"], "فستان سواريه")).toBe(false);
    expect(isFlavor(["كراميل", "فانيليا"])).toBe(false);
    expect(isFlavor(["أسود", "فراولة"])).toBe(false);
    expect(isFlavor(["أسود", "أحمر"], "بروتين")).toBe(false);
    expect(isFlavor([])).toBe(false);
  });
});

describe("isSupplement", () => {
  it("matches consumables by category or product name", () => {
    expect(isSupplement("بروتين", "واي أيزوليت")).toBe(true);
    expect(isSupplement("عام", "كرياتين مونوهيدرات")).toBe(true);
    expect(isSupplement("Pre Workout")).toBe(true);
    expect(isSupplement("بري ووركاوت")).toBe(true);
    expect(isSupplement("بري وركاوت")).toBe(true);
    expect(isSupplement("الواي")).toBe(true);
  });
  it("leaves equipment alone", () => {
    expect(isSupplement("أدوات الجيم", "دمبل ٢٠ كجم")).toBe(false);
    expect(isSupplement(null, undefined)).toBe(false);
  });
  it("leaves other fields alone", () => {
    expect(isSupplement("روايات", "رواية الحرافيش")).toBe(false);
    expect(isSupplement("شوايات", "شواية فحم")).toBe(false);
    expect(isSupplement("راوترات", "راوتر واي فاي")).toBe(false);
    expect(isSupplement("العناية بالشعر", "بروتين للشعر بالكيراتين")).toBe(false);
    expect(isSupplement("سيروم فيتامين سي")).toBe(false);
  });
});

describe("sellsSupplements", () => {
  const shelf = (name: string, productCount: number) => ({ name, productCount });
  it("finds a supplement shelf, or supplement products in brand shelves", () => {
    expect(sellsSupplements([shelf("دمبلز", 3), shelf("مكملات", 4)], [])).toBe(true);
    expect(sellsSupplements([shelf("Optimum Nutrition", 4)], [{ name: "Gold Standard Whey 2lb" }])).toBe(true);
  });
  it("stays off for other fields and empty shelves", () => {
    expect(sellsSupplements([shelf("فساتين", 9), shelf("شنط", 3)], [{ name: "فستان كتان" }])).toBe(false);
    expect(sellsSupplements([shelf("بروتين", 0)], [])).toBe(false);
  });
});

describe("proteinCategory", () => {
  const shelf = (name: string, productCount: number) => ({ name, productCount });
  it("finds the store's protein shelf", () => {
    expect(proteinCategory([shelf("دمبلز", 3), shelf("واي بروتين", 8)])?.name).toBe("واي بروتين");
  });
  it("skips an empty shelf, hair protein and stores without one", () => {
    expect(proteinCategory([shelf("بروتين", 0)])).toBeNull();
    expect(proteinCategory([shelf("دمبلز", 3)])).toBeNull();
    expect(proteinCategory([shelf("بروتين الشعر", 5)])).toBeNull();
    expect(proteinCategory([shelf("روايات", 5)])).toBeNull();
  });
});

describe("categoryIcon", () => {
  it.each([
    ["بروتين", Milk],
    ["واي بروتين", Milk],
    ["بروتين بار", Cookie],
    ["سناك صحي", Cookie],
    ["بري ووركاوت", Zap],
    ["حرق دهون", Flame],
    ["فيتامينات", Pill],
    ["جوانتيات وأحزمة", Hand],
    ["باربل وأوزان", Dumbbell],
    ["أدوات الجيم", Dumbbell],
    ["Barbells", Dumbbell],
  ])("gym shelf %s", (name, icon) => {
    expect(categoryIcon(name)).toBe(icon);
  });
  it.each([
    ["روايات", BookOpen],
    ["شوايات", CookingPot],
    ["بروتين الشعر", Sparkles],
    ["عطور", SprayCan],
    ["موبايلات", Smartphone],
    ["Headphones", Headphones],
    ["جيمنج", Gamepad2],
    ["فساتين", Shirt],
    ["Footwear", Footprints],
    ["Eyewear", Glasses],
    ["أدوات مطبخ", CookingPot],
    ["Coats", Shirt],
    ["Oats", Cookie],
    ["قسم تاني", Tag],
  ])("other field %s", (name, icon) => {
    expect(categoryIcon(name)).toBe(icon);
  });
});

describe("waWith", () => {
  it("adds an encoded pre-written message", () => {
    expect(waWith("https://wa.me/201012345678", askAboutMessage("شيكر & برو"))).toBe(`https://wa.me/201012345678?text=${encodeURIComponent("السلام عليكم، عندي استفسار عن: شيكر & برو")}`);
  });
});
