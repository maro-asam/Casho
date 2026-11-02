import { describe, expect, it } from "vitest";
import { Carrot, Cigarette, Milk, ShoppingBasket, Smartphone, SprayCan } from "lucide-react";

import { aisleOf } from "./category-icon";
import { greeting, isVariety, listMessage, waWith } from "./market";

describe("aisleOf", () => {
  it("reads the aisle from its name, Arabic or English", () => {
    expect(aisleOf("خضار طازج")).toMatchObject({ icon: Carrot, tone: "green" });
    expect(aisleOf("ألبان وأجبان").icon).toBe(Milk);
    expect(aisleOf("Dairy").icon).toBe(Milk);
    expect(aisleOf("منظفات").icon).toBe(SprayCan);
  });
  it("covers what kiosks sell", () => {
    expect(aisleOf("سجاير").icon).toBe(Cigarette);
    expect(aisleOf("كروت شحن").icon).toBe(Smartphone);
  });
  it("falls back to a basket", () => {
    expect(aisleOf("متنوعات").icon).toBe(ShoppingBasket);
  });
});

describe("isVariety", () => {
  it("treats tastes as varieties, even ones with a swatch", () => {
    expect(isVariety(["فراولة", "مانجو"])).toBe(true);
    expect(isVariety(["شوكولاتة"])).toBe(true);
  });
  it("keeps real colors as colors", () => {
    expect(isVariety(["أحمر", "أزرق"])).toBe(false);
  });
  it("needs at least one value", () => {
    expect(isVariety([])).toBe(false);
  });
});

describe("greeting", () => {
  it("follows the time of day", () => {
    expect(greeting(8)).toBe("صباح الخير");
    expect(greeting(14)).toBe("نهارك سعيد");
    expect(greeting(22)).toBe("مساء الخير");
    expect(greeting(3)).toBe("مساء الخير");
  });
});

describe("messages", () => {
  it("writes the list one item per line", () => {
    expect(listMessage(["لبن", "عيش"])).toBe("السلام عليكم، عايز أطلب:\n- لبن\n- عيش");
  });
  it("encodes the WhatsApp text", () => {
    expect(waWith("https://wa.me/20100", "أهلا بيك")).toBe("https://wa.me/20100?text=%D8%A3%D9%87%D9%84%D8%A7%20%D8%A8%D9%8A%D9%83");
  });
});
