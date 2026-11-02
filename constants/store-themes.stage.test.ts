import { describe, expect, it } from "vitest";

import { getThemePreset, resolveStoreTheme } from "./store-themes";

describe("Casho Stage preset", () => {
  it("is adaptive and keeps the merchant's surfaces in light mode only", () => {
    const theme = resolveStoreTheme("stage", { presetId: "stage", tokenOverrides: { background: "#faf7f2", primary: "#d4382c" } });
    expect(theme.tokens.background).toBe("#faf7f2");
    expect(theme.darkTokens?.background).toBe(getThemePreset("stage").darkTokens?.background);
    expect(theme.darkTokens?.primary).toBe("#d4382c");
  });

  it("offers its spotlight section, on and in order", () => {
    const { home } = getThemePreset("stage").sections;
    expect(home.showSpotlight).toBe(true);
    expect(home.sectionOrder).toContain("showSpotlight");
    expect(getThemePreset("market").sections.home.showSpotlight).toBe(false);
  });
});
