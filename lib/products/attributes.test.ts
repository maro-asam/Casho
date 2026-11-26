import { describe, expect, it } from "vitest";
import { readProductAttributes } from "./attributes";

describe("readProductAttributes", () => {
  it("keeps clean key/value rows in order", () => {
    expect(
      readProductAttributes([
        { key: " المنشأ ", value: "إثيوبيا" },
        { key: "الارتفاع", value: "1900   م" },
      ]),
    ).toEqual([
      { key: "المنشأ", value: "إثيوبيا" },
      { key: "الارتفاع", value: "1900 م" },
    ]);
  });

  it("drops anything that isn't a filled string pair, and repeated keys", () => {
    expect(
      readProductAttributes([null, "x", { key: "a" }, { key: "", value: "b" }, { key: "c", value: 5 }, { key: "d", value: "1" }, { key: "d", value: "2" }]),
    ).toEqual([{ key: "d", value: "1" }]);
  });

  it("tolerates a missing or odd column", () => {
    expect(readProductAttributes(null)).toEqual([]);
    expect(readProductAttributes({ key: "a", value: "b" })).toEqual([]);
  });

  it("caps rows and lengths", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ key: `k${i}`, value: "v".repeat(500) }));
    const out = readProductAttributes(many);
    expect(out).toHaveLength(16);
    expect(out[0].value).toHaveLength(200);
  });
});
