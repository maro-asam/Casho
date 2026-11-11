"use client";

import { memo, useCallback, useEffect, useReducer, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";
import { HERO_LINE as G, type HeroLabel, type HeroLane } from "./hero-line-geometry";

/**
 * The hero's drawing: the Casho mark — an outlined arrow — drawn by two lanes.
 * The online store's lane comes in from the side and becomes the arrow's upper
 * edge; the shop's lane rises from below and becomes the lower edge. They meet
 * at the tail and run side by side through the stations both of them share
 * (stock, orders, customers) to the tip: today's sales.
 *
 * Once drawn, a sale or an order leaves its station every few seconds as a
 * pulse; each station it passes updates (stock −qty, orders +1, a new customer
 * for online orders) and the tip adds the amount. Clicking a station sends one.
 *
 * Geometry and timings come from scripts/gen-hero-line.mjs. The lanes and the
 * pulses are CSS animations on stroke-dashoffset; JS only schedules events and
 * flips the numbers. Off screen, in a hidden tab or with Reduce Motion, nothing
 * is scheduled.
 */

const INTERVAL = 3300; // ms between two events
const FIRST = G.reveal.tip * 1000 + 350;
const MAX_IN_FLIGHT = 4;
const START = { stock: 48, orders: 23, customers: 312, total: 12450 };

// A repeating day: who sells, how much, how many pieces.
const SCRIPT: { lane: HeroLane; amount: number; qty: number }[] = [
  { lane: "shop", amount: 450, qty: 1 },
  { lane: "online", amount: 900, qty: 2 },
  { lane: "online", amount: 450, qty: 1 },
  { lane: "shop", amount: 250, qty: 1 },
  { lane: "shop", amount: 450, qty: 1 },
  { lane: "online", amount: 700, qty: 1 },
];

type Pulse = { id: number; lane: HeroLane; amount: number; qty: number };
type State = {
  stock: number;
  orders: number;
  customers: number;
  total: number;
  pulses: Pulse[];
  // Per rung: how many times it was hit, and by which lane (restarts the flash).
  hits: { n: number; lane: HeroLane }[];
  gain: { n: number; amount: number } | null;
  // The event a station is announcing, if any.
  say: Record<HeroLane, number | null>;
};
type Action =
  | { type: "depart"; pulse: Pulse }
  | { type: "hit"; pulse: Pulse; at: number }
  | { type: "quiet"; lane: HeroLane; id: number }
  | { type: "done"; id: number };

const initial: State = {
  ...START,
  pulses: [],
  hits: G.rungs.map(() => ({ n: 0, lane: "online" as HeroLane })),
  gain: null,
  say: { online: null, shop: null },
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "depart":
      return { ...s, pulses: [...s.pulses, a.pulse], say: { ...s.say, [a.pulse.lane]: a.pulse.id } };
    case "quiet":
      return s.say[a.lane] === a.id ? { ...s, say: { ...s.say, [a.lane]: null } } : s;
    case "done":
      return { ...s, pulses: s.pulses.filter((p) => p.id !== a.id) };
    case "hit": {
      const { pulse, at } = a;
      if (at === G.rungs.length) {
        return { ...s, total: s.total + pulse.amount, gain: { n: (s.gain?.n ?? 0) + 1, amount: pulse.amount } };
      }
      const hits = s.hits.map((h, i) => (i === at ? { n: h.n + 1, lane: pulse.lane } : h));
      const id = G.rungs[at].id;
      if (id === "stock") {
        // A quiet restock once the shelf runs low.
        const left = s.stock - pulse.qty;
        return { ...s, hits, stock: left < 6 ? START.stock : left };
      }
      if (id === "orders") return { ...s, hits, orders: s.orders + 1 };
      return { ...s, hits, customers: pulse.lane === "online" ? s.customers + 1 : s.customers };
    }
  }
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fill = (t: string, vars: Record<string, string | number>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const at = (p: { x: number; y: number }): CSSProperties => ({
  left: `${(p.x / G.w) * 100}%`,
  top: `${(p.y / G.h) * 100}%`,
});

export default function HeroLine({ className }: { className?: string }) {
  const c = useLandingCopy().hero.line;
  const [s, dispatch] = useReducer(reducer, initial);
  const stageRef = useRef<HTMLDivElement>(null);
  const timers = useRef(new Set<number>());
  const nextId = useRef(1);
  const step = useRef(0);
  const inFlight = useRef(0);
  const live = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  // Sends one event down its lane and schedules what it touches on the way.
  const send = useCallback(
    (lane?: HeroLane) => {
      if (inFlight.current >= MAX_IN_FLIGHT) return;
      let i = step.current;
      if (lane) while (SCRIPT[i % SCRIPT.length].lane !== lane) i++;
      step.current = i + 1;
      const pulse: Pulse = { id: nextId.current++, ...SCRIPT[i % SCRIPT.length] };
      const hits = G[pulse.lane].hits;
      inFlight.current++;
      dispatch({ type: "depart", pulse });
      hits.forEach((ms, k) => later(() => dispatch({ type: "hit", pulse, at: k }), ms));
      later(() => dispatch({ type: "quiet", lane: pulse.lane, id: pulse.id }), hits[G.rungs.length - 1] + 500);
      // The trail has faded out by its end; a timer (not animationend) always cleans it up.
      later(() => {
        inFlight.current = Math.max(0, inFlight.current - 1);
        dispatch({ type: "done", id: pulse.id });
      }, G.pulse.duration + 120);
    },
    [later],
  );

  // The loop: runs only while the stage is on screen and the tab is visible.
  const loop = useRef<number | undefined>(undefined);
  const schedule = useCallback(
    (ms: number) => {
      window.clearTimeout(loop.current);
      loop.current = window.setTimeout(function tick() {
        if (!live.current) {
          loop.current = undefined;
          return;
        }
        send();
        loop.current = window.setTimeout(tick, INTERVAL);
      }, ms);
    },
    [send],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.on = "";
      return;
    }
    let onScreen = false;
    let started = false;
    const sync = () => {
      const was = live.current;
      live.current = started && onScreen && document.visibilityState === "visible";
      if (live.current && !was && loop.current === undefined) schedule(700);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (!started && e.intersectionRatio >= 0.2) {
          // The drawing starts once it's in view; the first event waits for it to finish.
          started = true;
          el.dataset.on = "";
          live.current = document.visibilityState === "visible";
          schedule(FIRST);
          return;
        }
        sync();
      },
      { threshold: [0, 0.2] },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    const pending = timers.current;
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearTimeout(loop.current);
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, [schedule]);

  const tryLane = (lane: HeroLane) => {
    send(lane);
    if (live.current) schedule(INTERVAL);
  };

  const sayFor = (lane: HeroLane) => {
    const id = s.say[lane];
    const p = id ? s.pulses.find((x) => x.id === id) : undefined;
    return p ? fill(lane === "shop" ? c.sale : c.order, { amount: fmt(p.amount) }) : null;
  };

  const vars = {
    "--hl-draw": `${G.draw.duration}s`,
    "--hl-draw-delay": `${G.draw.delay}s`,
    "--hl-draw-ease": `cubic-bezier(${G.draw.ease.join(",")})`,
    "--hl-pulse": `${G.pulse.duration}ms`,
    "--hl-pulse-ease": `cubic-bezier(${G.pulse.ease.join(",")})`,
  } as CSSProperties;

  return (
    <div ref={stageRef} className={cn("hl-stage relative w-full", className)} style={vars}>
      <p className="sr-only">{c.caption}</p>
      <div aria-hidden className="absolute inset-0">
        <div className="hl-grid" />
        <svg viewBox={`0 0 ${G.w} ${G.h}`} className="absolute inset-0 size-full overflow-visible">
          <Lanes />
          <g>
            {s.pulses.map((p) => (
              <PulseTrail key={p.id} lane={p.lane} />
            ))}
          </g>
          {G.rungs.map((r, i) => (
            <g key={r.id} className="hl-show" style={{ "--t": `${G.reveal.rungs[i]}s` } as CSSProperties}>
              <line x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y} className="hl-rung-edge" />
              <line
                key={s.hits[i].n}
                x1={r.a.x}
                y1={r.a.y}
                x2={r.b.x}
                y2={r.b.y}
                data-lane={s.hits[i].lane}
                className={cn("hl-rung-fill", s.hits[i].n > 0 && "is-hit")}
              />
            </g>
          ))}
          {s.gain ? (
            <circle key={s.gain.n} cx={G.stations.tip.x} cy={G.stations.tip.y} r={26} className="hl-ripple" />
          ) : null}
        </svg>

        <Label
          id="stock"
          name={c.stock}
          value={fill(c.stockValue, { n: s.stock })}
          valueKey={s.stock}
          t={G.reveal.rungs[0]}
        />
        <Label
          id="orders"
          name={c.orders}
          value={fill(c.ordersValue, { n: s.orders })}
          valueKey={s.orders}
          t={G.reveal.rungs[1]}
        />
        <Label
          id="customers"
          name={c.customers}
          value={fill(c.customersValue, { n: fmt(s.customers) })}
          valueKey={s.customers}
          t={G.reveal.rungs[2]}
        />
        <Station lane="online" name={c.online} note={c.onlineNote} say={sayFor("online")} onTry={tryLane} label={c.tryOnline} />
        <Station lane="shop" name={c.shop} note={c.shopNote} say={sayFor("shop")} onTry={tryLane} label={c.tryShop} />

        {/* Today's sales, at the tip */}
        <div
          className="hl-label hl-show"
          data-anchor={G.labels.tip.anchor}
          style={{ ...at(G.labels.tip), "--t": `${G.reveal.tip}s` } as CSSProperties}
        >
          <span className="hl-name">{c.sales}</span>
          <span className="hl-total">
            <span className="hl-mask">
              <span key={s.total} className="hl-roll">
                {fill(c.money, { amount: fmt(s.total) })}
              </span>
            </span>
            {s.gain ? (
              <span key={s.gain.n} className="hl-gain" dir="ltr">
                +{fmt(s.gain.amount)}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The two lanes: static, drawn once on load. */
const Lanes = memo(function Lanes() {
  return (
    <>
      <defs>
        {(["online", "shop"] as const).map((lane) => {
          const [from, to] = G[lane].fade;
          return (
            <linearGradient
              key={lane}
              id={`hl-fade-${lane}`}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              <stop offset="0" className={`hl-stop-${lane}`} stopOpacity="0" />
              <stop offset="1" className={`hl-stop-${lane}`} />
            </linearGradient>
          );
        })}
      </defs>
      <path d={G.online.d} pathLength={1000} stroke="url(#hl-fade-online)" className="hl-lane" />
      <path d={G.shop.d} pathLength={1000} stroke="url(#hl-fade-shop)" className="hl-lane" />
    </>
  );
});

/** One event travelling its lane, from its station to the tip. */
const PulseTrail = memo(function PulseTrail({ lane: id }: { lane: HeroLane }) {
  const lane = G[id];
  // A dash of `len` centred on its position along the lane.
  const dash = (len: number) =>
    ({
      strokeDasharray: `${len} 9999`,
      "--from": -(lane.start - len / 2),
      "--to": -(lane.length - len / 2),
    }) as CSSProperties;
  return (
    <g className="hl-pulse" data-lane={id}>
      <path d={lane.d} pathLength={lane.length} className="hl-pulse-halo" style={dash(70)} />
      <path d={lane.d} pathLength={lane.length} className="hl-pulse-body" style={dash(36)} />
      <path d={lane.d} pathLength={lane.length} className="hl-pulse-core" style={dash(18)} />
    </g>
  );
});

function Label({
  id,
  name,
  value,
  valueKey,
  t,
}: {
  id: HeroLabel;
  name: string;
  value: string;
  valueKey: number;
  t: number;
}) {
  const l = G.labels[id];
  return (
    <div className="hl-label hl-show" data-anchor={l.anchor} style={{ ...at(l), "--t": `${t}s` } as CSSProperties}>
      <span className="hl-name">{name}</span>
      <span className="hl-value">
        <span key={valueKey} className="hl-roll">
          {value}
        </span>
      </span>
    </div>
  );
}

/** Where a lane starts: a station marker (click it to send one) and its label. */
function Station({
  lane,
  name,
  note,
  say,
  label,
  onTry,
}: {
  lane: HeroLane;
  name: string;
  note: string;
  say: string | null;
  label: string;
  onTry: (lane: HeroLane) => void;
}) {
  const l = G.labels[lane];
  const t = { "--t": `${G.reveal[lane]}s` } as CSSProperties;
  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        title={label}
        data-lane={lane}
        onClick={() => onTry(lane)}
        className={cn("hl-term hl-show", say && "is-live")}
        style={{ ...at(G.stations[lane]), ...t }}
      />
      <div className="hl-label hl-show" data-anchor={l.anchor} style={{ ...at(l), ...t }}>
        <span className="hl-name">{name}</span>
        <span className="hl-value">
          <span key={say ?? "note"} className={cn("hl-roll", say && "hl-say")}>
            {say ?? note}
          </span>
        </span>
      </div>
    </>
  );
}
