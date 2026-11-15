import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb } from "@/lib/theme/contrast";
import { getThemePreset, resolveStoreTheme } from "./store-themes";

const PINK = "#db2777";

/** Hue (degrees) of a hex color, to check a tint keeps the brand's hue. */
function hue(hex: string) {
  const [r, g, b] = hexToRgb(hex)!.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

describe("brandAccent presets", () => {
  it.each(["default", "riwaq", "maximize", "cello"])("%s re-derives its accent from the merchant's primary", (id) => {
    const theme = resolveStoreTheme(id, { presetId: id as "default" }, PINK);
    const preset = getThemePreset(id);

    expect(theme.tokens.accent).not.toBe(preset.tokens.accent);
    // A tint of the brand on the page color (warm papers pull it a little).
    const diff = Math.abs(hue(theme.tokens.accent) - hue(PINK));
    expect(Math.min(diff, 360 - diff)).toBeLessThan(35);
    expect(contrastRatio(theme.tokens.accentForeground, theme.tokens.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.tokens.accentForeground, theme.tokens.background)).toBeGreaterThanOrEqual(4.5);

    // Dark mode gets its own tint, still readable.
    const dark = theme.darkTokens!;
    expect(dark.accent).not.toBe(preset.darkTokens?.accent);
    expect(contrastRatio(dark.accentForeground!, dark.background!)).toBeGreaterThanOrEqual(4.5);
  });

  it("leaves the preset's accent alone when the primary is the preset's own", () => {
    const preset = getThemePreset("maximize");
    const theme = resolveStoreTheme("maximize", { presetId: "maximize" }, preset.tokens.primary);
    expect(theme.tokens.accent).toBe(preset.tokens.accent);
    expect(theme.tokens.accentForeground).toBe(preset.tokens.accentForeground);
  });

  it("keeps an accent the merchant picked", () => {
    const theme = resolveStoreTheme("cello", { presetId: "cello", tokenOverrides: { primary: PINK, accent: "#fef3c7" } });
    expect(theme.tokens.accent).toBe("#fef3c7");
  });

  it("doesn't touch themes whose accent is a second color (Mada's chartreuse)", () => {
    const theme = resolveStoreTheme("mada", { presetId: "mada" }, PINK);
    expect(theme.tokens.accent).toBe(getThemePreset("mada").tokens.accent);
  });
});
