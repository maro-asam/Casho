import { describe, expect, it } from "vitest";
import { hasAnyPixel, isValidPixelId, normalizePixelId } from "./shared";
import { normalizePhone } from "@/lib/meta-capi";

describe("pixel ids", () => {
  it("accepts real-looking ids", () => {
    expect(isValidPixelId("meta", "123456789012345")).toBe(true);
    expect(isValidPixelId("tiktok", normalizePixelId("tiktok", " c4abcd1234efgh567890 "))).toBe(true);
    expect(isValidPixelId("snap", normalizePixelId("snap", "1A2B3C4D-1234-5678-9ABC-1A2B3C4D5E6F"))).toBe(true);
  });

  it("rejects anything that could break out of the inline script", () => {
    expect(isValidPixelId("meta", "123');alert(1);//")).toBe(false);
    expect(isValidPixelId("tiktok", "C4ABCD</script><script>")).toBe(false);
    expect(isValidPixelId("snap", "1a2b3c4d-1234-5678-9abc-1a2b3c4d5e6f\"")).toBe(false);
    expect(isValidPixelId("meta", null)).toBe(false);
    expect(isValidPixelId("meta", "")).toBe(false);
  });

  it("knows when a store has no pixel", () => {
    expect(hasAnyPixel({ meta: null, tiktok: null, snap: null })).toBe(false);
    expect(hasAnyPixel({ meta: "123456789012345", tiktok: null, snap: null })).toBe(true);
  });
});

describe("normalizePhone (CAPI matching)", () => {
  it("adds Egypt's country code to local numbers", () => {
    expect(normalizePhone("010 1234 5678")).toBe("201012345678");
    expect(normalizePhone("+201012345678")).toBe("201012345678");
    expect(normalizePhone("00201012345678")).toBe("201012345678");
  });
});
