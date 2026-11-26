import { describe, expect, it } from "vitest";

import { THEME_PRESET_IDS, getThemePreset, resolveStoreTheme } from "./store-themes";

describe("Casho Bunn preset", () => {
  it("is registered and adaptive: brand colors reach dark mode, surfaces don't", () => {
    expect(THEME_PRESET_IDS).toContain("bunn");
    const theme = resolveStoreTheme("bunn", { presetId: "bunn", tokenOverrides: { background: "#fbf6ee", accent: "#b5652e", primary: "#1f3b2c" } });
    expect(theme.tokens.background).toBe("#fbf6ee");
    expect(theme.darkTokens?.background).toBe(getThemePreset("bunn").darkTokens?.background);
    expect(theme.darkTokens?.accent).toBe("#b5652e");
    expect(theme.darkTokens?.primary).toBe("#1f3b2c");
  });

  it("asks for the grind by default, and the Studio switch turns it off", () => {
    expect(getThemePreset("bunn").layout.grind).toBe(true);
    expect(resolveStoreTheme("bunn", { presetId: "bunn", layoutOverrides: { grind: false } }).layout.grind).toBe(false);
  });

  it("turns on its own sections, in order, and no other theme does", () => {
    const { home } = getThemePreset("bunn").sections;
    for (const key of ["showBrewGuide", "showOrigins"] as const) {
      expect(home[key]).toBe(true);
      expect(home.sectionOrder).toContain(key);
      for (const id of THEME_PRESET_IDS) if (id !== "bunn") expect(getThemePreset(id).sections.home[key]).toBe(false);
    }
  });

  it("is listed under food", () => {
    expect(getThemePreset("bunn").categories).toContain("food");
  });
});
