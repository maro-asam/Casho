"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Check,
  Clock,
  Glasses,
  Globe,
  Menu,
  RefreshCw,
  ScanBarcode,
  Shirt,
  ShoppingBag,
  Store,
  Undo2,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";
import "./pos-stage.css";

/**
 * Section 2 — "a till for your shop, a store for your customers, one system".
 * Apple-style product stage on black: the Casho POS on a tablet and the online
 * store on a phone, both showing the same product (the black tee) from the
 * same stock. Once on screen, sales happen by themselves: a sale at the till
 * prints its receipt and the phone's stock ticks down; an online order lands
 * on the till as a notice and the till's card ticks down. The devices are a
 * drawing (aria-hidden), sized in design pixels (`--u`) so the whole stage
 * scales like a picture — see pos-stage.css.
 */

const START_STOCK = 44;
/** What happens, in order, once the stage is on screen. */
const EVENTS = ["pos", "online", "pos", "online", "pos", "online"] as const;
const FIRST_DELAY = 1100;
const EVENT_GAP = 3400;
const FIRST_RECEIPT = 1042;

type Channel = (typeof EVENTS)[number];

/** Product art on the till's cards: icon, ink, plate. Index-aligned with `copy.pos.products`. */
const ART: { icon: LucideIcon | "jeans" | "bag"; ink: string; plate: string; fill?: boolean }[] = [
  { icon: Shirt, ink: "#1d1d1f", plate: "#e9e9ee", fill: true },
  { icon: Shirt, ink: "#9aa4b8", plate: "#e8edf7", fill: true },
  { icon: "jeans", ink: "#5b7db1", plate: "#e6eef8" },
  { icon: "bag", ink: "#8a5a3c", plate: "#efe9e4" },
  { icon: Glasses, ink: "#1d1d1f", plate: "#f3efe8" },
  { icon: Watch, ink: "#4f8a69", plate: "#eaf3ee" },
];
const PRICES = [450, 780, 650, 1200, 550, 1450];
const STOCK = [START_STOCK, 17, 9, 6, 23, 12];
const SIZES = ["S", "M", "L", "XL"];
const SPEC_ICONS: LucideIcon[] = [ScanBarcode, Clock, RefreshCw, Undo2];

const fill = (s: string, n: number | string) => s.replace("{n}", String(n));
const num = (n: number) => n.toLocaleString("en-US");

