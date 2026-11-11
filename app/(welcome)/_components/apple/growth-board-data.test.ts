import { describe, expect, it } from "vitest";
import { MILESTONES, SHOP_OPENS, buildColumns, envelope, milestoneColumn, ordersFor } from "./growth-board-data";

describe("growth board data", () => {
  it("starts with a single online order and ends with today as the tallest column", () => {
    const cols = buildColumns(77, 42, 4);
    expect(cols).toHaveLength(77);
    expect(cols[0]).toEqual({ total: 1, shop: 0 });
    expect(cols[76].total).toBe(42);
    for (const col of cols.slice(0, -1)) expect(col.total).toBeLessThanOrEqual(38);
  });

  it("is deterministic", () => {
    expect(buildColumns(34, 17, 3)).toEqual(buildColumns(34, 17, 3));
  });

  it("has no shop sales before the shop opens, and some after", () => {
    const n = 60;
    const cols = buildColumns(n, 30, 4);
    cols.forEach((col, i) => {
      const t = i / (n - 1);
      if (t < SHOP_OPENS) expect(col.shop).toBe(0);
      else expect(col.shop).toBeGreaterThan(0);
      expect(col.shop).toBeLessThan(col.total);
    });
  });

  it("grows: the last quarter is far taller than the first", () => {
    const cols = buildColumns(80, 40, 4);
    const avg = (a: number, b: number) => cols.slice(a, b).reduce((s, c) => s + c.total, 0) / (b - a);
    expect(avg(60, 80)).toBeGreaterThan(avg(0, 20) * 5);
    expect(envelope(0)).toBeCloseTo(0.03);
    expect(envelope(1)).toBeCloseTo(1);
  });

  it("places milestones on the board and counts orders", () => {
    for (const m of MILESTONES) {
      const i = milestoneColumn(m.at, 50);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(50);
    }
    expect(ordersFor({ total: 10, shop: 3 }, 5, 7)).toBeGreaterThan(80);
  });

  it("handles empty boards", () => {
    expect(buildColumns(0, 10)).toEqual([]);
    expect(buildColumns(10, 0)).toEqual([]);
  });
});
