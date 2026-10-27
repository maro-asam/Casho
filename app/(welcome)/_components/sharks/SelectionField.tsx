"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The Casho Sharks motif: a quiet grid of dots (every business building on
 * Casho). A scan passes over it once — discovery — and a few dots are
 * selected in brand blue. Idle, a selected dot sends a slow ping now and then,
 * and on a mouse the field brightens under the pointer like a lens.
 *
 * Canvas, not DOM: thousands of dots stay cheap. Frames run only while
 * something is moving and the field is on screen. Reduce Motion draws the
 * final state once.
 *
 * Decorative only (aria-hidden): it represents no data.
 */

type Variant = "field" | "single";

// Fractional positions of selected dots — kept clear of the centered text.
const SELECTED: Record<Variant, { desktop: [number, number][]; mobile: [number, number][] }> = {
  field: {
    desktop: [
      [0.1, 0.24],
      [0.86, 0.18],
      [0.2, 0.8],
      [0.74, 0.84],
      [0.93, 0.56],
      [0.05, 0.6],
      [0.62, 0.12],
    ],
    mobile: [
      [0.14, 0.14],
      [0.84, 0.1],
      [0.88, 0.9],
      [0.12, 0.88],
    ],
  },
  single: { desktop: [[0.5, 0.2]], mobile: [[0.5, 0.14]] },
};

const BLUE = "92, 138, 255";
const SCAN_MS = 1700;
const SELECT_AT = 1250;
const SELECT_STAGGER = 150;
const RING_MS = 1000;
const PING_EVERY = 3600;
const PING_MS = 1600;
const LENS = 140;

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export default function SelectionField({
  variant = "field",
  className,
  style,
}: {
  variant?: Variant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const rtl = getComputedStyle(canvas).direction === "rtl";

    let w = 0;
    let h = 0;
    let gap = 26;
    let dots: { x: number; y: number }[] = [];
    let selected: { x: number; y: number; at: number }[] = [];
    let start = performance.now();
    let raf = 0;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    let lensFade = 0;
    let lastPing = 0;
    let pingIndex = 0;

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mobile = w < 640;
      gap = mobile ? 20 : 26;
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;
      const ox = (w - (cols - 1) * gap) / 2;
      const oy = (h - (rows - 1) * gap) / 2;
      dots = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push({ x: ox + c * gap, y: oy + r * gap });

      const spots = SELECTED[variant][mobile ? "mobile" : "desktop"];
      selected = spots.map(([fx, fy], i) => {
        // Mirror for RTL so the composition reads the same way.
        const x = rtl ? 1 - fx : fx;
        const c = Math.round((x * w - ox) / gap);
        const r = Math.round((fy * h - oy) / gap);
        return { x: ox + c * gap, y: oy + r * gap, at: SELECT_AT + i * SELECT_STAGGER };
      });
    }

    function draw(now: number) {
      const t = reduce ? Infinity : now - start;
      ctx!.clearRect(0, 0, w, h);

      // Scan: a soft vertical band crossing once, in reading direction.
      const scanning = t < SCAN_MS + 300;
      const s = easeOut(t / SCAN_MS) * 1.2 - 0.1;
      const lens = pointer && lensFade > 0.01 ? pointer : null;

      ctx!.fillStyle = "rgba(255,255,255,0.13)";
      ctx!.beginPath();
      const special: { x: number; y: number; a: number }[] = [];
      for (const d of dots) {
        let a = 0.13;
        if (scanning) {
          const nx = rtl ? 1 - d.x / w : d.x / w;
          const dist = nx - s;
          if (dist > 0) a = 0.035; // not discovered yet
          a += Math.max(0, 1 - Math.abs(dist) / 0.07) * 0.45;
        }
        if (lens) {
          const dd = Math.hypot(d.x - lens.x, d.y - lens.y);
          if (dd < LENS) a += Math.pow(1 - dd / LENS, 2) * 0.42 * lensFade;
        }
        if (a === 0.13) {
          ctx!.moveTo(d.x + 1.2, d.y);
          ctx!.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
        } else special.push({ x: d.x, y: d.y, a });
      }
      ctx!.fill();
      for (const d of special) {
        ctx!.fillStyle = `rgba(255,255,255,${Math.min(0.75, d.a).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Selected dots: grow into blue, ring out once, keep a faint halo.
      let moving = scanning || !!lens;
      selected.forEach((p, i) => {
        const k = easeOut((t - p.at) / 500);
        if (k <= 0) return;
        if (k < 1) moving = true;
        ctx!.fillStyle = `rgba(${BLUE},${(0.35 + 0.65 * k).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.2 + 2.3 * k, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.lineWidth = 1;
        ctx!.strokeStyle = `rgba(${BLUE},${(0.28 * k).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx!.stroke();

        const ring = (t - p.at) / RING_MS;
        if (ring > 0 && ring < 1) {
          moving = true;
          ctx!.strokeStyle = `rgba(${BLUE},${(0.6 * (1 - ring)).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 3.5 + 22 * easeOut(ring), 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Idle ping, one dot at a time.
        if (!reduce && i === pingIndex && lastPing) {
          const pk = (now - lastPing) / PING_MS;
          if (pk > 0 && pk < 1) {
            moving = true;
            ctx!.strokeStyle = `rgba(${BLUE},${(0.45 * (1 - pk)).toFixed(3)})`;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, 9 + 26 * easeOut(pk), 0, Math.PI * 2);
            ctx!.stroke();
          }
        }
      });
      return moving;
    }

    function frame(now: number) {
      raf = 0;
      if (pointer === null && lensFade > 0) lensFade = Math.max(0, lensFade - 0.06);
      else if (pointer && lensFade < 1) lensFade = Math.min(1, lensFade + 0.12);
      const moving = draw(now);
      if (visible && (moving || lensFade > 0)) raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!raf && visible && !reduce) raf = requestAnimationFrame(frame);
    };

    layout();
    if (reduce) draw(performance.now());
    else kick();

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) draw(performance.now());
      else {
        // Skip the intro on resize — only the first view gets the scan.
        start = Math.min(start, performance.now() - SCAN_MS - SELECT_AT - 1000);
        draw(performance.now());
      }
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);

    const ping = window.setInterval(() => {
      if (reduce || !visible || document.hidden || !selected.length) return;
      if (performance.now() - start < SELECT_AT + selected.length * SELECT_STAGGER + RING_MS) return;
      pingIndex = (pingIndex + 1) % selected.length;
      lastPing = performance.now();
      kick();
    }, PING_EVERY);

    // The canvas ignores the pointer (text sits above it); listen on its section.
    const host = canvas.closest("section") ?? canvas.parentElement;
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
      window.clearInterval(ping);
      host?.removeEventListener("pointermove", onMove);
      host?.removeEventListener("pointerleave", onLeave);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block h-full w-full", className)} style={style} />;
}