export default function PosStage() {
  const c = useLandingCopy().pos;
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [step, setStep] = useState(0);

  // Entrance once; the sales only run while the stage is on screen and the tab is visible.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.isIntersecting);
        if (entry.isIntersecting) setEntered(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !onScreen || step >= EVENTS.length) return;
    let id: number | undefined;
    const schedule = () => {
      window.clearTimeout(id);
      if (document.visibilityState === "visible") {
        id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? FIRST_DELAY : EVENT_GAP);
      }
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [reduce, onScreen, step]);

  const happened = EVENTS.slice(0, step);
  const last: Channel | null = happened.at(-1) ?? null;
  const stock = START_STOCK - step;
  const posSales = happened.filter((e) => e === "pos").length;
  const onlineOrders = happened.length - posSales;
  // The receipt on screen is the next one to ring up; the notice shows the one just paid.
  const receipt = FIRST_RECEIPT + posSales;
  const city = c.cities[(onlineOrders - 1 + c.cities.length) % c.cities.length];

  return (
    <section id="why" aria-labelledby="pos-title" className="al-dark al-section ps scroll-mt-16">
      <div aria-hidden className="ps-beam" />
      <SectionHead
        id="pos-title"
        eyebrow={c.eyebrow}
        // Each sentence wraps as a unit, so a line never ends on a stray word ("… shop. A").
        title={c.title.split(/(?<=\.)\s+/).map((sentence, i) => (
          <span key={sentence}>
            {i > 0 ? " " : null}
            <span className="inline-block">{sentence}</span>
          </span>
        ))}
        accent={c.accent}
        emphasis="gradient"
      />

      <div className="al-container-wide al-body">
        <div ref={stageRef} className={cn("ps-stage", (entered || reduce) && "is-in")}>
          <div className="ps-frame">
            <p className="ps-sync" data-channel={last ?? "idle"}>
              <span key={step} className="ps-sync-icon" aria-hidden>
                <RefreshCw strokeWidth={2.2} />
              </span>
              <span key={`t${step}`} className="ps-sync-text">
                {last ? c.sync[last] : c.sync.idle}
              </span>
            </p>

            <div className="ps-canvas" role="img" aria-label={c.figure}>
              <div aria-hidden className="ps-floor" />
              <Tablet
                c={c}
                stock={stock}
                step={step}
                last={last}
                receipt={receipt}
                city={city}
              />
              <Phone c={c} stock={stock} step={step} last={last} />
            </div>
          </div>
        </div>

        <ul className="ps-specs">
          {c.specs.map((s, i) => {
            const Icon = SPEC_ICONS[i];
            return (
              <Reveal as="li" key={s.title} delay={i * 70} className="ps-spec">
                <Icon aria-hidden strokeWidth={1.6} />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

type Copy = ReturnType<typeof useLandingCopy>["pos"];

function Tablet({
  c,
  stock,
  step,
  last,
  receipt,
  city,
}: {
  c: Copy;
  stock: number;
  step: number;
  last: Channel | null;
  receipt: number;
  city: string;
}) {
  const t = c.till;
  const cart = [
    { i: 0, meta: "L · ×1" },
    { i: 4, meta: "×1" },
  ];
  const subtotal = cart.reduce((sum, l) => sum + PRICES[l.i], 0);
  const discount = 100;

  return (
    <div aria-hidden className="ps-tablet">
      <div className="ps-screen ps-till">
        <div className="pt-top">
          <span className="pt-mark">
            <Store strokeWidth={2} />
          </span>
          <b className="pt-branch">{t.branch}</b>
          <span className="pt-search">
            <ScanBarcode strokeWidth={1.8} />
            {t.search}
          </span>
          <span className="pt-shift">
            <i />
            {t.shift}
          </span>
        </div>

        <div className="pt-body">
          <div className="pt-products">
            <div className="pt-chips">
              {t.categories.map((cat, i) => (
                <span key={cat} className={cn("pt-chip", i === 0 && "is-on")}>
                  {cat}
                </span>
              ))}
            </div>
            <div className="pt-grid">
              {c.products.map((name, i) => (
                <div key={name} className={cn("pt-card", i === 0 && "is-picked")}>
                  <Art i={i} className="pt-art" />
                  <p className="pt-name">{name}</p>
                  <div className="pt-row">
                    <b>{fill(c.price, num(PRICES[i]))}</b>
                    {i === 0 ? (
                      <Tick k={step} className="pt-left is-live">
                        {fill(t.stock, stock)}
                      </Tick>
                    ) : (
                      <span className="pt-left">{fill(t.stock, STOCK[i])}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-cart">
            <p className="pt-cart-head">
              {t.invoice}
              <span>#{receipt}</span>
            </p>
            {cart.map((l) => (
              <div key={l.i} className="pt-line">
                <Art i={l.i} className="pt-thumb" />
                <div>
                  <p>{c.products[l.i]}</p>
                  <small>{l.meta}</small>
                </div>
                <b>{num(PRICES[l.i])}</b>
              </div>
            ))}
            <div className="pt-totals">
              <div>
                <span>{t.subtotal}</span>
                <span>{num(subtotal)}</span>
              </div>
              <div>
                <span>{t.discount}</span>
                <span dir="ltr">−{discount}</span>
              </div>
              <div className="pt-due">
                <span>{t.due}</span>
                <span>{fill(c.price, num(subtotal - discount))}</span>
              </div>
            </div>
            <div className="pt-methods">
              {t.methods.map((m, i) => (
                <span key={m} className={cn(i === 0 && "is-on")}>
                  {m}
                </span>
              ))}
            </div>
            <span key={`pay${step}`} className={cn("pt-pay", last === "pos" && "is-pressed")}>
              {t.pay}
            </span>

            {/* The sale just rung up: paid, receipt printed. */}
            {last === "pos" ? (
              <div key={`paid${step}`} className="pt-paid">
                <span className="pt-paid-check">
                  <Check strokeWidth={3} />
                </span>
                <b>{t.paid}</b>
                <small>{fill(t.receipt, receipt - 1)}</small>
              </div>
            ) : null}
          </div>
        </div>

        {/* An order from the online store lands on the till. */}
        {last === "online" ? (
          <div key={`order${step}`} className="pt-notice">
            <span className="pt-notice-icon">
              <Globe strokeWidth={2} />
            </span>
            <span className="pt-notice-text">
              <b>{t.newOrder}</b>
              <small>
                {c.products[0]} · {city}
              </small>
            </span>
            <span className="pt-notice-delta">{c.minusOne}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Phone({ c, stock, step, last }: { c: Copy; stock: number; step: number; last: Channel | null }) {
  const s = c.shop;
  return (
    <div aria-hidden className="ps-phone">
      <div className="ps-screen ps-store">
        <span className="pp-island" />
        <div className="pp-status" dir="ltr">
          <span>7:26</span>
          <span className="pp-battery" />
        </div>
        <div className="pp-head">
          <Menu strokeWidth={1.8} />
          <b>{s.name}</b>
          <ShoppingBag strokeWidth={1.8} />
        </div>
        <div className="pp-hero">
          <Shirt strokeWidth={0.8} fill="currentColor" />
          <span className="pp-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="pp-info">
          <p className="pp-name">{c.products[0]}</p>
          <p className="pp-price">{fill(c.price, num(PRICES[0]))}</p>
          <div className="pp-sizes">
            {SIZES.map((z) => (
              <span key={z} className={cn(z === "L" && "is-on")}>
                {z}
              </span>
            ))}
          </div>
          <Tick k={step} className="pp-stock is-live">
            <i />
            {fill(s.stock, stock)}
          </Tick>
        </div>
        <span key={`add${step}`} className={cn("pp-add", last === "online" && "is-ordered")}>
          <span className="pp-add-idle">{s.add}</span>
          <span className="pp-add-done">
            <Check strokeWidth={3} />
            {s.ordered}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Remounts on every sale so the stock flashes when it changes. */
function Tick({ k, className, children }: { k: number; className?: string; children: ReactNode }) {
  return (
    <span key={k} className={cn(className, k > 0 && "is-tick")}>
      {children}
    </span>
  );
}

function Art({ i, className }: { i: number; className?: string }) {
  const a = ART[i];
  const style = { "--art-ink": a.ink, "--art-plate": a.plate } as CSSProperties;
  return (
    <span className={className} style={style}>
      {a.icon === "jeans" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M6 2.5h12l1.2 19h-6L12 10l-1.2 11.5h-6z" />
          <path d="M6.2 6h11.6" />
        </svg>
      ) : a.icon === "bag" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2.5" />
          <path d="M7 9c0-3.5 2.2-6 5-6s5 2.5 5 6" />
          <path d="M4 13.5h16" />
        </svg>
      ) : (
        <a.icon strokeWidth={a.fill ? 1 : 1.6} fill={a.fill ? "currentColor" : "none"} />
      )}
    </span>
  );
}
