"use client";

import Link from "next/link";
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Boxes, ChevronLeft, ChevronRight, ScanBarcode, ShoppingBag } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import { BrowserFrame, PhoneFrame, PhoneStatusBar, PosReceipt, StorefrontPhone } from "./Devices";

// The real dashboard components (+ recharts) load after the headline paints.
const DashboardScreen = lazy(() => import("./DashboardPreview"));

// Linear map with clamping. Function-form transforms keep framer-motion on the
// JS scroll path (its native ScrollTimeline path mis-tracks pinned sections).
function lerp(v: number, [i0, i1]: [number, number], [o0, o1]: [number, number]) {
  const t = Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));
  return o0 + (o1 - o0) * t;
}
const smooth = (t: number) => t * t * (3 - 2 * t);

const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { stiffness: 80, damping: 20, mass: 0.7 };
const MAX_GIANT = 220;

// Live moments once the product has landed: each pops near the device it
// happened on, stays a few seconds and leaves. The first two are also orders
// arriving in the dashboard. `at` is seconds after load; `depth` is how far
// it drifts with the pointer (nearest layer).
const CHIPS = [
  { icon: ShoppingBag, tone: "bg-[#1447e6]", at: 2.4, depth: 46, desktop: "-top-[7%] inset-e-[0%]", phone: "top-[18%] inset-e-[-38%]" },
  { icon: ScanBarcode, tone: "bg-[#1a8a3e]", at: 3.9, depth: 40, desktop: "bottom-[-5%] inset-s-[12%]", phone: "bottom-[4%] inset-s-[-30%]" },
  { icon: Boxes, tone: "bg-[#e0483a]", at: 5.4, depth: 34, desktop: "top-[40%] inset-e-[24%]", phone: "top-[50%] inset-e-[-42%]" },
];
const CHIP_STAY = 3.2;

/**
 * Where things sit at rest, relative to the dashboard (sizes in % of its
 * width). `tilt` is the resting rotation (+ leans toward the inline end).
 * The lineup positions are measured, not listed (see `measureLineup`).
 */
const LAYOUT = {
  desktop: {
    dash: "w-[min(60cqw,122cqh)]",
    // Share of the giant type's size the product rises into. Latin has
    // descenders the product mustn't hide ("system" would read "svstem").
    overlap: { rtl: 0.42, ltr: 0.18 },
    receipt: { className: "bottom-[-8%] inset-s-[-12%]", width: 0.22, tilt: -7 },
    store: { className: "top-[8%] w-[24%] max-w-[240px] inset-e-[-10%] z-20", tilt: 5 },
  },
  phone: {
    dash: "w-[min(46cqw,42cqh)]",
    overlap: { rtl: 0.22, ltr: 0.12 },
    receipt: { className: "top-[30%] inset-s-[-40%]", width: 0.62, tilt: -6 },
    store: { className: "top-[10%] w-[74%] inset-e-[-44%] -z-10", tilt: 4 },
  },
};
// Room under the lineup for the device names, and the gap between devices.
const LABEL_ROOM = 64;
const ROW_GAP = 0.06;
// The receipt is real-size DOM laid out at this width (so its lines don't
// wrap) and zoomed to `width` × the dashboard's. Zoom, unlike scale, shrinks
// its layout box, so the lineup measures it true.
const RECEIPT_WIDTH = 150;

// Real phone width for the dashboard below the `sm` breakpoint.
const PHONE = { width: 390, height: 844 };
const MAX_DESKTOP_WIDTH = 1440;

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/** Viewport width (0 while server rendering), read the way media queries see it. */
function useViewportWidth() {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 0);
}

/**
 * Sizes the `text` element to span the `box` element exactly (capped by
 * MAX_GIANT and the viewport height), whatever the language or font, and
 * publishes the size on the `host` element as `--giant` so the product can
 * overlap the type by a share of it.
 */
