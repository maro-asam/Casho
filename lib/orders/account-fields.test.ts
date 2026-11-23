import { describe, expect, it } from "vitest";

import { cleanSelectedFeatures, isPlausiblePlayerId } from "./account-fields";

describe("cleanSelectedFeatures", () => {
  it("keeps size/color and player fields, trimmed", () => {
    expect(cleanSelectedFeatures({ size: " L ", playerId: " 1234567890 ", playerName: "Ahmed  Pro" })).toEqual({
      size: "L",
      playerId: "1234567890",
      playerName: "Ahmed Pro",
    });
  });

  it("drops empty values, odd keys and non-strings", () => {
    expect(cleanSelectedFeatures({ playerId: "   ", "ب": "x", __proto__x: 1, color: 5 })).toBeNull();
    expect(cleanSelectedFeatures(null)).toBeNull();
    expect(cleanSelectedFeatures(["a"])).toBeNull();
  });

  it("strips control and bidi characters and caps the length", () => {
    const cleaned = cleanSelectedFeatures({ playerId: "12‮34\n56", playerName: "x".repeat(200) });
    expect(cleaned?.playerId).toBe("123456");
    expect(cleaned?.playerName).toHaveLength(80);
  });

  it("keeps at most six options", () => {
    const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`k${i}`, "v"]));
    expect(Object.keys(cleanSelectedFeatures(many) ?? {})).toHaveLength(6);
  });
});

describe("isPlausiblePlayerId", () => {
  it("accepts game IDs and rejects junk", () => {
    expect(isPlausiblePlayerId("5123456789")).toBe(true);
    expect(isPlausiblePlayerId("Player#1234")).toBe(true);
    expect(isPlausiblePlayerId("@tiktok.user")).toBe(true);
    expect(isPlausiblePlayerId("12")).toBe(false);
    expect(isPlausiblePlayerId("hello world")).toBe(false);
  });
});
