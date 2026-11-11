// Generates app/(welcome)/_components/apple/hero-line-geometry.ts — the
// landing hero's "one line" drawing: the Casho mark (an outlined arrow) drawn
// as two lanes. The online store's lane is the arrow's upper edge and comes in
// from the left; the shop's lane is the lower edge and rises from below. They
// meet at the tail, run side by side through three shared stations (stock,
// orders, customers) and close at the tip (today's sales).
//
// Run: node scripts/gen-hero-line.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../app/(welcome)/_components/apple/hero-line-geometry.ts", import.meta.url));

/* ---------- Tunables ---------- */

const W = 760;
const H = 600;
// The mark's centerline: tail → peak → dip → head base. Angles follow the logo.
const CENTER = [v(176, 452), v(392, 246), v(462, 344), v(620, 180)];
const HEAD_DIR = v(110, -130);
const HALF = 27; // half the distance between the two lanes
const HEAD_HALF = 92; // half the arrowhead's base
const HEAD_LEN = 124; // arrowhead base → tip
const R_BODY = 16; // corner radius along the body
const R_HEAD = 6; // corner radius at the head's corners
const LEAD = 32; // straight run behind the tail before the lanes split
const ONLINE_FROM_X = -40; // the online lane fades in from here (left)
const SHOP_FROM_Y = 740; // the shop lane fades in from here (below)
const ONLINE_STATION_X = 80;
const SHOP_STATION_Y = 566;
const RUNGS = [
  { id: "stock", seg: 0, t: 0.55 },
  { id: "orders", seg: 1, t: 0.5 },
  { id: "customers", seg: 2, t: 0.5 },
];

// Entrance: both lanes draw from their origins to the tip.
const DRAW_DELAY = 0.25; // s
const DRAW = 1.6; // s
const DRAW_EASE = [0.65, 0, 0.35, 1];
// A live pulse: from its station to the tip.
const PULSE = 2600; // ms
const PULSE_EASE = [0.4, 0, 0.3, 1];

/* ---------- Vectors ---------- */

function v(x, y) {
  return { x, y };
}
const add = (a, b) => v(a.x + b.x, a.y + b.y);
const sub = (a, b) => v(a.x - b.x, a.y - b.y);
const mul = (a, k) => v(a.x * k, a.y * k);
const len = (a) => Math.hypot(a.x, a.y);
const unit = (a) => mul(a, 1 / len(a));
const normal = (a) => v(-a.y, a.x); // up-right segment → points down-right
const lerp = (a, b, t) => add(a, mul(sub(b, a), t));
const r1 = (n) => Math.round(n * 10) / 10;
const pt = (p) => ({ x: r1(p.x), y: r1(p.y) });

/* ---------- Lanes ---------- */

const dirs = CENTER.slice(1).map((p, i) => unit(sub(p, CENTER[i])));
const normals = dirs.map(normal);

// Offset the centerline by k with mitred corners.
function offset(k) {
  return CENTER.map((p, i) => {
    if (i === 0) return add(p, mul(normals[0], k));
    if (i === CENTER.length - 1) return add(p, mul(normals.at(-1), k));
    const m = unit(add(normals[i - 1], normals[i]));
    const cos = m.x * normals[i - 1].x + m.y * normals[i - 1].y;
    return add(p, mul(m, k / cos));
  });
}

const upper = offset(-HALF);
const lower = offset(HALF);
const base = CENTER.at(-1);
const hv = unit(HEAD_DIR);
const hp = normal(hv);
const tip = add(base, mul(hv, HEAD_LEN));
const c1 = add(base, mul(hp, -HEAD_HALF));
const c2 = add(base, mul(hp, HEAD_HALF));

const uBend = sub(upper[0], mul(dirs[0], LEAD));
const lBend = sub(lower[0], mul(dirs[0], LEAD));
const onlinePts = [v(ONLINE_FROM_X, uBend.y), uBend, ...upper, c1, tip];
const shopPts = [v(lBend.x, SHOP_FROM_Y), lBend, ...lower, c2, tip];
const radii = (n) => [0, R_BODY, ...Array(n).fill(R_BODY), R_HEAD, 0];

// Polyline with rounded corners → SVG path + pieces for measuring.
function rounded(pts, rs) {
  let d = `M${r1(pts[0].x)} ${r1(pts[0].y)}`;
  const pieces = [];
  let cur = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const r = rs[i] || 0;
    if (i === pts.length - 1 || r === 0) {
      d += `L${r1(p.x)} ${r1(p.y)}`;
      pieces.push({ a: cur, b: p });
      cur = p;
      continue;
    }
    const next = pts[i + 1];
    const rr = Math.min(r, len(sub(p, cur)) / 2, len(sub(next, p)) / 2);
    const a = sub(p, mul(unit(sub(p, cur)), rr));
    const b = add(p, mul(unit(sub(next, p)), rr));
    d += `L${r1(a.x)} ${r1(a.y)}Q${r1(p.x)} ${r1(p.y)} ${r1(b.x)} ${r1(b.y)}`;
    pieces.push({ a: cur, b: a }, { a, c: p, b });
    cur = b;
  }
  return { d, pieces };
}

