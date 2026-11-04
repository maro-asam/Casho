import { describe, expect, it } from "vitest";

import {
  budgetTiers,
  inBudget,
  isMetalOption,
  isNumericSizes,
  isVariety,
  metalOf,
  nearestSize,
  niceRound,
  ringSizeFromCircumference,
  sizeScale,
  swatchFill,
  weightLabel,
} from "./qirat";

describe("metals", () => {
  it("reads the metal a label names, rose and white gold before plain gold", () => {
    expect(metalOf("ذهبي عيار ٢١")).toBe("gold");
    expect(metalOf("دهب")).toBe("gold");
    expect(metalOf("روز جولد")).toBe("rose");
    expect(metalOf("Rose Gold")).toBe("rose");
    expect(metalOf("ذهب أبيض")).toBe("silver");
    expect(metalOf("فضة استرليني")).toBe("silver");
    expect(metalOf("18K")).toBe("gold");
    expect(metalOf("أحمر")).toBeNull();
  });

  it("paints metals as a finish and other colors flat", () => {
    expect(swatchFill("ذهبي")).toMatch(/^linear-gradient/);
    expect(swatchFill("أسود")).toMatch(/^#/);
    expect(swatchFill("لؤلؤ صناعي")).toBeNull();
  });

  it("treats a metal-only option as metal, not as a variety", () => {
    expect(isMetalOption(["ذهبي", "فضي", "روز جولد"])).toBe(true);
    expect(isMetalOption(["ذهبي", "أحمر"])).toBe(false);
    expect(isVariety(["ذهبي", "فضي"])).toBe(false);
    expect(isVariety(["مسك", "عود"])).toBe(true);
  });
});

describe("budgets", () => {
  it("rounds to printable figures", () => {
    expect(niceRound(473)).toBe(500);
    expect(niceRound(1890)).toBe(2000);
    expect(niceRound(2900)).toBe(2500);
    expect(niceRound(8200)).toBe(10000);
  });

  it("splits real prices into three ordered budgets", () => {
    const tiers = budgetTiers([250, 320, 450, 600, 900, 1500, 2400, 3800, 5200]);
    expect(tiers).toHaveLength(3);
    expect(tiers[0].min).toBe(0);
    expect(tiers[0].max).toBeLessThan(tiers[1].max);
    expect(tiers[2].max).toBe(0);
    expect(inBudget(250, tiers[0])).toBe(true);
    expect(inBudget(5200, tiers[2])).toBe(true);
  });

  it("offers nothing for too few or too close prices", () => {
    expect(budgetTiers([100, 200])).toEqual([]);
    expect(budgetTiers([100, 110, 120, 130])).toEqual([]);
  });
});

describe("ring sizes", () => {
  it("maps a circumference to ISO and US sizes", () => {
    expect(ringSizeFromCircumference(51.9)).toMatchObject({ iso: 52, us: 6 });
    expect(ringSizeFromCircumference(54.4)).toMatchObject({ iso: 54, us: 7 });
    expect(ringSizeFromCircumference(20)).toBeNull();
  });

  it("reads the store's scale and picks the closest size", () => {
    expect(isNumericSizes(["١٦", "17", "18.5"])).toBe(true);
    expect(isNumericSizes(["S", "M"])).toBe(false);
    expect(sizeScale(["50", "52", "54"])).toBe("iso");
    expect(sizeScale(["6", "7", "8"])).toBe("us");
    expect(sizeScale(["16", "18", "20"])).toBeNull();
    expect(nearestSize(["50", "52", "54", "56"], 53.2)).toBe("54");
  });
});

describe("weight", () => {
  it("quotes grams under a kilo", () => {
    const fmt = (n: number) => String(n);
    expect(weightLabel(0.0045, fmt)).toBe("4.5 جرام");
    expect(weightLabel(1.25, fmt)).toBe("1.25 كجم");
    expect(weightLabel(0, fmt)).toBeNull();
  });
});
