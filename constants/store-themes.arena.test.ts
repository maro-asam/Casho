import { describe, expect, it } from "vitest";

import { getThemePreset, resolveStoreTheme, THEME_CATEGORY_LIST } from "./store-themes";

describe("Casho Arena preset", () => {
  it("is a dark theme that asks for the player ID by default", () => {
    const preset = getThemePreset("arena");
    expect(preset.id).toBe("arena");
    expect(preset.colorScheme).toBe("dark");
    expect(preset.layout.playerId).toBe(true);
  });

  it("lets the merchant switch the player ID off", () => {
    const theme = resolveStoreTheme("arena", { presetId: "arena", layoutOverrides: { playerId: false } });
    expect(theme.layout.playerId).toBe(false);
  });

  it("shows the games and the order steps on the home page", () => {
    const { home } = getThemePreset("arena").sections;
    expect(home.showCategories).toBe(true);
    expect(home.showWhyChooseUs).toBe(true);
    expect(home.sectionOrder?.slice(0, 3)).toEqual(["showHero", "showOfferStrip", "showCategories"]);
  });

  it("is listed under digital top-ups", () => {
    expect(getThemePreset("arena").categories).toContain("digital");
    expect(THEME_CATEGORY_LIST.some((c) => c.id === "digital")).toBe(true);
  });
});
