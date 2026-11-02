import { describe, expect, it } from "vitest";
import { Cookie, Dumbbell, Flame, Hand, Milk, Pill, Zap } from "lucide-react";

import { categoryIcon } from "./category-icon";
import { askAboutMessage, isFlavor, isSupplement, proteinCategory, waWith } from "./coach";

describe("isFlavor", () => {
  it("reads flavors even when one of them maps to a swatch", () => {
    expect(isFlavor(["شوكولاتة", "فانيليا", "فراولة"])).toBe(true);
    expect(isFlavor(["Chocolate", "Vanilla"])).toBe(true);
  });
  it("reads a list with no real color as flavors", () => {
    expect(isFlavor(["بلو راسبيري", "مكس"])).toBe(true);
  });
  it("keeps real colors as colors", () => {
    expect(isFlavor(["أسود", "أحمر"])).toBe(false);
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
  });
  it("leaves equipment alone", () => {
    expect(isSupplement("أدوات الجيم", "دمبل ٢٠ كجم")).toBe(false);
    expect(isSupplement(null, undefined)).toBe(false);
  });
});

describe("proteinCategory", () => {
  const shelf = (name: string, productCount: number) => ({ name, productCount });
  it("finds the store's protein shelf", () => {
    expect(proteinCategory([shelf("دمبلز", 3), shelf("واي بروتين", 8)])?.name).toBe("واي بروتين");
  });
  it("skips an empty shelf and stores without one", () => {
    expect(proteinCategory([shelf("بروتين", 0)])).toBeNull();
    expect(proteinCategory([shelf("دمبلز", 3)])).toBeNull();
  });
});

describe("categoryIcon", () => {
  it.each([
    ["بروتين", Milk],
    ["بروتين بار", Cookie],
    ["سناك صحي", Cookie],
    ["بري ووركاوت", Zap],
    ["حرق دهون", Flame],
    ["فيتامينات", Pill],
    ["جوانتيات وأحزمة", Hand],
    ["باربل وأوزان", Dumbbell],
    ["Barbells", Dumbbell],
    ["قسم تاني", Dumbbell],
  ])("%s", (name, icon) => {
    expect(categoryIcon(name)).toBe(icon);
  });
});

describe("waWith", () => {
  it("adds an encoded pre-written message", () => {
    expect(waWith("https://wa.me/201012345678", askAboutMessage("شيكر & برو"))).toBe(`https://wa.me/201012345678?text=${encodeURIComponent("السلام عليكم، عندي استفسار عن: شيكر & برو")}`);
  });
});
