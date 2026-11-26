import { describe, expect, it } from "vitest";

import {
  MAP_SIZE,
  brewsOf,
  RECIPES,
  dose,
  familyOf,
  fieldOf,
  gramsOf,
  landDots,
  needsGrind,
  notesOf,
  optionKind,
  originOf,
  originsIn,
  project,
  readProfile,
  roastOf,
  splitDescription,
  suggestedGrind,
  type CoffeeInput,
} from "./coffee";

const bean = (over: Partial<CoffeeInput> = {}): CoffeeInput => ({ name: "إثيوبيا يرجاتشيفي", categoryName: "بن مختص", attributes: [], sizes: [], colors: [], ...over });

describe("fields", () => {
  it("knows the keys merchants type, in Arabic and English, however spelled", () => {
    expect(fieldOf("المنشأ")).toBe("origin");
    expect(fieldOf("بلد المنشأ")).toBe("origin");
    expect(fieldOf("درجة التحميص")).toBe("roast");
    expect(fieldOf("Tasting notes")).toBe("notes");
    expect(fieldOf("الارتفاع")).toBe("altitude");
    expect(fieldOf("المعالجة")).toBe("process");
    expect(fieldOf("اللون")).toBeNull();
  });

  it("takes key: value lines out of a description and keeps the story", () => {
    const { rows, story } = splitDescription("قهوة زهرية خفيفة.\n\nالمنشأ: إثيوبيا\n- النكهات: ياسمين، ليمون\nالسعر: ٥٠٠");
    expect(rows).toEqual([
      { key: "المنشأ", value: "إثيوبيا" },
      { key: "النكهات", value: "ياسمين، ليمون" },
    ]);
    expect(story).toBe("قهوة زهرية خفيفة.\n\nالسعر: ٥٠٠");
  });
});

describe("roast", () => {
  it("reads compound words before single ones, and a 1–5 scale", () => {
    expect(roastOf("متوسط غامق")).toBe(4);
    expect(roastOf("Medium-Dark")).toBe(4);
    expect(roastOf("فاتح")).toBe(2);
    expect(roastOf("فاتح جدًا")).toBe(1);
    expect(roastOf("غامق")).toBe(5);
    expect(roastOf("وسط")).toBe(3);
    expect(roastOf("٣/٥")).toBe(3);
    expect(roastOf("ممتاز")).toBeNull();
  });
});

describe("notes", () => {
  it("splits on Arabic and Latin separators and finds each flavor family", () => {
    expect(notesOf("ياسمين، ليمون، شاي أسود").map((n) => n.family)).toEqual(["floral", "citrus", "tea"]);
    expect(notesOf("Dark chocolate, hazelnut / caramel").map((n) => n.family)).toEqual(["chocolate", "nutty", "caramel"]);
  });

  it("puts tricky notes in the right family", () => {
    expect(familyOf("زهر البرتقال")).toBe("floral");
    expect(familyOf("nutmeg")).toBe("spice");
    expect(familyOf("توت أزرق")).toBe("berry");
    expect(familyOf("شيء غريب")).toBe("other");
  });
});

describe("origins", () => {
  it("finds the country from its name or a famous region, as whole words", () => {
    expect(originOf("إثيوبيا يرجاتشيفي")?.id).toBe("ethiopia");
    expect(originOf("Yirgacheffe Kochere")?.id).toBe("ethiopia");
    expect(originOf("بن برازيلي سانتوس")?.id).toBe("brazil");
    expect(originOf("اليمن حرازي")?.id).toBe("yemen");
    expect(originOf("هندوراس")?.id).toBe("honduras");
    expect(originOf("شاي من بيروت")).toBeNull();
  });

  it("reads every country of a blend, in the merchant's order", () => {
    expect(originsIn("البرازيل، كولومبيا، إثيوبيا").map((o) => o.id)).toEqual(["brazil", "colombia", "ethiopia"]);
    expect(originsIn("إندونيسيا — سومطرة").map((o) => o.id)).toEqual(["sumatra"]);
    const blend = readProfile(bean({ name: "خلطة البيت", attributes: [{ key: "المنشأ", value: "البرازيل، إثيوبيا" }] }));
    expect(blend.origin).toEqual({ id: "البرازيل اثيوبيا", label: "البرازيل، إثيوبيا", ll: null });
    expect(blend.origins.map((o) => o.id)).toEqual(["brazil", "ethiopia"]);
  });

  it("projects the belt into the map and draws land dots", () => {
    const { x, y } = project([0, 0]);
    expect(x).toBe(MAP_SIZE.w / 2);
    expect(y).toBe(MAP_SIZE.h / 2);
    expect(landDots().split("M").length).toBeGreaterThan(300);
  });
});

