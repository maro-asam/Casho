import { describe, it, expect } from "vitest";
import { deriveViewState, entityPercent, emptyEntityProgress, initialProgress, overallPercent, parseProgress, totalRemaining } from "./progress";

describe("import page states (UI)", () => {
  const active = { connectionStatus: "ACTIVE" as const, job: null, preview: "idle" as const };

  it("not connected / connecting", () => {
    expect(deriveViewState({ ...active, connectionStatus: null })).toBe("not_connected");
    expect(deriveViewState({ ...active, connectionStatus: "DISCONNECTED" })).toBe("not_connected");
    expect(deriveViewState({ ...active, connectionStatus: null, connecting: true })).toBe("connecting");
  });

  it("connected → loading preview → preview ready", () => {
    expect(deriveViewState(active)).toBe("connected");
    expect(deriveViewState({ ...active, preview: "loading" })).toBe("loading_preview");
    expect(deriveViewState({ ...active, preview: "ready" })).toBe("preview_ready");
    expect(deriveViewState({ ...active, preview: "error" })).toBe("connected");
  });

  it("importing / paused win over everything (even a broken connection)", () => {
    expect(deriveViewState({ ...active, job: { status: "RUNNING" }, preview: "ready" })).toBe("importing");
    expect(deriveViewState({ ...active, job: { status: "QUEUED" } })).toBe("importing");
    expect(deriveViewState({ ...active, connectionStatus: "NEEDS_RECONNECT", job: { status: "PAUSED" } })).toBe("paused");
  });

  it("completed / completed with warnings, until the merchant starts over", () => {
    expect(deriveViewState({ ...active, job: { status: "COMPLETED" } })).toBe("completed");
    expect(deriveViewState({ ...active, job: { status: "COMPLETED_WITH_ERRORS" } })).toBe("completed_with_warnings");
    expect(deriveViewState({ ...active, job: { status: "COMPLETED" }, resultDismissed: true })).toBe("connected");
    expect(deriveViewState({ ...active, job: { status: "CANCELED" } })).toBe("connected");
  });

  it("needs reconnect", () => {
    expect(deriveViewState({ ...active, connectionStatus: "NEEDS_RECONNECT", job: { status: "COMPLETED" } })).toBe("needs_reconnect");
  });
});

describe("progress math", () => {
  it("weights entities by record count and never shows 100% before done", () => {
    const progress = initialProgress(["COLLECTION", "ORDER"], { COLLECTION: 10, ORDER: 990 });
    progress.COLLECTION = { ...progress.COLLECTION!, processed: 10, done: true };
    progress.ORDER = { ...progress.ORDER!, processed: 495 };
    expect(overallPercent(progress)).toBe(50);
    expect(entityPercent(progress.ORDER!)).toBe(50);
    expect(totalRemaining(progress)).toBe(495);

    progress.ORDER = { ...progress.ORDER!, processed: 990 };
    expect(overallPercent(progress)).toBe(99);
    progress.ORDER.done = true;
    expect(overallPercent(progress)).toBe(100);
  });

  it("re-processed pages (after a crash) never push a bar past 100%", () => {
    expect(entityPercent({ ...emptyEntityProgress(10), processed: 13 })).toBe(99);
  });

  it("parses partial / corrupt JSON safely", () => {
    expect(parseProgress(null)).toEqual({});
    expect(parseProgress({ PRODUCT: { processed: 3 }, BOGUS: {} })).toEqual({ PRODUCT: { ...emptyEntityProgress(), processed: 3 } });
  });
});
