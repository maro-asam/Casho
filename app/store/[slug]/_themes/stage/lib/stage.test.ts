import { describe, expect, it } from "vitest";

import { askAboutMessage, isVariety, joinMessage, waWith } from "./stage";

describe("stage helpers", () => {
  it("encodes the message into the WhatsApp link", () => {
    expect(waWith("https://wa.me/201000000000", askAboutMessage("هودي أسود"))).toBe(`https://wa.me/201000000000?text=${encodeURIComponent("السلام عليكم، عندي استفسار عن: هودي أسود")}`);
    expect(joinMessage("دفا")).toContain("دفا");
  });

  it("tells colors from flavors and scents", () => {
    expect(isVariety(["أسود", "رمادي", "كحلي"])).toBe(false);
    expect(isVariety(["فانيليا", "شوكولاتة"])).toBe(true);
    expect(isVariety(["عود", "مسك"])).toBe(true);
    expect(isVariety(["أصلي", "مطوّر"])).toBe(true);
    expect(isVariety(["رمادي", "برتقالي", "لافندر"])).toBe(false);
    expect(isVariety(["خوخي"])).toBe(false);
    expect(isVariety(["برتقال", "مانجو"])).toBe(true);
    expect(isVariety([])).toBe(false);
  });
});
