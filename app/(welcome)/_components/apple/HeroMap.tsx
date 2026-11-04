"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";
import { EGYPT_CELLS, WORLD } from "./world-dots";

/**
 * The hero panorama: the world in dots, laid back to the horizon under the
 * headline, with the merchant's shop in Cairo right below it. Online orders
 * rise out of cities around the world as blue arcs and land on the shop;
 * sales at the till ring out green on the spot. The shop's label carries both
 * channels' icons and pops each sale in its channel's colour — the same
 * colours as the POS + online store sum above.
 *
 * The tilt is a projection done here (no CSS 3D), so the DOM labels share the
 * math. The scale follows the strip's height: phones see a closer view around
 * Cairo, wide screens the whole world. Follows the site's light/dark theme.
 *
 * Cheap on phones: one canvas; the dot world is rendered once per size/theme
 * to an offscreen canvas, so a frame is one drawImage plus a few arcs. Frames
 * run only while the strip is on screen and the tab is visible; DPR is capped
 * at 2. Reduce Motion draws it once. Decorative (aria-hidden).
 */

type LonLat = readonly [number, number];
type CityId = keyof ReturnType<typeof useLandingCopy>["hero"]["map"]["cities"];

const STORE: LonLat = [31.33, 30.06];
const CITIES: Record<CityId, LonLat> = {
  alex: [29.92, 31.2],
  riyadh: [46.72, 24.71],
  jeddah: [39.19, 21.49],
  dubai: [55.27, 25.2],
  kuwait: [47.98, 29.37],
  doha: [51.53, 25.29],
  amman: [35.93, 31.95],
  casablanca: [-7.59, 33.57],
  istanbul: [28.98, 41.01],
  london: [-0.13, 51.51],
  paris: [2.35, 48.86],
  berlin: [13.4, 52.52],
  newyork: [-74.0, 40.71],
  toronto: [-79.38, 43.65],
  saopaulo: [-46.63, -23.55],
  lagos: [3.38, 6.52],
  nairobi: [36.82, -1.29],
  johannesburg: [28.05, -26.2],
  mumbai: [72.88, 19.08],
  kualalumpur: [101.69, 3.14],
  tokyo: [139.69, 35.69],
  sydney: [151.21, -33.87],
};

// What happens, in order, on a loop: an online order from a city, or (no
// city) a sale at the till. Cities off screen or under the text are skipped.
const SEQ: { city?: CityId; amount: number }[] = [
  { city: "dubai", amount: 1250 },
  { amount: 450 },
  { city: "london", amount: 2100 },
  { city: "riyadh", amount: 980 },
  { amount: 220 },
  { city: "newyork", amount: 2600 },
  { city: "kuwait", amount: 1400 },
  { amount: 680 },
  { city: "paris", amount: 1750 },
  { city: "tokyo", amount: 3100 },
  { amount: 350 },
  { city: "jeddah", amount: 760 },
  { city: "toronto", amount: 1900 },
  { amount: 520 },
  { city: "casablanca", amount: 640 },
  { city: "sydney", amount: 2800 },
  { amount: 410 },
  { city: "doha", amount: 1150 },
  { city: "berlin", amount: 1600 },
  { amount: 300 },
  { city: "mumbai", amount: 890 },
  { city: "amman", amount: 700 },
  { amount: 560 },
  { city: "saopaulo", amount: 2300 },
  { city: "istanbul", amount: 1050 },
  { amount: 240 },
  { city: "johannesburg", amount: 1300 },
  { city: "alex", amount: 350 },
  { city: "kualalumpur", amount: 1700 },
  { city: "lagos", amount: 580 },
  { city: "nairobi", amount: 620 },
];

// ---------- Projection ----------
// The map is a plane in degrees (u east, v south of LAT_C), tilted away about
// its horizontal axis and seen in perspective; `a` is height above it. The
// strip shows LAT_TOP..LAT_BOTTOM top to bottom, so its height sets the scale.

const TILT = (46 * Math.PI) / 180;
const COS = Math.cos(TILT);
const SIN = Math.sin(TILT);
const CAM = 150;
const LAT_C = 22;
const LAT_TOP = 72;
const LAT_BOTTOM = -36;

function project(u: number, v: number, a: number) {
  const y = v * COS - a * SIN;
  const z = -v * SIN - a * COS;
  const k = CAM / (z + CAM);
  return [u * k, y * k, k] as const;
}
const YP_TOP = project(0, LAT_C - LAT_TOP, 0)[1];
const YP_BOTTOM = project(0, LAT_C - LAT_BOTTOM, 0)[1];

