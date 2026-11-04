import { describe, expect, it } from "vitest";

import { THEME_CATEGORY_LIST, getThemePreset, resolveStoreTheme } from "./store-themes";

describe("Casho Qirat preset", () => {
  it("is adaptive: the merchant's gold and primary reach dark mode, their surfaces don't", () => {
    const theme = resolveStoreTheme("qirat", { presetId: "qirat", tokenOverrides: { background: "#fffaf3", accent: "#c0a060", primary: "#0f3d2e" } });
    expect(theme.tokens.background).toBe("#fffaf3");
    expect(theme.darkTokens?.background).toBe(getThemePreset("qirat").darkTokens?.background);
    expect(theme.darkTokens?.accent).toBe("#c0a060");
    expect(theme.darkTokens?.primary).toBe("#0f3d2e");
  });

  it("offers its gift finder, on and in order, and no other theme turns it on", () => {
    const { home } = getThemePreset("qirat").sections;
    expect(home.showGiftFinder).toBe(true);
    expect(home.sectionOrder).toContain("showGiftFinder");
    expect(getThemePreset("stage").sections.home.showGiftFinder).toBe(false);
  });

  it("is listed under jewelry", () => {
    expect(getThemePreset("qirat").categories).toContain("jewelry");
    expect(THEME_CATEGORY_LIST.some((c) => c.id === "jewelry")).toBe(true);
  });
});
