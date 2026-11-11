"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import { MILESTONES, buildColumns, milestoneColumn, ordersFor, type Column, type MilestoneId } from "./growth-board-data";

/**
 * The hero's growth board: a dot matrix the width of the screen where every
 * lit dot is orders. It starts as one dot under the call to action (the first
 * order, from an Instagram link) and grows toward the far side into a tall
 * column: today. Online orders are blue, the shop's sales ink, stacked in the
 * same columns — one business, one place. Flags mark what the store added on
 * the way (online payments, the shop, shipping, a domain, a second branch).
 *
 * Once built, an order drops into today's column every few seconds and
 * today's numbers tick. Hovering (or tapping) a column shows its numbers.
 *
 * The dots are one canvas (the unlit matrix is pre-rendered once per size and
 * theme); flags, today's card and the axis are DOM. Frames are drawn only
 * while something moves. Off screen, in a hidden tab or with Reduce Motion,
 * nothing is scheduled.
 */

const BUILD_DELAY = 260; // ms before the first column lights
const BUILD_SPAN = 2400; // ms for the wavefront to cross the board
const ROW_DELAY = 12; // ms between two dots of one column
const DOT_IN = 380;
const LIVE_EVERY = 2600;
const DROP_MS = 640;
const RIPPLE_MS = 820;

// Today's orders as they come in.
const SCRIPT = [
  { shop: false, amount: 450 },
  { shop: true, amount: 250 },
  { shop: false, amount: 900 },
  { shop: false, amount: 350 },
  { shop: true, amount: 450 },
  { shop: false, amount: 700 },
];

type Geo = {
  W: number;
  H: number;
  p: number; // dot pitch
  r: number; // dot radius
  rtl: boolean;
  size: "wide" | "mid" | "narrow";
  base: number; // y of the bottom row's lower edge
  gridCols: number;
  ghostRows: number;
  offset: number;
  c0: number; // grid column of the first (oldest) data column
  n: number;
  maxRows: number;
  live: number; // dots today's column still gets after the build
  stepDays: number;
  data: Column[];
};

type Rect = { x0: number; x1: number; y0: number; y1: number };
type Flag = { id: MilestoneId; i: number; x: number; poleTop: number; colTop: number; dir: 1 | -1; delay: number };
type Overlay = {
  flags: Flag[];
  card: Omit<Flag, "id"> | null;
  start: { x: number; label: string; dir: 1 | -1 } | null;
  years: { x: number; label: string }[];
  legend: { x: number; dir: 1 | -1 };
};
type Colors = { ghost: string; a: string; b: string; c: string; shop: string; halo: string; ring: string };

const TYPE = {
  wide: { name: 14, note: 12.5, cardName: 13, money: 26, small: 12.5, gap: 10, pole: 34, clear: 12, ceiling: 92, top: 206 },
  mid: { name: 13.5, note: 12, cardName: 12.5, money: 23, small: 12, gap: 9, pole: 28, clear: 10, ceiling: 8, top: 150 },
  narrow: { name: 12.5, note: 11, cardName: 12, money: 20, small: 11, gap: 8, pole: 22, clear: 8, ceiling: 8, top: 100 },
} as const;