/** Map point → strip px [x, y, px per degree there], centred on the shop under the headline. */
function toScreen(lon: number, lat: number, a: number, w: number, h: number) {
  const u = ((((lon - STORE[0]) % 360) + 540) % 360) - 180;
  const [x, y, k] = project(u, LAT_C - lat, a);
  const s = h / (YP_BOTTOM - YP_TOP);
  return [w / 2 + x * s, (y - YP_TOP) * s, k * s] as const;
}

const INTRO_MS = 1600;
const EVERY_MS = 1300;
const PING_MS = 900;
const CHIP_MS = 2600;

// Ink per theme. Light ink is darker so it holds up on white.
const INK = {
  dark: { land: "255,255,255", landA: 0.3, coastA: 0.62, seaA: 0.06, blue: "92,138,255", deep: "51,102,255", green: "48,209,88", bloom: 0.28, glow: 0.85 },
  light: { land: "29,29,31", landA: 0.2, coastA: 0.46, seaA: 0.05, blue: "20,71,230", deep: "51,102,255", green: "26,160,70", bloom: 0.14, glow: 0.55 },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Shared surface for the floating label and chips.
const PANEL =
  "bg-white/90 ring-1 ring-black/[0.07] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.22)] dark:bg-[#1c1c1e]/90 dark:ring-white/10 dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]";

type Chip = { id: number; city: CityId; amount: number };
type Sale = { id: number; amount: number; online: boolean };

export default function HeroMap({
  className,
  avoidRef,
}: {
  className?: string;
  /** Text laid over the strip: orders whose chip would land under it are skipped. */
  avoidRef?: React.RefObject<HTMLElement | null>;
}) {
  const m = useLandingCopy().hero.map;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [chips, setChips] = useState<Chip[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = document.createElement("canvas");
    const land = Uint8Array.from(atob(WORLD.bits), (ch) => ch.charCodeAt(0));
    const isLand = (r: number, c: number) => {
      if (r < 0 || r >= WORLD.rows) return false;
      const i = r * WORLD.cols + ((c + WORLD.cols) % WORLD.cols);
      return ((land[i >> 3] >> (i & 7)) & 1) === 1;
    };
    const egypt = new Set(EGYPT_CELLS);
    const themeDark = () => document.documentElement.classList.contains("dark");

    let ink = themeDark() ? INK.dark : INK.light;
    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = true;
    let clock = reduce ? INTRO_MS : 0;
    let last = 0;
    let nextAt = INTRO_MS - 300;
    let seq = 0;
    let uid = 0;
    const timers = new Set<number>();
    const flights: { from: LonLat; t0: number; dur: number; lift: number; amount: number; landed: boolean }[] = [];
    const pulses: { t0: number; at: LonLat; tone: "blue" | "green"; max: number; dur: number }[] = [];

    const at = (p: LonLat, a = 0) => toScreen(p[0], p[1], a, w, h);
    const onStrip = (p: LonLat) => {
      const [x, y] = at(p);
      return x > w * 0.03 && x < w * 0.97 && y > h * 0.04 && y < h * 0.96;
    };

    // Where the overlaid text actually is (its line boxes, not its block),
    // relative to the strip.
    function textBoxes() {
      const text = avoidRef?.current;
      if (!text) return [];
      const origin = wrap!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(text);
      return Array.from(range.getClientRects())
        .filter((rc) => rc.width)
        .map((rc) => ({ l: rc.left - origin.left - 36, t: rc.top - origin.top - 16, r: rc.right - origin.left + 36, b: rc.bottom - origin.top + 16 }));
    }

    /** Would a chip over this city land clear of the text? */
    function chipClear(p: LonLat) {
      const [x, y] = at(p);
      const top = y - 46;
      return textBoxes().every((box) => x + 80 < box.l || x - 80 > box.r || top + 34 < box.t || top > box.b);
    }

    function layout() {
      const rect = wrap!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const c of [canvas!, base]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const b = base.getContext("2d")!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderBase(b);
    }

    // The still world, drawn once per size and theme: land dots (brighter on
    // the coast, Egypt in blue), a sparse sea grid that shows the plane, all
    // fading out toward the horizon and the sides.
    function renderBase(b: CanvasRenderingContext2D) {
      b.clearRect(0, 0, w, h);
      const buckets = new Map<string, number[]>();
      const put = (rgb: string, a: number, x: number, y: number, r: number) => {
        const key = `${rgb}|${(Math.round(a * 50) / 50).toFixed(2)}|${Math.max(0.5, r).toFixed(1)}`;
        let list = buckets.get(key);
        if (!list) buckets.set(key, (list = []));
        list.push(x, y);
      };
      const fade = (x: number, y: number) =>
        smooth(h * 0.02, h * 0.42, y) * smooth(0, w * 0.12, x) * smooth(w, w * 0.88, x) * smooth(h, h * 0.72, y);

      for (let r = 0; r < WORLD.rows; r++) {
        const lat = WORLD.lat0 - r;
        if (lat > LAT_TOP + 2 || lat < LAT_BOTTOM - 4) continue;
        for (let c = 0; c < WORLD.cols; c++) {
          const lon = -180 + c + (r % 2 ? 0.5 : 0) + 0.25;
          const ground = isLand(r, c);
          if (!ground && (r % 2 || c % 2)) continue;
          const [x, y, k] = toScreen(lon, lat, 0, w, h);
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          const f = fade(x, y);
          if (f < 0.02) continue;
          if (!ground) {
            put(ink.land, ink.seaA * f, x, y, k * 0.11);
            continue;
          }
          if (egypt.has(r * WORLD.cols + c)) {
            put(ink.blue, Math.max(0.35, f), x, y, k * 0.2);
            continue;
          }
          const coast = !isLand(r, c - 1) || !isLand(r, c + 1) || !isLand(r - 1, c) || !isLand(r + 1, c);
          put(ink.land, (coast ? ink.coastA : ink.landA) * f, x, y, k * (coast ? 0.18 : 0.16));
        }
      }
      buckets.forEach((list, key) => {
        const [rgb, a, rad] = key.split("|");
        const rr = Number(rad);
        b.fillStyle = `rgba(${rgb},${a})`;
        b.beginPath();
        for (let n = 0; n < list.length; n += 2) {
          b.moveTo(list[n] + rr, list[n + 1]);
          b.arc(list[n], list[n + 1], rr, 0, Math.PI * 2);
        }
        b.fill();
      });

      // Brand light pooled around the shop.
      const [sx, sy, sk] = at(STORE);
      const bloom = b.createRadialGradient(sx, sy, 0, sx, sy, sk * 26);
      bloom.addColorStop(0, `rgba(${ink.deep},${ink.bloom})`);
      bloom.addColorStop(1, `rgba(${ink.deep},0)`);
      b.fillStyle = bloom;
      b.fillRect(0, 0, w, h);

      // Every city an order can come from, as a small steady light.
      for (const city of Object.values(CITIES)) {
        const [x, y, k] = at(city);
        const f = fade(x, y);
        if (f < 0.05) continue;
        b.fillStyle = `rgba(${ink.land},${(0.9 * Math.max(0.4, f)).toFixed(3)})`;
        b.beginPath();
        b.arc(x, y, Math.max(1.4, k * 0.3), 0, Math.PI * 2);
        b.fill();
      }
    }

    /** A point along an order's flight: a parabola over the map from the city to the shop. */
    function flightPoint(f: { from: LonLat; lift: number }, t: number) {
      let du = STORE[0] - f.from[0];
      du = (((du % 360) + 540) % 360) - 180;
      const lon = f.from[0] + du * t;
      const lat = f.from[1] + (STORE[1] - f.from[1]) * t;
      return toScreen(lon, lat, f.lift * 4 * t * (1 - t), w, h);
    }

    /** A ring lying on the map (so: an ellipse). */
    function groundRing(p: LonLat, radius: number, rgb: string, a: number, width = 1.5) {
      if (a <= 0) return;
      const [x, y, k] = at(p);
      const rx = radius * Math.min(1.6, k / 5);
      ctx!.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`;
      ctx!.lineWidth = width;
      ctx!.beginPath();
      ctx!.ellipse(x, y, rx, rx * COS * 0.9, 0, 0, Math.PI * 2);
      ctx!.stroke();
    }

    function glow(x: number, y: number, rad: number, rgb: string, a: number) {
      const g = ctx!.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx!.fillStyle = g;
      ctx!.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    function later(ms: number, fn: () => void) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    }

    function spawn(t: number) {
      const fits = (e: (typeof SEQ)[number]) => !e.city || (onStrip(CITIES[e.city]) && chipClear(CITIES[e.city]));
      let ev = SEQ[seq++ % SEQ.length];
      for (let guard = 0; !fits(ev) && guard < SEQ.length; guard++) ev = SEQ[seq++ % SEQ.length];
      const amount = ev.amount;

      if (ev.city) {
        const id = ++uid;
        const city = ev.city;
        setChips((list) => [...list.slice(-3), { id, city, amount }]);
        later(CHIP_MS + 100, () => setChips((list) => list.filter((chip) => chip.id !== id)));
        const from = CITIES[city];
        let du = STORE[0] - from[0];
        du = (((du % 360) + 540) % 360) - 180;
        const d = Math.hypot(du, STORE[1] - from[1]);
        flights.push({ from, t0: t, dur: Math.min(2600, 1100 + d * 14), lift: Math.min(24, 3 + d * 0.22), amount, landed: false });
        pulses.push({ t0: t, at: from, tone: "blue", max: 14, dur: 800 });
      } else {
        // A sale at the till: green rings on the shop.
        pulses.push({ t0: t, at: STORE, tone: "green", max: 34, dur: 1200 }, { t0: t + 220, at: STORE, tone: "green", max: 22, dur: 1000 });
        setSale({ id: ++uid, amount, online: false });
      }
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const [sx, sy] = at(STORE);

      // Intro: the world lights up outward from the shop.
      if (t < INTRO_MS) {
        const R = easeOut(t / INTRO_MS) * Math.hypot(Math.max(sx, w - sx), Math.max(sy, h - sy) / COS);
        ctx!.save();
        ctx!.beginPath();
        ctx!.ellipse(sx, sy, R, R * COS, 0, 0, Math.PI * 2);
        ctx!.clip();
        ctx!.drawImage(base, 0, 0, w, h);
        ctx!.restore();
        ctx!.strokeStyle = `rgba(${ink.blue},${(0.35 * (1 - t / INTRO_MS)).toFixed(3)})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.ellipse(sx, sy, R, R * COS, 0, 0, Math.PI * 2);
        ctx!.stroke();
      } else {
        ctx!.drawImage(base, 0, 0, w, h);
      }

      // Rings on the ground: an order leaving a city, a sale at the till.
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i];
        const q = (t - pu.t0) / pu.dur;
        if (q < 0) continue;
        if (q >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        groundRing(pu.at, 3 + easeOut(q) * pu.max, ink[pu.tone], 0.9 * (1 - q), 1.6);
      }

      // The shop, breathing.
      const breath = (t % 2400) / 2400;
      groundRing(STORE, 7 + breath * 16, ink.blue, 0.5 * (1 - breath), 1.2);

      // Online orders in flight: a comet over the map, a ping on landing.
      for (let i = flights.length - 1; i >= 0; i--) {
        const f = flights[i];
        const p = (t - f.t0) / f.dur;
        if (p < 1) {
          const e = ease(Math.max(0, p));
          // The whole route, faint, fading as the order lands.
          ctx!.strokeStyle = `rgba(${ink.blue},${(0.2 * (1 - p * p)).toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          for (let k = 0; k <= 32; k++) {
            const [rx, ry] = flightPoint(f, k / 32);
            if (k) ctx!.lineTo(rx, ry);
            else ctx!.moveTo(rx, ry);
          }
          ctx!.stroke();
          const steps = 20;
          const tail = 0.4;
          for (let k = 0; k < steps; k++) {
            const u0 = Math.max(0, e - tail + (tail * k) / steps);
            const u1 = Math.max(0, e - tail + (tail * (k + 1)) / steps);
            if (u1 <= 0) continue;
            const [ax, ay] = flightPoint(f, u0);
            const [bx, by] = flightPoint(f, u1);
            const a = (k + 1) / steps;
            ctx!.strokeStyle = `rgba(${ink.blue},${a.toFixed(3)})`;
            ctx!.lineWidth = 0.6 + a * 2.2;
            ctx!.beginPath();
            ctx!.moveTo(ax, ay);
            ctx!.lineTo(bx, by);
            ctx!.stroke();
          }
          const [hx, hy] = flightPoint(f, e);
          glow(hx, hy, 13, ink.blue, ink.glow);
          ctx!.fillStyle = "#fff";
          ctx!.beginPath();
          ctx!.arc(hx, hy, 2.1, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          if (!f.landed) {
            f.landed = true;
            setSale({ id: ++uid, amount: f.amount, online: true });
          }
          const q = (t - f.t0 - f.dur) / PING_MS;
          if (q >= 1) {
            flights.splice(i, 1);
            continue;
          }
          groundRing(STORE, 6 + easeOut(q) * 30, ink.blue, 0.85 * (1 - q), 1.6);
          glow(sx, sy, 26, ink.blue, 0.5 * (1 - q));
        }
      }

      // The shop's light, on top of everything.
      glow(sx, sy, 16, ink.deep, 0.9);
      ctx!.fillStyle = "#fff";
      ctx!.beginPath();
      ctx!.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx!.fill();
    }

    function tick(now: number) {
      raf = 0;
      if (!w || !h) return;
      clock += Math.min(50, now - (last || now));
      last = now;
      if (!reduce && clock >= nextAt) {
        spawn(clock);
        nextAt = clock + EVERY_MS;
      }
      frame(clock);
      if (!reduce) schedule();
    }

    function schedule() {
      if (!raf && onScreen && document.visibilityState === "visible") raf = requestAnimationFrame(tick);
    }

    function wake() {
      last = 0;
      schedule();
    }

    layout();
    if (reduce) frame(clock);
    else schedule();

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) frame(clock);
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting;
      if (onScreen) wake();
    });
    io.observe(wrap);
    // Theme switch: redraw the still world in the other ink.
    const mo = new MutationObserver(() => {
      const next = themeDark() ? INK.dark : INK.light;
      if (next === ink) return;
      ink = next;
      layout();
      if (reduce) frame(clock);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", wake);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((timer) => window.clearTimeout(timer));
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [avoidRef]);

  const shop = size ? toScreen(STORE[0], STORE[1], 0, size.w, size.h) : null;

  return (
    <div ref={wrapRef} aria-hidden className={cn("relative select-none", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* The shop, west of its pin: both channels, the latest sale popping in its channel's colour. */}
      {shop ? (
        <span
          className={cn("absolute flex items-center gap-2 rounded-full py-1 ps-1 pe-3", PANEL)}
          style={{ left: shop[0], top: shop[1], translate: "calc(-100% - 16px) -50%" }}
        >
          <span className="flex -space-x-1.5">
            <span className="grid size-6 place-items-center rounded-full bg-linear-to-b from-[#34c759] to-[#1a8a3e] text-white ring-2 ring-white sm:size-7 dark:ring-[#1c1c1e]">
              <ScanBarcode className="size-3.5 sm:size-4" strokeWidth={2.2} />
            </span>
            <span className="grid size-6 place-items-center rounded-full bg-linear-to-b from-[#4d7cff] to-[#1447e6] text-white ring-2 ring-white sm:size-7 dark:ring-[#1c1c1e]">
              <Globe className="size-3.5 sm:size-4" strokeWidth={2.2} />
            </span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-(--al-text) sm:text-[13px]">{m.shop}</span>
            <span className="text-[9.5px] text-(--al-muted) sm:text-[11px]">{m.shopSub}</span>
          </span>
          {sale ? (
            <span
              key={sale.id}
              className={cn(
                "al-flash absolute -right-2 -top-3 flex items-center gap-1 rounded-full py-0.5 ps-1 pe-1.5 text-[10px] font-semibold text-white tabular-nums sm:text-[11px]",
                sale.online ? "bg-[#1447e6]" : "bg-[#1a8a3e]",
              )}
              dir="ltr"
            >
              {sale.online ? <Globe className="size-3" strokeWidth={2.4} /> : <ScanBarcode className="size-3" strokeWidth={2.4} />}+{fmt(sale.amount)}
            </span>
          ) : null}
        </span>
      ) : null}

      {/* Where an online order just came from. */}
      {size
        ? chips.map((chip) => {
            const p = CITIES[chip.city];
            const [x, y] = toScreen(p[0], p[1], 0, size.w, size.h);
            return (
              <span key={chip.id} className="absolute" style={{ left: x, top: y }}>
                <span
                  className={cn(
                    "al-mapchip al-mapchip-up absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 ps-1.5 pe-2.5 text-[10.5px] sm:text-[12px]",
                    PANEL,
                  )}
                >
                  <Globe className="size-3 text-[#1447e6] dark:text-[#5c8aff] sm:size-3.5" strokeWidth={2.2} />
                  <span className="text-(--al-muted)">{m.cities[chip.city]}</span>
                  <span className="font-semibold text-(--al-text) tabular-nums" dir="ltr">
                    +{fmt(chip.amount)}
                  </span>
                </span>
              </span>
            );
          })
        : null}
    </div>
  );
}
