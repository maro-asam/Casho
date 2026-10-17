import { describe, expect, it } from "vitest";

import { PRODUCT_COLOR_PALETTE, isLightSwatch, swatchColor } from "./product-colors";

describe("swatchColor", () => {
  it("recognizes every palette color", () => {
    for (const { name, hex } of PRODUCT_COLOR_PALETTE) expect(swatchColor(name)).toBe(hex);
  });

  it("ignores spelling variants, the article and noise words", () => {
    expect(swatchColor("اسود")).toBe("#111111");
    expect(swatchColor("الأسود")).toBe("#111111");
    expect(swatchColor("لون أحمر")).toBe("#c81e1e");
    expect(swatchColor("مستردة")).toBe(swatchColor("مسترده"));
    expect(swatchColor("Navy")).toBe("#1f2a44");
    expect(swatchColor("off-white")).toBe("#f5f1e8");
  });

  it("applies light/dark modifiers", () => {
    const base = swatchColor("أزرق")!;
    expect(swatchColor("أزرق فاتح")).not.toBe(base);
    expect(swatchColor("أزرق غامق")).not.toBe(base);
    expect(isLightSwatch(swatchColor("أزرق فاتح")!)).toBe(false);
    expect(swatchColor("light blue")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("splits two-tone labels, including a glued Arabic و", () => {
    for (const label of ["أسود × أبيض", "black/white", "أسود و أبيض", "أسود وأبيض"]) {
      expect(swatchColor(label)).toBe("linear-gradient(135deg, #111111 0% 50%, #ffffff 50% 100%)");
    }
  });

  it("doesn't split a color that starts with و", () => {
    expect(swatchColor("وردي")).toBe("#f4a6c0");
    expect(swatchColor("أسود وردي")).not.toContain("gradient");
  });

  it("handles hex, multicolor and unknown labels", () => {
    expect(swatchColor("#1F2A44")).toBe("#1f2a44");
    expect(swatchColor("ملون")).toContain("conic-gradient");
    expect(swatchColor("Midnight Aurora")).toBeNull();
    expect(swatchColor("  ")).toBeNull();
  });
});

describe("isLightSwatch", () => {
  it("flags white-ish swatches", () => {
    expect(isLightSwatch("#ffffff")).toBe(true);
    expect(isLightSwatch("#111111")).toBe(false);
  });
});