describe("profile", () => {
  it("reads the merchant's details first, then description lines and the name", () => {
    const p = readProfile(
      bean({
        attributes: [
          { key: "المعالجة", value: "مغسولة" },
          { key: "التحميص", value: "فاتح" },
          { key: "الخامة", value: "ورق كرافت" },
        ],
        description: "النكهات: ياسمين، ليمون\nالتحميص: غامق",
      }),
    );
    expect(p.origin?.id).toBe("ethiopia");
    expect(p.process).toBe("مغسولة");
    expect(p.roast).toEqual({ level: 2, text: "فاتح" });
    expect(p.notes.map((n) => n.label)).toEqual(["ياسمين", "ليمون"]);
    expect(p.rest).toEqual([{ key: "الخامة", value: "ورق كرافت" }]);
    expect(p.isCoffee).toBe(true);
  });

  it("doesn't call a mug made in China coffee", () => {
    expect(readProfile({ name: "مج سيراميك ٣٥٠ مل", attributes: [{ key: "بلد المنشأ", value: "الصين" }], sizes: [], colors: [] }).isCoffee).toBe(false);
    expect(readProfile({ name: "قمع تقطير V60", categoryName: "أدوات التحضير", attributes: [], sizes: [], colors: [] }).isCoffee).toBe(false);
  });

  it("reads net weight from the details or the name", () => {
    expect(gramsOf("250 جم")).toBe(250);
    expect(gramsOf("١ كيلو")).toBe(1000);
    expect(gramsOf("نص كيلو")).toBe(500);
    expect(readProfile(bean({ name: "بن برازيلي 500g" })).grams).toBe(500);
  });
});

describe("grind", () => {
  it("asks for whole-bean coffee only", () => {
    expect(needsGrind(bean(), true)).toBe(true);
    expect(needsGrind(bean(), false)).toBe(false);
    expect(needsGrind(bean({ name: "بن تركي محوج" }), true)).toBe(false);
    expect(needsGrind(bean({ name: "كبسولات إسبريسو" }), true)).toBe(false);
    expect(needsGrind({ name: "مطحنة يدوية", categoryName: "أدوات", attributes: [], sizes: [], colors: [] }, true)).toBe(false);
  });

  it("leaves it to the product when its own options are grinds", () => {
    expect(optionKind(["حبوب", "مطحون ناعم", "مطحون وسط"])).toBe("grind");
    expect(needsGrind(bean({ colors: ["حبوب", "مطحون"] }), true)).toBe(false);
  });

  it("names other coffee options", () => {
    expect(optionKind(["فاتح", "وسط", "غامق"])).toBe("roast");
    expect(optionKind(["250 جم", "500 جم", "١ كيلو"])).toBe("weight");
    expect(optionKind(["سادة", "محوج"])).toBe("spice");
    expect(optionKind(["S", "M"])).toBe("plain");
  });

  it("suggests the grind for the first brew method, or the roast's", () => {
    expect(suggestedGrind(readProfile(bean({ attributes: [{ key: "التحضير", value: "إسبريسو، موكا" }] })))).toBe("espresso");
    expect(suggestedGrind(readProfile(bean({ attributes: [{ key: "التحميص", value: "فاتح" }] })))).toBe("filter");
    expect(suggestedGrind(readProfile(bean()))).toBeNull();
  });
});

describe("brew methods", () => {
  it("keeps the merchant's order", () => {
    expect(brewsOf("فلتر V60، كيمكس، كولد برو")).toEqual(["filter", "cold"]);
    expect(brewsOf("Cold brew, espresso")).toEqual(["cold", "espresso"]);
  });
});

describe("recipes", () => {
  it("scales coffee and water with cups", () => {
    expect(dose(RECIPES.filter, 1)).toEqual({ coffee: 15.5, water: 250 });
    expect(dose(RECIPES.turkish, 2)).toEqual({ coffee: 14, water: 140 });
    expect(dose(RECIPES.espresso, 2)).toEqual({ coffee: 36, water: 72 });
    expect(dose(RECIPES.filter, 99).water).toBe(RECIPES.filter.maxCups * 250);
  });
});
