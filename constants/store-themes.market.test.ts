import { describe, expect, it } from "vitest";

import { getThemePreset, resolveStoreTheme } from "./store-themes";

describe("adaptive presets", () => {
  it("keeps the merchant's surfaces out of dark mode", () => {
    const theme = resolveStoreTheme("market", { presetId: "market", tokenOverrides: { background: "#fff8f0", foreground: "#222222" } });
    expect(theme.tokens.background).toBe("#fff8f0");
    expect(theme.darkTokens?.background).toBe("#000000");
    expect(theme.darkTokens?.foreground).toBe("#f5f5f7");
  });

  it("applies the merchant's brand colors to both modes", () => {
    const theme = resolveStoreTheme("market", { presetId: "market", tokenOverrides: { primary: "#2563eb" } });
    expect(theme.tokens.primary).toBe("#2563eb");
    expect(theme.darkTokens?.primary).toBe("#2563eb");
  });

  it("keeps text readable on the tint in dark mode too", () => {
    const yellow = resolveStoreTheme("market", null, "#ffd600");
    expect(yellow.tokens.primaryForeground).toBe(yellow.darkTokens?.primaryForeground);
    expect(yellow.darkTokens?.primaryForeground).not.toBe(getThemePreset("market").darkTokens?.primaryForeground);
  });

  it("leaves the preset's own dark colors alone without overrides", () => {
    const theme = resolveStoreTheme("market", null);
    expect(theme.darkTokens?.primary).toBe("#ff9230");
    expect(theme.darkTokens?.primaryForeground).toBe("#1f1000");
  });

  it("doesn't change other themes", () => {
    const theme = resolveStoreTheme("default", { presetId: "default", tokenOverrides: { background: "#fff8f0" } });
    expect(theme.darkTokens?.background).toBe("#fff8f0");
  });
});
