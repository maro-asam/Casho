/**
 * Data for the hero's growth board (GrowthBoard.tsx): a made-up store that
 * starts with one order from an Instagram link and grows, column by column,
 * into a brand with a shop and a second branch. Pure and deterministic (a
 * seeded PRNG), so every visit draws the same story and it can be unit tested.
 *
 * Index 0 is the oldest column (the start side of the page), n - 1 is today.
 * Heights are in dots; the shop's dots sit at the bottom of each column.
 */

export type MilestoneId = "start" | "pay" | "shop" | "ship" | "domain" | "branch";

export type Milestone = {
  id: MilestoneId;
  /** Position on the timeline, 0 → 1. */
  at: number;
  /** Lower number = kept first when the board is too narrow for every flag. */
  priority: number;
  /** Which way the flag's text runs from its pole. */
  side: "start" | "end";
};

export const MILESTONES: Milestone[] = [
  { id: "start", at: 0, priority: 0, side: "end" },
  { id: "pay", at: 0.3, priority: 3, side: "start" },
  // Runs toward today: on wide screens the headline sits over its start side.
  { id: "shop", at: 0.52, priority: 1, side: "end" },
  { id: "ship", at: 0.68, priority: 4, side: "start" },
  { id: "domain", at: 0.8, priority: 2, side: "start" },
  { id: "branch", at: 0.9, priority: 1, side: "start" },
];

/** When the shop opens: the first column with shop dots. */
export const SHOP_OPENS = 0.52;

/** How steep the curve is: higher = a flatter start and a steeper end. */
const GROWTH = 3.2;

export type Column = { total: number; shop: number };

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The envelope, 0 → 1: a slow start, then compounding growth. */
export function envelope(t: number) {
  return 0.03 + (0.97 * (Math.exp(GROWTH * t) - 1)) / (Math.exp(GROWTH) - 1);
}

/** The column a milestone sits on, for a board of `n` columns. */
export function milestoneColumn(at: number, n: number) {
  return Math.min(n - 1, Math.max(0, Math.round(at * (n - 1))));
}

/**
 * `n` columns, the tallest (today) exactly `maxRows` dots high; the others
 * stay at or under `maxRows - reserve` (the dots today still gets live). Seasonal
 * bumps (two Ramadans, a White Friday) and ±7% noise keep it from reading as
 * a formula; the columns right after the first order stay tiny.
 */
export function buildColumns(n: number, maxRows: number, reserve = 0, seed = 20261111): Column[] {
  if (n <= 0 || maxRows <= 0) return [];
  // Every earlier column stays at or under where today starts, so today ends tallest.
  const cap = Math.max(1, maxRows - reserve);
  const rand = mulberry32(seed);
  const bump = (t: number, at: number, width: number, gain: number) =>
    gain * Math.exp(-(((t - at) / width) ** 2));

  const cols: Column[] = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 1;
    const seasonal =
      bump(t, 0.24, 0.035, 0.22) + bump(t, 0.61, 0.012, 0.3) + bump(t, 0.72, 0.035, 0.16);
    const noise = (rand() - 0.5) * 0.14;
    let total = Math.round(cap * envelope(t) * (1 + seasonal + noise));
    total = Math.max(1, Math.min(cap, total));
    if (i === n - 1) total = maxRows;

    let shop = 0;
    if (t >= SHOP_OPENS && i < n - 1) {
      const grown = Math.min(1, (t - SHOP_OPENS) / 0.28) ** 0.7;
      const share = 0.14 + 0.2 * grown + (rand() - 0.5) * 0.06;
      shop = Math.max(1, Math.round(total * share));
    } else if (i === n - 1) {
      shop = Math.round(total * 0.32);
    }
    cols.push({ total, shop: Math.min(shop, total - 1) });
  }
  // The first order is a single dot.
  cols[0] = { total: 1, shop: 0 };
  return cols;
}

/** Order counts for the tooltip: about nine orders a dot per week, never round. */
export function ordersFor(col: Column, index: number, stepDays: number) {
  const perDot = 8.6 + ((index * 37) % 11) / 10;
  return Math.max(1, Math.round(col.total * perDot * (stepDays / 7)));
}
