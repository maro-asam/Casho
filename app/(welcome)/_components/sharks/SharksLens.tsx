"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The hero object: a glass lens over the field of businesses building on
 * Casho. Inside it the field is magnified, and at its centre one business is
 * selected in brand blue. On load a scan crosses the field and the lens
 * settles into place; as `progress` goes 0 → 1 (the pinned scroll) the camera
 * moves in — the lens glides to the centre and the magnification grows. The
 * highlight on the glass follows a mouse like a light source.
 *
 * The lens's resting place is `anchorRef` (a square in the layout), so CSS
 * owns the composition. Where the close-up lens ends is published on the
 * parent as `--sk-lens-end` (px from the top) for the caption to sit under.
 * Frames run only while something moves; Reduce Motion draws the resting
 * state once. Decorative only (aria-hidden).
 */

const BLUE = "92, 138, 255";
const DEEP = "51, 102, 255";
const SCAN_MS = 1500;
const LENS_AT = 350;
const LENS_MS = 1400;
const SELECT_AT = 1300;
const RING_MS = 1100;
const PING_EVERY = 4200;
const PING_MS = 1800;
const LEVELS = 24;
const MAX_A = 0.6;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function SharksLens({
  progress,
  anchorRef,
  className,
}: {
  progress: MotionValue<number>;
  anchorRef: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const rtl = getComputedStyle(canvas).direction === "rtl";
    // Light comes from above, leaning to the reading start.
    const restLight = rtl ? -1.15 : -1.99;

    let w = 0;
    let h = 0;
    let start = performance.now();
    let raf = 0;
    let visible = true;
    let p = progress.get();
    let pointer: { x: number; y: number } | null = null;
    let light = restLight;
    let lastPing = 0;
    const buckets: number[][] = Array.from({ length: LEVELS }, () => []);

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // The close-up: centred a little high, leaving room for the caption below.
    function closeup(rest: { r: number }) {
      const r = Math.max(rest.r * 1.05, Math.min(w, h) * (w < 640 ? 0.4 : 0.34));
      return { y: h * (w < 640 ? 0.4 : 0.45), r };
    }

    function anchor() {
      const c = canvas!.getBoundingClientRect();
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a?.width) return { x: w / 2, y: h * 0.7, r: Math.min(w, h) * 0.3 };
      return { x: a.left - c.left + a.width / 2, y: a.top - c.top + a.height / 2, r: a.width / 2 };
    }

    function draw(now: number) {
      if (!w || !h) return false;
      const t = reduce ? Infinity : now - start;
      const mobile = w < 640;
      const gap0 = mobile ? 20 : 26;
      const rest = anchor();

      // Scroll: ease the camera move so it starts and lands softly.
      const e = p * p * (3 - 2 * p);
      const intro = easeOutExpo((t - LENS_AT) / LENS_MS);
      const end = closeup(rest);
      const R = rest.r * Math.pow(end.r / rest.r, e) * (0.9 + 0.1 * intro);
      const cx = rest.x + (w / 2 - rest.x) * e;
      const cy = rest.y + (end.y - rest.y) * e + (1 - intro) * 40;
      const mag = 1.9 + 2.4 * e;
      const tm = Math.tanh(mag);
      const gap = gap0 * (1 + 0.3 * e);
      const size = Math.min(1.1, Math.max(0.65, rest.r / 280)) * (1 + 1.4 * e);

      // Scan: a soft band crossing once, in reading direction.
      const scanning = t < SCAN_MS + 300;
      const s = easeOut(t / SCAN_MS) * 1.25 - 0.12;
      const scan = (x: number) => {
        if (!scanning) return 1;
        const dist = (rtl ? 1 - x / w : x / w) - s;
        return (dist > 0 ? 0.25 : 1) + Math.max(0, 1 - Math.abs(dist) / 0.06) * 3;
      };

      ctx!.clearRect(0, 0, w, h);

      // Brand light pooled under the glass.
      const bloom = ctx!.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.8);
      bloom.addColorStop(0, `rgba(${DEEP},${(0.2 * intro).toFixed(3)})`);
      bloom.addColorStop(1, `rgba(${DEEP},0)`);
      ctx!.fillStyle = bloom;
      ctx!.fillRect(0, 0, w, h);

      // The field. The lattice is anchored on the lens centre, so the
      // selected business stays under the glass while the camera pans.
      for (const b of buckets) b.length = 0;
      const inside: { x: number; y: number; r: number; a: number; rim: boolean }[] = [];
      const i0 = Math.floor(-cx / gap) - 1;
      const i1 = Math.ceil((w - cx) / gap) + 1;
      const j0 = Math.floor(-cy / gap) - 1;
      const j1 = Math.ceil((h - cy) / gap) + 1;
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          if (i === 0 && j === 0) continue;
          const x = cx + i * gap;
          const y = cy + j * gap;
          const dx = x - cx;
          const dy = y - cy;
          const d = Math.hypot(dx, dy);
          const lit = scan(x);
          const fall =
            smoothstep(0, w * 0.1, x) * smoothstep(0, w * 0.1, w - x) * smoothstep(56, h * 0.24, y) * smoothstep(0, h * 0.14, h - y);
          const fieldA = 0.14 * fall * (1 - 0.45 * e) * lit;
          if (d < R) {
            // Convex lens: magnified at the centre, compressed toward the rim.
            const nd = (R * Math.tanh((mag * d) / R)) / tm;
            const k = d > 0.01 ? nd / d : mag / tm;
            const edge = nd / R;
            const glassA = (0.2 + 0.2 * (1 - edge * edge * edge)) * Math.min(1, lit);
            inside.push({
              x: x + dx * (k - 1) * intro,
              y: y + dy * (k - 1) * intro,
              r: 1.2 + (1.25 * Math.pow(k, 0.75) - 1.2) * intro,
              a: fieldA + (glassA - fieldA) * intro,
              rim: edge > 0.84,
            });
          } else if (fieldA > 0.004) {
            buckets[Math.min(LEVELS - 1, Math.round((Math.min(MAX_A, fieldA) / MAX_A) * (LEVELS - 1)))].push(x, y);
          }
        }
      }
      buckets.forEach((b, l) => {
        if (!b.length) return;
        ctx!.fillStyle = `rgba(255,255,255,${((l / (LEVELS - 1)) * MAX_A).toFixed(3)})`;
        ctx!.beginPath();
        for (let n = 0; n < b.length; n += 2) {
          ctx!.moveTo(b[n] + 1.2, b[n + 1]);
          ctx!.arc(b[n], b[n + 1], 1.2, 0, Math.PI * 2);
        }
        ctx!.fill();
      });

      // Glass body: a touch darker than the bloom, brighter at the edge (Fresnel).
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.clip();
      ctx!.fillStyle = `rgba(0,0,0,${(0.55 * intro).toFixed(3)})`;
      ctx!.fillRect(cx - R, cy - R, R * 2, R * 2);
      const body = ctx!.createRadialGradient(cx, cy - R * 0.3, 0, cx, cy, R);
      body.addColorStop(0, `rgba(${DEEP},${(0.12 * intro).toFixed(3)})`);
      body.addColorStop(0.65, `rgba(${DEEP},${(0.04 * intro).toFixed(3)})`);
      body.addColorStop(1, `rgba(${BLUE},${(0.14 * intro).toFixed(3)})`);
      ctx!.fillStyle = body;
      ctx!.fillRect(cx - R, cy - R, R * 2, R * 2);

      for (const d of inside) {
        ctx!.fillStyle = d.rim && intro > 0.5 ? `rgba(170,195,255,${(d.a * 0.8).toFixed(3)})` : `rgba(255,255,255,${d.a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // The selected business: grows into blue, rings out once, then a slow ping.
      let moving = scanning || intro < 1;
      const sel = easeOut((t - SELECT_AT) / 600);
      if (sel < 1) {
        ctx!.fillStyle = `rgba(255,255,255,${(0.4 * (1 - sel)).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 1.2 + 1.3 * intro, 0, Math.PI * 2);
        ctx!.fill();
      }
      if (sel > 0) {
        if (sel < 1) moving = true;
        const hr = 84 * size;
        const halo = ctx!.createRadialGradient(cx, cy, 0, cx, cy, hr);
        halo.addColorStop(0, `rgba(${DEEP},${(0.7 * sel).toFixed(3)})`);
        halo.addColorStop(0.35, `rgba(${DEEP},${(0.22 * sel).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${DEEP},0)`);
        ctx!.fillStyle = halo;
        ctx!.fillRect(cx - hr, cy - hr, hr * 2, hr * 2);
        ctx!.fillStyle = `rgba(${BLUE},${sel.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, (2.5 + 5 * sel) * size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(232,238,255,${(0.95 * sel).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 2.6 * size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.lineWidth = 1;
        ctx!.strokeStyle = `rgba(${BLUE},${(0.45 * sel).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 20 * size, 0, Math.PI * 2);
        ctx!.stroke();

        const ring = (t - SELECT_AT) / RING_MS;
        if (ring > 0 && ring < 1) {
          moving = true;
          ctx!.strokeStyle = `rgba(${BLUE},${(0.65 * (1 - ring)).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(cx, cy, (8 + 56 * easeOut(ring)) * size, 0, Math.PI * 2);
          ctx!.stroke();
        }
        const pk = lastPing ? (now - lastPing) / PING_MS : 0;
        if (pk > 0 && pk < 1) {
          moving = true;
          ctx!.strokeStyle = `rgba(${BLUE},${(0.42 * (1 - pk)).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(cx, cy, (20 + 56 * easeOut(pk)) * size, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      // Specular highlight on the side facing the light.
      if (pointer) {
        const target = Math.atan2(pointer.y - cy, pointer.x - cx);
        const diff = Math.atan2(Math.sin(target - light), Math.cos(target - light));
        light += diff * 0.1;
        if (Math.abs(diff) > 0.002) moving = true;
      } else if (Math.abs(light - restLight) > 0.002) {
        light += Math.atan2(Math.sin(restLight - light), Math.cos(restLight - light)) * 0.08;
        moving = true;
      }
      const lx = Math.cos(light);
      const ly = Math.sin(light);
      const spec = ctx!.createRadialGradient(cx + lx * R * 0.62, cy + ly * R * 0.62, 0, cx + lx * R * 0.62, cy + ly * R * 0.62, R * 0.8);
      spec.addColorStop(0, `rgba(255,255,255,${(0.11 * intro).toFixed(3)})`);
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = spec;
      ctx!.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx!.restore();

      // Rim: bright toward the light, a faint second reflection opposite,
      // and a thin blue fringe just inside the edge.
      if (intro > 0) {
        const rim = ctx!.createLinearGradient(cx + lx * R, cy + ly * R, cx - lx * R, cy - ly * R);
        rim.addColorStop(0, `rgba(255,255,255,${(0.62 * intro).toFixed(3)})`);
        rim.addColorStop(0.5, `rgba(255,255,255,${(0.07 * intro).toFixed(3)})`);
        rim.addColorStop(1, `rgba(255,255,255,${(0.26 * intro).toFixed(3)})`);
        ctx!.lineWidth = 1.5;
        ctx!.strokeStyle = rim;
        ctx!.beginPath();
        ctx!.arc(cx, cy, R, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.lineWidth = 1.5;
        ctx!.strokeStyle = `rgba(${BLUE},${(0.24 * intro).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, R - 3, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.lineWidth = 3;
        ctx!.lineCap = "round";
        ctx!.strokeStyle = `rgba(255,255,255,${(0.12 * intro).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, R - 7, light + Math.PI - 0.55, light + Math.PI + 0.55);
        ctx!.stroke();
      }
      return moving;
    }

    function frame(now: number) {
      raf = 0;
      const moving = draw(now);
      if (visible && moving && !reduce) raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (reduce) draw(performance.now());
      else if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    const publishEnd = () => {
      const end = closeup(anchor());
      canvas.parentElement?.style.setProperty("--sk-lens-end", `${Math.round(end.y + end.r)}px`);
    };

    layout();
    publishEnd();
    kick();

    const ro = new ResizeObserver(() => {
      const [pw, ph] = [w, h];
      layout();
      publishEnd();
      // A real resize jumps to the settled state. Not the observer's first
      // call (it always fires once) or text reflowing beside the lens.
      if (pw && (pw !== w || ph !== h)) start = Math.min(start, performance.now() - SELECT_AT - RING_MS - 500);
      kick();
    });
    ro.observe(canvas);
    // The anchor moves when the text beside it reflows (fonts, language).
    const grid = anchorRef.current?.parentElement;
    if (grid) for (const el of Array.from(grid.children)) ro.observe(el);
    document.fonts?.ready.then(kick).catch(() => {});

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);

    const unsubscribe = progress.on("change", (v) => {
      p = clamp01(v);
      kick();
    });

    const ping = window.setInterval(() => {
      if (reduce || !visible || document.hidden) return;
      if (performance.now() - start < SELECT_AT + RING_MS + 600) return;
      lastPing = performance.now();
      kick();
    }, PING_EVERY);

    // The canvas ignores the pointer (text sits above it); listen on its stage.
    const host = canvas.parentElement;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      kick();
    };
    const onLeave = () => {
      pointer = null;
      kick();
    };
    if (finePointer && !reduce && host) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      unsubscribe();
      window.clearInterval(ping);
      host?.removeEventListener("pointermove", onMove);
      host?.removeEventListener("pointerleave", onLeave);
    };
  }, [progress, anchorRef]);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block h-full w-full", className)} />;
}
