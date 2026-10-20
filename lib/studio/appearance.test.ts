import { describe, expect, it } from "vitest";
import { changedAreas, liveAppearance, readStudioDraft, sameValue, studioStatus, type Appearance, type StudioDraft } from "./appearance";

const live: Appearance = liveAppearance({
  themeId: "default",
  themeConfig: { presetId: "riwaq", tokenOverrides: { primary: "#111111" } },
  primaryColor: "#111111",
  secondaryColor: null,
  fontId: "cairo",
  storeLanguage: "ar",
  navbarVariant: "default",
  logo: null,
  logoRadius: 8,
  logoSize: 80,
  coverImage: null,
  description: null,
  announcementText: null,
  showStoreName: true,
});

const draftOf = (appearance: Appearance, extra: Partial<StudioDraft> = {}): StudioDraft => ({
  v: 2,
  appearance,
  history: [],
  future: [],
  updatedAt: "2026-10-20T10:00:00.000Z",
  ...extra,
});

describe("liveAppearance", () => {
  it("prefers the theme config preset over the legacy themeId column", () => {
    expect(live.themeConfig.presetId).toBe("riwaq");
  });

  it("fills defaults for a store without settings", () => {
    const a = liveAppearance(null);
    expect(a.themeConfig.presetId).toBe("default");
    expect(a.fontId).toBe("cairo");
    expect(a.showStoreName).toBe(true);
  });
});

describe("readStudioDraft", () => {
  it("ignores the old themeConfig snapshots the column used to hold", () => {
    expect(readStudioDraft({ presetId: "default" })).toBeNull();
    expect(readStudioDraft(null)).toBeNull();
    expect(readStudioDraft("x")).toBeNull();
  });

  it("reads a versioned draft and tolerates missing history", () => {
    const d = readStudioDraft({ v: 2, appearance: live, updatedAt: "2026-10-20T10:00:00.000Z" });
    expect(d?.appearance).toEqual(live);
    expect(d?.history).toEqual([]);
    expect(d?.future).toEqual([]);
  });
});

describe("sameValue", () => {
  it("treats missing keys and undefined/null as equal (stored JSON)", () => {
    expect(sameValue({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(sameValue({ a: null }, {})).toBe(true);
  });

  it("compares arrays by order", () => {
    expect(sameValue(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameValue(["a", "b"], ["b", "a"])).toBe(false);
  });
});

describe("changedAreas", () => {
  it("is empty when the draft equals the live store", () => {
    expect(changedAreas(live, structuredClone(live))).toEqual([]);
  });

  it("names each area that changed", () => {
    const draft = structuredClone(live);
    draft.fontId = "tajawal";
    draft.logo = "https://example.com/logo.png";
    draft.themeConfig.sectionOverrides = { home: { sectionOrder: ["showHero"] } };
    expect(changedAreas(live, draft)).toEqual(["fonts", "sections", "identity"]);
  });

  it("detects a theme switch and color overrides separately", () => {
    const draft = structuredClone(live);
    draft.themeConfig = { presetId: "mada" };
    expect(changedAreas(live, draft)).toEqual(expect.arrayContaining(["theme", "colors"]));
  });
});

describe("studioStatus", () => {
  it("reports no draft without one", () => {
    expect(studioStatus(live, null)).toMatchObject({ hasDraft: false, canUndo: false, canRedo: false, changes: [] });
  });

  it("exposes undo/redo availability from the history stacks", () => {
    const changed = { ...structuredClone(live), fontId: "tajawal" };
    const status = studioStatus(live, draftOf(changed, { history: [live], future: [] }));
    expect(status).toMatchObject({ hasDraft: true, canUndo: true, canRedo: false, changes: ["fonts"] });
  });
});