const fmt = (n: number) => n.toLocaleString("en-US");
const fill = (t: string, vars: Record<string, string | number>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const hit = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function geometry(W: number, H: number, rtl: boolean): Geo | null {
  if (W < 120 || H < 160) return null;
  const size = W >= 1024 ? "wide" : W >= 640 ? "mid" : "narrow";
  const p = size === "wide" ? 13 : size === "mid" ? 11.5 : 10;
  const axis = size === "narrow" ? 34 : 40;
  const base = H - axis;
  const gridCols = Math.floor(W / p);
  const offset = (W - gridCols * p) / 2;
  // The data starts under the headline's edge and, on wide screens, runs past
  // the page container toward the screen edge; the matrix fills the rest.
  const startEdge = Math.max(16, (W - 1200) / 2 + 22);
  const endEdge = size === "wide" ? Math.max(28, (W - 1360) / 2) : startEdge;
  const c0 = Math.ceil((startEdge - offset) / p - 0.5);
  const c1 = Math.floor((W - endEdge - offset) / p - 0.5);
  const n = c1 - c0 + 1;
  const maxRows = Math.max(6, Math.floor((base - TYPE[size].top) / p));
  const live = size === "wide" ? 4 : 3;
  const stepDays = Math.min(21, Math.max(7, Math.round(540 / Math.max(1, n - 1))));
  return {
    W,
    H,
    p,
    r: p * 0.27,
    rtl,
    size,
    base,
    gridCols,
    ghostRows: Math.floor(base / p),
    offset,
    c0,
    n,
    maxRows,
    live,
    stepDays,
    data: buildColumns(n, maxRows, live),
  };
}

const xGrid = (g: Geo, col: number) => {
  const xs = g.offset + (col + 0.5) * g.p;
  return g.rtl ? g.W - xs : xs;
};
const xAt = (g: Geo, i: number) => xGrid(g, g.c0 + i);
const yOf = (g: Geo, row: number) => g.base - (row + 0.5) * g.p;
const topOf = (g: Geo, total: number) => yOf(g, total - 1) - g.r;
const frac = (g: Geo, i: number) => (g.n > 1 ? i / (g.n - 1) : 1) ** 0.92;
const columnStart = (g: Geo, i: number) => BUILD_DELAY + BUILD_SPAN * frac(g, i);
const buildEnd = (g: Geo) => columnStart(g, g.n - 1) + g.maxRows * ROW_DELAY + DOT_IN;
const dateOf = (g: Geo, i: number) => new Date(Date.now() - (g.n - 1 - i) * g.stepDays * 86_400_000);

function readColors(el: HTMLElement): Colors {
  const s = getComputedStyle(el);
  const v = (k: string) => s.getPropertyValue(k).trim();
  return {
    ghost: v("--gb-ghost"),
    a: v("--gb-online-a"),
    b: v("--gb-online-b"),
    c: v("--gb-online-c"),
    shop: v("--gb-shop"),
    halo: v("--gb-halo"),
    ring: v("--gb-ring"),
  };
}

/** The unlit matrix, rendered once per size and theme, fading toward the headline. */
function renderGhost(g: Geo, col: Colors, dpr: number) {
  const cv = document.createElement("canvas");
  cv.width = Math.round(g.W * dpr);
  cv.height = Math.round(g.H * dpr);
  const x = cv.getContext("2d");
  if (!x) return cv;
  x.scale(dpr, dpr);
  const path = new Path2D();
  const rr = g.r * 0.8;
  for (let c = 0; c < g.gridCols; c++) {
    const px = xGrid(g, c);
    for (let row = 0; row < g.ghostRows; row++) {
      const py = yOf(g, row);
      path.moveTo(px + rr, py);
      path.arc(px, py, rr, 0, Math.PI * 2);
    }
  }
  x.fillStyle = col.ghost;
  x.fill(path);
  x.globalCompositeOperation = "destination-in";
  const v = x.createLinearGradient(0, 0, 0, g.base);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(g.size === "wide" ? 0.3 : 0.12, "rgba(0,0,0,0.3)");
  v.addColorStop(1, "rgba(0,0,0,1)");
  x.fillStyle = v;
  x.fillRect(0, 0, g.W, g.H);
  if (g.size === "wide") {
    // Quieter on the headline's side.
    const from = g.rtl ? g.W : 0;
    const h = x.createLinearGradient(from, 0, g.W - from, 0);
    h.addColorStop(0, "rgba(0,0,0,0.3)");
    h.addColorStop(0.6, "rgba(0,0,0,1)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = h;
    x.fillRect(0, 0, g.W, g.H);
  }
  return cv;
}

/**
 * Where the headline block actually has ink: one rect per line of text and
 * per button, padded, relative to the board. (The block itself is as wide as
 * its longest line and would keep flags off half the board.)
 */
function inkRects(root: HTMLElement, origin: DOMRect): Rect[] {
  const out: Rect[] = [];
  const add = (r: DOMRect, pad: number) => {
    if (r.width > 0 && r.height > 0) {
      out.push({ x0: r.left - origin.left - pad, x1: r.right - origin.left + pad, y0: r.top - origin.top - pad, y1: r.bottom - origin.top + pad });
    }
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) add(r, 18);
  }
  root.querySelectorAll("a, button").forEach((el) => add(el.getBoundingClientRect(), 18));
  return out;
}

export default function GrowthBoard({
  className,
  avoidRef,
}: {
  className?: string;
  /** An element (the headline block) flags must not cover. */
  avoidRef?: RefObject<HTMLElement | null>;
}) {
  const c = useLandingCopy().grow.board;
  const { lang } = useLang();
  const rtl = lang === "ar";
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<Geo | null>(null);
  const colorsRef = useRef<Colors | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [today, setToday] = useState({
    sales: 12450,
    orders: 31,
    gain: null as null | { n: number; amount: number; shop: boolean },
  });

  // Everything the frame loop reads lives here, out of React state.
  const anim = useRef({
    t0: 0, // build start (performance.now); 0 = not started
    built: false,
    reduced: false,
    dpr: 1,
    ghost: null as HTMLCanvasElement | null,
    grad: null as CanvasGradient | null,
    reserved: 0, // today's slots already given to a dropping order
    landed: 0,
    liveShop: [] as boolean[],
    drops: [] as { row: number; shop: boolean; t0: number }[],
    ripples: [] as { row: number; shop: boolean; t0: number }[],
    hover: null as number | null,
    raf: 0,
    step: 0,
  });

  const onBuilt = useRef<() => void>(() => {});

  const draw = useCallback((now: number): boolean => {
    const g = geoRef.current;
    const col = colorsRef.current;
    const cv = canvasRef.current;
    const a = anim.current;
    const ctx = cv?.getContext("2d");
    if (!g || !col || !ctx) return false;
    ctx.setTransform(a.dpr, 0, 0, a.dpr, 0, 0);
    ctx.clearRect(0, 0, g.W, g.H);
    if (a.ghost) ctx.drawImage(a.ghost, 0, 0, g.W, g.H);
    if (!a.t0 && !a.reduced) return false;

    const t = now - a.t0;
    const building = !a.built;
    const hov = a.hover;
    // One path per colour, and a dimmed pair while a column is hovered.
    const paths = { on: new Path2D(), shop: new Path2D(), onDim: new Path2D(), shopDim: new Path2D() };
    const halo = new Path2D();
    const dark = col.halo !== "" && col.halo !== "transparent";

    for (let i = 0; i < g.n; i++) {
      const d = g.data[i];
      const x = xAt(g, i);
      const last = i === g.n - 1;
      const lit = last ? d.total - g.live + a.landed : d.total;
      const start = columnStart(g, i);
      const dim = hov !== null && hov !== i;
      for (let row = 0; row < lit; row++) {
        let rad = g.r;
        if (building) {
          const k = (t - start - row * ROW_DELAY) / DOT_IN;
          if (k <= 0) break;
          if (k < 1) rad = g.r * easeOut(k);
        }
        const shop = last && row >= d.total - g.live ? a.liveShop[row - (d.total - g.live)] : row < d.shop;
        const y = yOf(g, row);
        const path = shop ? (dim ? paths.shopDim : paths.shop) : dim ? paths.onDim : paths.on;
        path.moveTo(x + rad, y);
        path.arc(x, y, rad, 0, Math.PI * 2);
        if (dark && !shop && !dim) {
          halo.moveTo(x + rad * 2, y);
          halo.arc(x, y, rad * 2, 0, Math.PI * 2);
        }
      }
    }

    if (dark) {
      ctx.fillStyle = col.halo;
      ctx.fill(halo);
    }
    const online = a.grad ?? col.b;
    ctx.fillStyle = online;
    ctx.fill(paths.on);
    ctx.fillStyle = col.shop;
    ctx.fill(paths.shop);
    if (hov !== null) {
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = online;
      ctx.fill(paths.onDim);
      ctx.fillStyle = col.shop;
      ctx.fill(paths.shopDim);
      ctx.globalAlpha = 1;
    }

    // Orders dropping into today's column, from the foot of its flag.
    const xLast = xAt(g, g.n - 1);
    const from = topOf(g, g.maxRows) - 18;
    a.drops = a.drops.filter((d) => {
      const k = (now - d.t0) / DROP_MS;
      if (k >= 1) {
        a.landed = Math.min(g.live, a.landed + 1);
        a.ripples.push({ row: d.row, shop: d.shop, t0: now });
        return false;
      }
      const y = from + (yOf(g, d.row) - from) * k * k;
      ctx.fillStyle = d.shop ? col.shop : col.c;
      for (let s = 2; s >= 0; s--) {
        ctx.globalAlpha = Math.min(1, k * 5) * (s === 0 ? 1 : s === 1 ? 0.3 : 0.12);
        ctx.beginPath();
        ctx.arc(xLast, y - s * g.r * 1.6 * (0.4 + k), g.r * (1 - s * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return true;
    });
    a.ripples = a.ripples.filter((r) => {
      const k = (now - r.t0) / RIPPLE_MS;
      if (k >= 1) return false;
      ctx.globalAlpha = 0.55 * (1 - k);
      ctx.strokeStyle = r.shop ? col.shop : col.ring;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(xLast, yOf(g, r.row), g.r * (1.2 + 2.4 * easeOut(k)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return true;
    });

    if (building && t >= buildEnd(g)) {
      a.built = true;
      window.setTimeout(() => onBuilt.current(), 0);
    }
    return (building && !a.built) || a.drops.length > 0 || a.ripples.length > 0;
  }, []);

  const requestFrame = useCallback(() => {
    const a = anim.current;
    if (a.raf) return;
    const frame = (now: number) => {
      a.raf = 0;
      if (draw(now)) a.raf = requestAnimationFrame(frame);
    };
    a.raf = requestAnimationFrame(frame);
  }, [draw]);

  // Size, theme and layout of the overlay.
  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;
    const a = anim.current;
    a.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = document.createElement("canvas").getContext("2d");
    const family = () => getComputedStyle(host).fontFamily;
    const textW = (text: string, size: number, weight: number) => {
      if (!measure) return text.length * size * 0.55;
      measure.font = `${weight} ${size}px ${family()}`;
      return measure.measureText(text).width;
    };

    const paint = () => {
      const g = geoRef.current;
      const col = colorsRef.current;
      if (!g || !col) return;
      a.ghost = renderGhost(g, col, a.dpr);
      const ctx = cv.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(xAt(g, 0), 0, xAt(g, g.n - 1), 0);
        grad.addColorStop(0, col.a);
        grad.addColorStop(0.55, col.b);
        grad.addColorStop(1, col.c);
        a.grad = grad;
      }
      requestFrame();
    };

    const place = (g: Geo): Overlay => {
      const T = TYPE[g.size];
      const placed: Rect[] = [];
      const avoid = avoidRef?.current;
      if (avoid) placed.push(...inkRects(avoid, host.getBoundingClientRect()));

      const flagAt = (i: number, side: "start" | "end", w: number, h: number) => {
        const x = xAt(g, i);
        const colTop = topOf(g, g.data[i].total) - 4;
        // +1 runs the text to the right of the pole.
        const dir: 1 | -1 = (side === "start") === g.rtl ? 1 : -1;
        const x0 = dir > 0 ? x + T.gap : x - T.gap - w;
        const x1 = x0 + w;
        let under = colTop;
        for (let j = 0; j < g.n; j++) {
          const xj = xAt(g, j);
          if (xj + g.p >= x0 && xj - g.p <= x1) under = Math.min(under, topOf(g, g.data[j].total));
        }
        const poleTop = Math.min(colTop - T.pole, under - T.clear - h);
        const label = { x0, x1, y0: poleTop - 4, y1: poleTop + h };
        const pole = { x0: x - 4, x1: x + 4, y0: poleTop, y1: colTop };
        if (x0 < 8 || x1 > g.W - 8 || poleTop < T.ceiling) return null;
        if (placed.some((r) => hit(r, label) || hit(r, pole))) return null;
        placed.push(label, pole);
        const delay = (columnStart(g, i) + g.data[i].total * ROW_DELAY + 120) / 1000;
        return { i, x, poleTop, colTop, dir, delay };
      };

      // Today's card first; it's the point of the drawing.
      const cardH = T.cardName * 1.45 + T.money * 1.3 + T.small * 1.45;
      const cardW =
        Math.max(
          textW(c.today, T.cardName, 600) + 18,
          textW(fill(c.money, { amount: "99,999" }), T.money, 700),
          textW(fill(c.orders, { n: 999 }), T.small, 400),
        ) + 64; // room for the "+450" that flashes beside the total
      const card = flagAt(g.n - 1, "start", cardW, cardH);

      const flagH = (T.name + T.note) * 1.45;
      const flags: Flag[] = [];
      for (const m of [...MILESTONES].sort((x, y) => x.priority - y.priority)) {
        const copy = c.milestones[m.id];
        const w = Math.max(textW(copy.name, T.name, 600), textW(copy.note, T.note, 400)) + 2;
        const i = milestoneColumn(m.at, g.n);
        if (i === g.n - 1) continue;
        const f = flagAt(i, m.side, w, flagH);
        if (f) flags.push({ id: m.id, ...f });
      }

      // The axis: where the story starts, each new year, and the legend at today.
      const locale = g.rtl ? "ar-EG-u-nu-latn" : "en-US";
      const month = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
      const startDir: 1 | -1 = g.rtl ? -1 : 1; // the start label runs inward
      const years: Overlay["years"] = [];
      let lastEdge = xAt(g, 0) + startDir * (textW(month.format(dateOf(g, 0)), 11.5, 400) + 30);
      for (let i = 1; i < g.n; i++) {
        const y = dateOf(g, i).getFullYear();
        if (y === dateOf(g, i - 1).getFullYear()) continue;
        const x = xAt(g, i);
        const clear = startDir > 0 ? x - 20 > lastEdge : x + 20 < lastEdge;
        const legendRoom = Math.abs(xAt(g, g.n - 1) - x) > 190;
        if (clear && legendRoom) {
          years.push({ x, label: String(y) });
          lastEdge = x + startDir * 30;
        }
      }

      return {
        flags,
        card,
        start: { x: xAt(g, 0), label: month.format(dateOf(g, 0)), dir: startDir },
        years,
        legend: { x: xAt(g, g.n - 1), dir: (-startDir) as 1 | -1 },
      };
    };

    const resize = () => {
      const W = host.clientWidth;
      const H = host.clientHeight;
      const prev = geoRef.current;
      if (prev && prev.W === W && prev.H === H && prev.rtl === rtl) return;
      const g = geometry(W, H, rtl);
      geoRef.current = g;
      setGeo(g);
      if (!g) return;
      a.dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * a.dpr);
      cv.height = Math.round(H * a.dpr);
      a.drops = [];
      a.reserved = Math.min(a.reserved, g.live);
      a.landed = Math.min(a.landed, a.reserved);
      if (a.reduced) {
        a.built = true;
        a.reserved = a.landed = g.live;
        a.liveShop = Array.from({ length: g.live }, (_, k) => k % 3 === 1);
      }
      if (!colorsRef.current) colorsRef.current = readColors(host);
      setOverlay(place(g));
      paint();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    // Flags are measured with the real font once it has loaded.
    document.fonts?.ready.then(() => {
      if (geoRef.current) setOverlay(place(geoRef.current));
    });

    // The theme toggle flips a class on <html>.
    const mo = new MutationObserver(() => {
      colorsRef.current = readColors(host);
      paint();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(a.raf);
      a.raf = 0;
    };
  }, [rtl, avoidRef, c, requestFrame]);

  // Build on first sight; afterwards today's orders keep coming while visible.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const a = anim.current;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    let onScreen = false;
    let loop: number | undefined;

    const land = (ev: (typeof SCRIPT)[number]) =>
      setToday((s) => ({
        sales: s.sales + ev.amount,
        orders: s.orders + 1,
        gain: { n: (s.gain?.n ?? 0) + 1, amount: ev.amount, shop: ev.shop },
      }));

    const tick = () => {
      const g = geoRef.current;
      if (!g) return;
      const ev = SCRIPT[a.step++ % SCRIPT.length];
      const now = performance.now();
      if (a.reserved < g.live) {
        const slot = a.reserved++;
        a.liveShop[slot] = ev.shop;
        a.drops.push({ row: g.maxRows - g.live + slot, shop: ev.shop, t0: now });
        later(() => land(ev), DROP_MS);
      } else {
        a.ripples.push({ row: g.maxRows - 1, shop: ev.shop, t0: now });
        land(ev);
      }
      requestFrame();
    };

    const live = () => a.built && !a.reduced && onScreen && document.visibilityState === "visible";
    const sync = () => {
      if (live() && loop === undefined) {
        loop = window.setInterval(() => (live() ? tick() : stop()), LIVE_EVERY);
      } else if (!live()) stop();
    };
    const stop = () => {
      window.clearInterval(loop);
      loop = undefined;
    };
    onBuilt.current = () => later(() => (live() ? (tick(), sync()) : sync()), 500);

    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen && !a.t0) {
          // With Reduce Motion the board is drawn whole on resize; t0 just marks it shown.
          a.t0 = performance.now();
          setStarted(true);
          if (!a.reduced) requestFrame();
        }
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stop();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [requestFrame]);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const g = geoRef.current;
    const host = hostRef.current;
    if (!g || !host || !anim.current.built) return;
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const i = Math.floor(((g.rtl ? g.W - x : x) - g.offset) / g.p) - g.c0;
    let next: number | null = null;
    if (i >= 0 && i < g.n && y >= topOf(g, g.data[i].total) - 60 && y <= g.base + 12) next = i;
    if (next !== anim.current.hover) {
      anim.current.hover = next;
      setHover(next);
      requestFrame();
    }
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || anim.current.hover === null) return;
    anim.current.hover = null;
    setHover(null);
    requestFrame();
  };

  const T = geo ? TYPE[geo.size] : TYPE.wide;
  const vars = {
    "--gb-name": `${T.name}px`,
    "--gb-note": `${T.note}px`,
    "--gb-card-name": `${T.cardName}px`,
    "--gb-money": `${T.money}px`,
    "--gb-small": `${T.small}px`,
    "--gb-gap": `${T.gap}px`,
  } as CSSProperties;

  let tip: { x: number; y: number; date: string; value: string } | null = null;
  if (geo && hover !== null && hover < geo.n) {
    const col = geo.data[hover];
    const orders = ordersFor(col, hover, geo.stepDays);
    const month = new Intl.DateTimeFormat(rtl ? "ar-EG-u-nu-latn" : "en-US", { month: "long", year: "numeric" });
    tip = {
      x: Math.min(geo.W - 92, Math.max(92, xAt(geo, hover))),
      y: topOf(geo, col.total) - 14,
      date: hover === geo.n - 1 ? c.now : month.format(dateOf(geo, hover)),
      value: col.shop
        ? fill(c.tip, { n: fmt(orders), p: Math.round((col.shop / col.total) * 100) })
        : fill(c.tipOnline, { n: fmt(orders) }),
    };
  }

  return (
    <div
      ref={hostRef}
      className={cn("gb relative", started && "is-on", className)}
      style={vars}
      onPointerMove={pick}
      onPointerDown={pick}
      onPointerLeave={leave}
    >
      <p className="sr-only">{c.caption}</p>
      <canvas ref={canvasRef} aria-hidden className="gb-canvas absolute inset-0 size-full" />

      {geo && overlay ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {overlay.flags.map((f) => (
            <div
              key={f.id}
              className="gb-flag"
              data-dir={f.dir > 0 ? "r" : "l"}
              style={{ left: f.x, top: f.poleTop, height: f.colTop - f.poleTop, "--d": `${f.delay}s` } as CSSProperties}
            >
              <span className="gb-pole" />
              <span className="gb-text">
                <span className="gb-name">{c.milestones[f.id].name}</span>
                <span className="gb-note">{c.milestones[f.id].note}</span>
              </span>
            </div>
          ))}

          {overlay.card ? (
            <div
              className="gb-flag gb-card"
              data-dir={overlay.card.dir > 0 ? "r" : "l"}
              style={
                {
                  left: overlay.card.x,
                  top: overlay.card.poleTop,
                  height: overlay.card.colTop - overlay.card.poleTop,
                  "--d": `${overlay.card.delay}s`,
                } as CSSProperties
              }
            >
              <span className="gb-pole" />
              <span className="gb-text">
                <span className="gb-card-name">
                  <span className="gb-live" />
                  {c.today}
                </span>
                <span className="gb-money">
                  <span className="gb-mask">
                    <span key={today.sales} className="gb-roll">
                      {fill(c.money, { amount: fmt(today.sales) })}
                    </span>
                  </span>
                  {today.gain ? (
                    <span key={today.gain.n} className="gb-gain" data-shop={today.gain.shop || undefined} dir="ltr">
                      +{fmt(today.gain.amount)}
                    </span>
                  ) : null}
                </span>
                <span className="gb-small">
                  <span key={today.orders} className="gb-roll">
                    {fill(c.orders, { n: today.orders })}
                  </span>
                </span>
              </span>
            </div>
          ) : null}

          <div className="gb-axis" style={{ top: geo.base + 8 }}>
            {overlay.start ? (
              <span className="gb-tick gb-tick-start" data-dir={overlay.start.dir > 0 ? "r" : "l"} style={{ left: overlay.start.x }}>
                {overlay.start.label}
              </span>
            ) : null}
            {overlay.years.map((y) => (
              <span key={y.label} className="gb-tick gb-tick-year" style={{ left: y.x }}>
                {y.label}
              </span>
            ))}
            <span className="gb-legend" data-dir={overlay.legend.dir > 0 ? "r" : "l"} style={{ left: overlay.legend.x }}>
              <span className="gb-key" data-k="online">
                {c.online}
              </span>
              <span className="gb-key" data-k="shop">
                {c.shop}
              </span>
            </span>
          </div>

          {tip ? (
            <div className="gb-tip" style={{ left: tip.x, top: tip.y }}>
              <span className="gb-tip-date">{tip.date}</span>
              <span className="gb-tip-value">{tip.value}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