function useFitText(content: string) {
  const text = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLHeadingElement>(null);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = text.current;
    const container = box.current;
    if (!el || !container) return;
    const fit = () => {
      el.style.fontSize = "100px";
      // offsetWidth ignores the transforms the headline animates with.
      const natural = el.offsetWidth;
      if (!natural) return;
      // On phones the claim breaks into two lines, so each gets less height.
      const lines = el.offsetHeight > 160 ? 2 : 1;
      const size = Math.min(MAX_GIANT, window.innerHeight * (lines > 1 ? 0.15 : 0.24), (100 * container.clientWidth) / natural);
      el.style.fontSize = `${size}px`;
      host.current?.style.setProperty("--giant", `${size}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [content]);
  return { text, box, host };
}

/**
 * Launch-poster hero on a dark stage: giant luminous type at the back, the
 * real dashboard floating in front of it, the POS receipt and the storefront
 * phone nearer still, and live moments (orders, a POS sale, the stock
 * updating) popping over them once they land. Each layer drifts with a mouse
 * by its depth. Pinned scroll lets the type go and lines the three devices
 * up, upright and level, each named underneath — one system.
 *
 * The dashboard is laid out at the visitor's own viewport width, so its
 * breakpoints match what a merchant sees on that screen; below `sm` it moves
 * into a phone. Reduce Motion keeps the opening composition, unpinned.
 */
export default function AppleHero() {
  const copy = useLandingCopy();
  const c = copy.hero;
  const { lang } = useLang();
  const rtl = lang === "ar";
  const flip = rtl ? -1 : 1; // logical (inline-end = +) → physical x
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const reduce = !!useReducedMotion();

  const vw = useViewportWidth();
  const phone = vw > 0 && vw < 640;
  const desktopWidth = Math.min(vw, MAX_DESKTOP_WIDTH);
  const desktopHeight = Math.round(desktopWidth * (vw >= 1024 ? 0.625 : 0.75));
  const L = phone ? LAYOUT.phone : LAYOUT.desktop;

  const sectionRef = useRef<HTMLElement>(null);
  const { text: giantRef, box: h1Ref, host: stageRef } = useFitText(c.title2);
  const clusterRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptBodyRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);

  // The lineup, measured from the layout (offset* ignore transforms): the
  // receipt and storefront step out beside the dashboard with an even gap,
  // all three stand on the dashboard's floor, and the row is centred in the
  // stage at the largest size that fits. Offsets are in the dashboard's own
  // (unscaled) space, since the side devices live inside it.
  const row = {
    dashX: useMotionValue(0),
    dashY: useMotionValue(0),
    scale: useMotionValue(1),
    receiptX: useMotionValue(0),
    receiptY: useMotionValue(0),
    storeX: useMotionValue(0),
    storeY: useMotionValue(0),
  };
  useEffect(() => {
    const els = [stageRef.current, clusterRef.current, dashRef.current, receiptRef.current, storeRef.current, receiptBodyRef.current];
    if (els.some((el) => !el)) return;
    const [stage, cluster, dash, receipt, store, receiptBody] = els as HTMLDivElement[];
    const measure = () => {
      const w = dash.offsetWidth;
      const h = dash.offsetHeight;
      if (!w || !h) return;
      // Size the receipt to the dashboard first: the lineup reads its box.
      receiptBody.style.zoom = String((w * L.receipt.width) / RECEIPT_WIDTH);
      const gap = w * ROW_GAP;
      // Receipt on the inline-start side, storefront on the inline-end side.
      const place = (el: HTMLElement, start: boolean) => {
        const onRight = start === rtl;
        const left = onRight ? w + gap : -gap - el.offsetWidth;
        return { x: left - el.offsetLeft, y: h - el.offsetHeight - el.offsetTop };
      };
      const r = place(receipt, true);
      const st = place(store, false);
      row.receiptX.set(r.x);
      row.receiptY.set(r.y);
      row.storeX.set(st.x);
      row.storeY.set(st.y);

      const left = rtl ? store.offsetWidth : receipt.offsetWidth;
      const right = rtl ? receipt.offsetWidth : store.offsetWidth;
      // As large as fits: across the stage, and (tallest device + names) down it.
      const tallest = Math.max(h, receipt.offsetHeight, store.offsetHeight);
      const scale = Math.min(
        1.4,
        (cluster.clientWidth * 0.92) / (w + 2 * gap + left + right),
        (stage.clientHeight * 0.74 - LABEL_ROOM) / tallest,
      );
      row.scale.set(scale);
      row.dashX.set(((left - right) / 2) * scale);
      const centre = cluster.offsetTop + dash.offsetTop + h / 2;
      const groupTop = (stage.clientHeight - (h * scale + LABEL_ROOM)) / 2;
      row.dashY.set(groupTop + (h * scale) / 2 - centre);
    };
    measure();
    const ro = new ResizeObserver(measure);
    els.forEach((el) => ro.observe(el!));
    return () => ro.disconnect();
    // `row` holds stable motion values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtl, vw, L]);

  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // Reduce Motion stays on the opening composition.
  const s = (v: number) => (reduce ? 0 : v);
  // Lineup progress.
  const k = (v: number) => smooth(lerp(s(v), [0.08, 0.7], [0, 1]));

  // Pointer → depth: near layers move more; the type drifts the other way.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const sx = useSpring(pointerX, SPRING);
  const sy = useSpring(pointerY, SPRING);
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce) return;
    pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
    pointerY.set((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  // Type: the far layer. Leaves upward as the lineup begins.
  const typeX = useTransform(sx, (v) => v * -12);
  const typeY = useTransform(() => sy.get() * -8 + lerp(s(p.get()), [0, 0.5], [0, -90]));
  const typeOpacity = useTransform(p, (v) => lerp(s(v), [0.04, 0.38], [1, 0]));
  const typeScale = useTransform(p, (v) => lerp(s(v), [0, 0.5], [1, 1.06]));
  const barOpacity = useTransform(p, (v) => lerp(s(v), [0, 0.18], [1, 0]));
  // Hidden once faded, so invisible links can't take focus or clicks.
  const barVisibility = useTransform(p, (v) => (s(v) > 0.2 ? "hidden" : "visible"));
  const chipsOpacity = useTransform(p, (v) => lerp(s(v), [0, 0.15], [1, 0]));
  const labelOpacity = useTransform(p, (v) => lerp(s(v), [0.62, 0.8], [0, 1]));

  // Dashboard: tilted in space at rest, upright and level in the lineup.
  const dashX = useTransform(() => row.dashX.get() * k(p.get()));
  const dashY = useTransform(() => row.dashY.get() * k(p.get()));
  const dashScale = useTransform(() => 1 + (row.scale.get() - 1) * k(p.get()));
  const dashRotateX = useTransform(() => 9 * (1 - k(p.get())) - sy.get() * 3);
  const dashRotateY = useTransform(() => -8 * flip * (1 - k(p.get())) + sx.get() * 5);
  const dashPX = useTransform(sx, (v) => v * 16);
  const dashPY = useTransform(sy, (v) => v * 10);
  const glareX = useTransform(sx, (v) => `${50 - v * 40}%`);

  // Receipt and storefront: overlapping the dashboard at rest, beside it in the lineup.
  const receiptX = useTransform(() => row.receiptX.get() * k(p.get()));
  const receiptY = useTransform(() => row.receiptY.get() * k(p.get()));
  const receiptRotate = useTransform(p, (v) => L.receipt.tilt * flip * (1 - k(v)));
  const receiptPX = useTransform(sx, (v) => v * 30);
  const receiptPY = useTransform(sy, (v) => v * 18);
  const storeX = useTransform(() => row.storeX.get() * k(p.get()));
  const storeY = useTransform(() => row.storeY.get() * k(p.get()));
  const storeRotate = useTransform(p, (v) => L.store.tilt * flip * (1 - k(v)));
  const storePX = useTransform(sx, (v) => v * 36);
  const storePY = useTransform(sy, (v) => v * 22);

  // The dashboard's own page stays at its top here.
  const screenScroll = useMotionValue(0);
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timers = CHIPS.slice(0, 2).map((chip, i) => window.setTimeout(() => setLive(i + 1), (chip.at + 0.3) * 1000));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduce]);

  const screen = (
    // The screen is "off" until the dashboard has loaded, then switches on.
    <Suspense fallback={<div className="absolute inset-0 bg-[#05070d]" />}>
      <DashboardScreen lang={lang} storeName={copy.mock.storeName} scroll={screenScroll} live={reduce ? 2 : live} />
      <ScreenOn rtl={rtl} />
    </Suspense>
  );

  // Same initial/animate on server and client (so hydration matches); Reduce
  // Motion only makes the entrance instant.
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 36, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: reduce ? { duration: 0 } : { duration: 1.1, delay, ease: EASE },
  });
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 70 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? { duration: 0 } : { duration: 1.4, delay, ease: EASE },
  });

  return (
    <section ref={sectionRef} className="al-dark relative h-[200vh] bg-(--al-bg) motion-reduce:h-auto [@media(max-height:559px)]:h-auto">
      <div
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="sticky top-0 isolate flex h-svh min-h-[560px] flex-col overflow-hidden"
      >
        {/* Stage lights come up on load: a spot on the type, brand light behind the product. */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 1.8, delay: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(60%_55%_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />
          <div className="al-aurora absolute left-1/2 top-[64%] h-[80vmin] w-[120vmin] rounded-full bg-[radial-gradient(closest-side,rgba(51,102,255,0.45),transparent)]" />
          <div className="al-aurora-2 absolute left-[42%] top-[58%] h-[60vmin] w-[80vmin] rounded-full bg-[radial-gradient(closest-side,rgba(20,71,230,0.4),transparent)]" />
        </motion.div>

        {/* Headline: the lead-in, then the giant claim behind the product. */}
        <motion.div
          style={{ x: typeX, y: typeY, opacity: typeOpacity, scale: typeScale }}
          className="al-container-wide relative shrink-0 pt-[clamp(80px,11svh,112px)] text-center"
        >
          <h1 ref={h1Ref}>
            <motion.span {...enter(0.1)} className="block text-[clamp(20px,2.4vw,34px)] font-semibold text-(--al-text)">
              {c.title1}
            </motion.span>
            <span className="sr-only"> {c.title2}</span>
            <motion.span {...enter(0.25)} aria-hidden className="block">
              {/* One line from `sm`; on phones a line per word, each with its own gradient. */}
              <span ref={giantRef} className="inline-block whitespace-nowrap pb-[0.04em] text-[clamp(60px,14vw,200px)]">
                <span className="al-giant hidden sm:inline">{c.title2}</span>
                {c.title2.split(" ").map((word, i) => (
                  <span key={i} className="al-giant block sm:hidden">
                    {word}
                  </span>
                ))}
              </span>
            </motion.span>
          </h1>
        </motion.div>

        {/* Product cluster: a size container, so the devices fit its width and height. */}
        <div
          ref={clusterRef}
          style={{ marginTop: `calc(var(--giant, 160px) * ${-(rtl ? L.overlap.rtl : L.overlap.ltr)})` }}
          className="relative z-10 flex min-h-0 flex-1 justify-center px-[4vw] [container-type:size]"
        >
          {vw > 0 && (
            <motion.div ref={dashRef} style={{ x: dashX, y: dashY, scale: dashScale }} className={cn("relative h-max", L.dash)}>
              {/* Floor light that grounds the product on the stage. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-[14%] left-1/2 h-[26%] w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(92,138,255,0.38),transparent)] blur-2xl"
              />

              {/* Dashboard. Perspective sits on the direct parent of the tilted frame. */}
              <motion.div {...rise(0.45)} className="relative z-10 [perspective:1600px]">
                <motion.div style={{ x: dashPX, y: dashPY, rotateX: dashRotateX, rotateY: dashRotateY }} className="relative">
                  <div className={cn("relative isolate", phone ? "" : "rounded-[14px] shadow-[0_40px_120px_-20px_rgba(51,102,255,0.55)] sm:rounded-[18px]")}>
                    {phone ? (
                      <PhoneFrame width={PHONE.width} height={PHONE.height} screenClassName="bg-transparent">
                        <div className="apple-ui relative flex h-full flex-col bg-background text-foreground">
                          <PhoneStatusBar />
                          <div className="relative min-h-0 flex-1">{screen}</div>
                        </div>
                      </PhoneFrame>
                    ) : (
                      <BrowserFrame width={desktopWidth} height={desktopHeight} className="ring-white/15">
                        {screen}
                      </BrowserFrame>
                    )}
                    {!phone && (
                      <>
                        {/* Light catching the far edge of the glass. */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-[6%] -top-px z-10 h-px bg-linear-to-r from-transparent via-white/70 to-transparent"
                        />
                        {/* A soft glare that slides across the glass with the pointer. */}
                        <motion.span
                          aria-hidden
                          style={{ backgroundPositionX: glareX }}
                          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-[linear-gradient(110deg,transparent_38%,rgba(255,255,255,0.09)_50%,transparent_62%)] bg-size-[250%_100%] motion-reduce:hidden"
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
              <Label opacity={labelOpacity} accent>
                {c.lineup.stock}
              </Label>

              {/* POS receipt */}
              <motion.div
                ref={receiptRef}
                style={{ x: receiptX, y: receiptY, rotate: receiptRotate }}
                className={cn("absolute z-20", L.receipt.className)}
              >
                <motion.div {...rise(0.7)}>
                  <motion.div ref={receiptBodyRef} style={{ x: receiptPX, y: receiptPY, width: RECEIPT_WIDTH }}>
                    <PosReceipt />
                  </motion.div>
                </motion.div>
                <Label opacity={labelOpacity}>{c.lineup.pos}</Label>
              </motion.div>

              {/* Storefront phone */}
              <motion.div ref={storeRef} style={{ x: storeX, y: storeY, rotate: storeRotate }} className={cn("absolute", L.store.className)}>
                <motion.div {...rise(0.8)}>
                  <motion.div style={{ x: storePX, y: storePY }}>
                    <StorefrontPhone />
                  </motion.div>
                </motion.div>
                <Label opacity={labelOpacity}>{c.lineup.store}</Label>
              </motion.div>

              {!reduce && (
                <motion.div style={{ opacity: chipsOpacity }} className="pointer-events-none absolute inset-0 z-30">
                  {CHIPS.map((chip, i) => (
                    <Chip
                      key={i}
                      at={chip.at}
                      icon={chip.icon}
                      tone={chip.tone}
                      title={c.chips[i].title}
                      sub={c.chips[i].sub}
                      className={phone ? chip.phone : chip.desktop}
                      x={sx}
                      y={sy}
                      depth={chip.depth}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* What it is, and what to do: the last thing on the poster. */}
        <motion.div
          style={{ opacity: barOpacity, visibility: barVisibility }}
          className="al-container-wide relative z-20 flex shrink-0 flex-col items-center gap-5 pb-[clamp(20px,4.5svh,44px)] pt-5 text-center md:flex-row md:items-end md:justify-between md:gap-10 md:text-start"
        >
          <motion.p {...enter(0.9)} className="max-w-[460px] text-[15px] leading-relaxed text-(--al-muted) text-pretty sm:text-[17px] md:text-[19px]">
            {c.subtitle}
          </motion.p>
          <motion.div {...enter(1)} className="flex shrink-0 flex-wrap items-center justify-center gap-x-7 gap-y-3">
            <Link href="/register" className="al-btn al-btn-filled">
              {c.cta}
            </Link>
            <Link href="#pricing" className="al-link">
              {c.secondary}
              <Chevron className="size-4" strokeWidth={2} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/** A device's name under it in the lineup. */
function Label({ children, opacity, accent }: { children: string; opacity: MotionValue<number>; accent?: boolean }) {
  return (
    <motion.p
      aria-hidden
      style={{ opacity }}
      className={cn(
        "pointer-events-none absolute left-1/2 top-full mt-[clamp(14px,2.2vw,28px)] w-max -translate-x-1/2 text-[clamp(15px,1.7vw,24px)] font-semibold",
        accent ? "al-gradient-text" : "text-(--al-text)",
      )}
    >
      {children}
    </motion.p>
  );
}

/** The screen switching on: a band of light wipes across in reading direction. */
function ScreenOn({ rtl }: { rtl: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const transition = { duration: 1.1, delay: 0.25, ease: [0.65, 0, 0.35, 1] as const };
  const edge = rtl ? "right" : "left";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[#05070d]"
        initial={{ clipPath: rtl ? "inset(0 0% 0 0)" : "inset(0 0 0 0%)" }}
        animate={{ clipPath: rtl ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" }}
        transition={transition}
      />
      <motion.div
        className="absolute inset-y-0 w-[18%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(120,160,255,0.35)_35%,rgba(255,255,255,0.75)_50%,rgba(120,160,255,0.35)_65%,transparent)] rtl:translate-x-1/2"
        initial={{ [edge]: "0%", opacity: 1 }}
        animate={{ [edge]: "100%", opacity: 0 }}
        transition={{ ...transition, opacity: { duration: 0.35, delay: transition.delay + transition.duration - 0.2 } }}
      />
    </div>
  );
}

/** A live moment: pops in at `at` seconds, stays, leaves. Drifts with the pointer by `depth`. */
function Chip({
  at,
  icon: Icon,
  tone,
  title,
  sub,
  className,
  x,
  y,
  depth,
}: {
  at: number;
  icon: typeof ShoppingBag;
  tone: string;
  title: string;
  sub: string;
  className?: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
}) {
  const px = useTransform(x, (v) => v * depth);
  const py = useTransform(y, (v) => v * depth * 0.6);
  return (
    <motion.div aria-hidden style={{ x: px, y: py }} className={cn("absolute", className)}>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.92 }}
        animate={{ opacity: [0, 1, 1, 0], y: [14, 0, 0, -8], scale: [0.92, 1, 1, 0.98] }}
        transition={{ duration: CHIP_STAY + 0.9, delay: at, times: [0, 0.12, 0.85, 1], ease: "easeOut" }}
        className="flex w-max items-center gap-2.5 rounded-[18px] bg-white/85 py-2 pe-4 ps-2 text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/5 backdrop-blur-xl sm:gap-3 sm:py-2.5 sm:ps-2.5"
      >
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] text-white sm:size-9", tone)}>
          <Icon className="size-4 sm:size-[18px]" strokeWidth={2} />
        </span>
        <span className="leading-tight">
          <span className="block text-[12px] font-semibold sm:text-[13px]">{title}</span>
          <span className="block text-[11px] text-black/55 sm:text-[12px]" dir="auto">
            {sub}
          </span>
        </span>
      </motion.div>
    </motion.div>
  );
}
