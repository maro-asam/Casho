import { describe, it, expect } from "vitest";
import { MAX_PAUSE_DAYS, activePause, countdownParts, isPaused, pauseInputSchema } from "./pause";

const now = new Date("2026-10-28T12:00:00.000Z");
const later = (ms: number) => new Date(now.getTime() + ms);
const HOUR = 60 * 60 * 1000;

describe("isPaused", () => {
  it("is paused only while the reopen time is ahead", () => {
    expect(isPaused(later(HOUR), now)).toBe(true);
    expect(isPaused(now, now)).toBe(false);
    expect(isPaused(later(-1), now)).toBe(false);
    expect(isPaused(null, now)).toBe(false);
  });
});

describe("activePause", () => {
  const settings = { pausedUntil: later(HOUR), pauseMessage: "  بنجرد المخزن  ", pauseCountdown: false };

  it("returns what the closed page shows", () => {
    expect(activePause(settings, now)).toEqual({ until: later(HOUR).toISOString(), message: "بنجرد المخزن", showCountdown: false });
  });

  it("is null once the time passed, and for a blank message falls back to null", () => {
    expect(activePause({ ...settings, pausedUntil: later(-HOUR) }, now)).toBeNull();
    expect(activePause({ ...settings, pauseMessage: "   " }, now)?.message).toBeNull();
    expect(activePause(null, now)).toBeNull();
  });
});

describe("pauseInputSchema", () => {
  const parse = (input: Record<string, unknown>) => pauseInputSchema(now).safeParse({ showCountdown: true, ...input });

  it("accepts a future time within the limit", () => {
    const r = parse({ until: later(HOUR).toISOString(), message: "" });
    expect(r.success && r.data).toEqual({ until: later(HOUR), message: null, showCountdown: true });
  });

  it("rejects past, too-close and too-far times", () => {
    expect(parse({ until: later(-HOUR).toISOString() }).success).toBe(false);
    expect(parse({ until: later(30 * 1000).toISOString() }).success).toBe(false);
    expect(parse({ until: later((MAX_PAUSE_DAYS + 1) * 24 * HOUR).toISOString() }).success).toBe(false);
    expect(parse({ until: "not a date" }).success).toBe(false);
  });

  it("rejects a long message", () => {
    expect(parse({ until: later(HOUR).toISOString(), message: "x".repeat(281) }).success).toBe(false);
  });
});

describe("countdownParts", () => {
  it("splits the remaining time", () => {
    expect(countdownParts(later(((2 * 24 + 3) * 60 * 60 + 4 * 60 + 5) * 1000), now)).toEqual({ done: false, days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("is done and zero once over", () => {
    expect(countdownParts(later(-5000), now)).toEqual({ done: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});