// Length along the path of the point nearest to `target`.
function measure(pieces) {
  const samples = [{ s: 0, p: pieces[0].a }];
  let total = 0;
  for (const pc of pieces) {
    const steps = pc.c ? 32 : 1;
    let prev = pc.a;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const p = pc.c
        ? v(
            (1 - t) ** 2 * pc.a.x + 2 * (1 - t) * t * pc.c.x + t * t * pc.b.x,
            (1 - t) ** 2 * pc.a.y + 2 * (1 - t) * t * pc.c.y + t * t * pc.b.y,
          )
        : lerp(pc.a, pc.b, t);
      total += len(sub(p, prev));
      samples.push({ s: total, p });
      prev = p;
    }
  }
  const at = (target) => {
    let best = { dist: Infinity, s: 0 };
    for (let i = 1; i < samples.length; i++) {
      const A = samples[i - 1].p;
      const AB = sub(samples[i].p, A);
      const L2 = AB.x * AB.x + AB.y * AB.y || 1;
      const t = Math.max(0, Math.min(1, ((target.x - A.x) * AB.x + (target.y - A.y) * AB.y) / L2));
      const dist = len(sub(target, add(A, mul(AB, t))));
      if (dist < best.dist) best = { dist, s: samples[i - 1].s + (samples[i].s - samples[i - 1].s) * t };
    }
    return best.s;
  };
  return { total, at };
}

const online = rounded(onlinePts, radii(upper.length));
const shop = rounded(shopPts, radii(lower.length));
const mOnline = measure(online.pieces);
const mShop = measure(shop.pieces);

const rungs = RUNGS.map(({ id, seg, t }) => {
  const p = lerp(CENTER[seg], CENTER[seg + 1], t);
  const n = normals[seg];
  return { id, p, n, a: add(p, mul(n, -HALF)), b: add(p, mul(n, HALF)) };
});

const onlineStation = v(ONLINE_STATION_X, uBend.y);
const shopStation = v(lBend.x, SHOP_STATION_Y);

/* ---------- Timing ---------- */

// Time (0–1) at which a cubic-bezier easing reaches `progress`.
function timeAt([x1, y1, x2, y2], progress) {
  const bez = (t, p1, p2) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, y1, y2) < progress) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, x1, x2);
}

const r2 = (n) => Math.round(n * 100) / 100;
const drawAt = (m, s) => r2(DRAW_DELAY + DRAW * timeAt(DRAW_EASE, s / m.total));

function lane(m, station, rungEnd) {
  const start = m.at(station);
  const stops = [...rungs.map((r) => m.at(r[rungEnd])), m.total];
  return {
    length: r1(m.total),
    start: r1(start),
    // ms after a pulse leaves its station that it reaches each rung, then the tip.
    hits: stops.map((s) => Math.round(PULSE * timeAt(PULSE_EASE, (s - start) / (m.total - start)))),
  };
}

// Labels hang off the corner nearest their station, metro-map style, so the
// box always grows away from the lines whatever size the text renders at.
// Anchor = which corner/edge of the label sits on the point (viewBox units):
// "br" bottom-right, "tl" top-left, "t" top-centre, "b" bottom-centre, "l" left-middle.
const CAP = 15; // rung half-thickness (its round cap)
const GAP = 12;
const beyond = (p, dir, k) => add(p, mul(dir, k));
const labels = {
  stock: { ...pt(beyond(rungs[0].a, mul(rungs[0].n, -1), CAP + GAP)), anchor: "br" },
  orders: { ...pt(add(CENTER[2], v(-2, 66))), anchor: "t" },
  customers: { ...pt(beyond(rungs[2].b, rungs[2].n, CAP + GAP)), anchor: "tl" },
  online: { ...pt(add(onlineStation, v(0, 30))), anchor: "t" },
  shop: { ...pt(add(shopStation, v(30, 0))), anchor: "l" },
  tip: { ...pt(v(tip.x - 58, tip.y - 22)), anchor: "b" },
};

const geometry = {
  w: W,
  h: H,
  online: {
    d: online.d,
    ...lane(mOnline, onlineStation, "a"),
    fade: [pt(onlinePts[0]), pt(v(ONLINE_STATION_X - 6, uBend.y))],
  },
  shop: {
    d: shop.d,
    ...lane(mShop, shopStation, "b"),
    fade: [pt(shopPts[0]), pt(v(lBend.x, SHOP_STATION_Y + 6))],
  },
  rungs: rungs.map((r) => ({ id: r.id, a: pt(r.a), b: pt(r.b) })),
  stations: { online: pt(onlineStation), shop: pt(shopStation), tip: pt(tip) },
  labels,
  // Seconds after the drawing starts at which it reaches each element.
  reveal: {
    online: drawAt(mOnline, mOnline.at(onlineStation)),
    shop: drawAt(mShop, mShop.at(shopStation)),
    rungs: rungs.map((r) => Math.max(drawAt(mOnline, mOnline.at(r.a)), drawAt(mShop, mShop.at(r.b)))),
    tip: r2(DRAW_DELAY + DRAW),
  },
  draw: { delay: DRAW_DELAY, duration: DRAW, ease: DRAW_EASE },
  pulse: { duration: PULSE, ease: PULSE_EASE },
};

const src = `// Generated by scripts/gen-hero-line.mjs — edit the script, not this file.
// The hero's "one line": the Casho mark drawn as two lanes (online + shop).

export const HERO_LINE = ${JSON.stringify(geometry, null, 2)} as const;

export type HeroLane = "online" | "shop";
export type HeroLabel = keyof typeof HERO_LINE.labels;
`;

writeFileSync(OUT, src);
console.log(`wrote ${OUT}`);
