"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";

const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2];
// When each channel's pulse leaves for the counter (s). apple.css times the
// counter's ticks (al-tick) to their arrival.
const POS_PULSE_AT = 0.8;
const ONLINE_PULSE_AT = 2.0;

/**
 * Dark cinematic stage: the claim centred, and under it the whole product in
 * one line — the shop's price tag and the online store floating either side of
 * one stock counter. A pulse of light leaves the tag (a sale in the shop),
 * then the store (an order online); each lands on the counter and takes one
 * off: 48 → 47 → 46. Two channels, one inventory.
 *
 * The scene is drawn in `em`, so it scales as one piece with the viewport.
 * Built to be cheap on phones: CSS keyframes on transform/opacity only, no JS
 * animation, no images, no blur filters, and the headline (the LCP) paints
 * unanimated. Reduce Motion lands on the final frame (apple.css).
 */
export default function AppleHero() {
  const c = useLandingCopy().hero;
  const s = c.scene;
  const { lang } = useLang();
  const rtl = lang === "ar";
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  // Physical direction from each object toward the counter.
  const toCounter: 1 | -1 = rtl ? -1 : 1;

  return (
    <section className="al-dark relative isolate flex flex-col overflow-hidden md:min-h-[100dvh]">
      {/* Stage light: a spot from above and brand light pooling under the scene. Gradients only. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,255,255,0.07),transparent)]" />
        <div className="absolute left-1/2 top-[58%] h-[70vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(51,102,255,0.26),transparent)]" />
      </div>

      <div className="al-container-wide flex flex-1 flex-col items-center justify-center pb-14 pt-[clamp(100px,13svh,128px)] text-center md:pb-16">
        <h1 className="text-[clamp(40px,6.6vw,96px)] font-bold leading-[1.22] text-balance ltr:leading-[1.04] ltr:tracking-[-0.035em]">
          <span className="block">{c.title1}</span>
          <span className="al-gradient-text block pb-[0.06em]">{c.title2}</span>
        </h1>

        {/* tag ── pulse ──▶ counter ◀── pulse ── store */}
        <div
          aria-hidden
          className="mt-[clamp(36px,6svh,64px)] grid w-full max-w-[1000px] grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center text-[clamp(54px,10vw,148px)]"
        >
          <Node caption={s.pos} glow="rgba(26,138,62,0.32)">
            <PriceTag />
          </Node>
          <Wire to={toCounter} at={POS_PULSE_AT} color="#4cd07a" />
          <Counter caption={s.stock} unit={s.unit} />
          <Wire to={toCounter === 1 ? -1 : 1} at={ONLINE_PULSE_AT} color="#7da2ff" />
          <Node caption={s.online} glow="rgba(51,102,255,0.38)">
            <MiniStore />
          </Node>
        </div>

        <p className="mt-[clamp(52px,8svh,80px)] max-w-[44ch] text-pretty text-[15px] leading-relaxed text-(--al-muted) sm:text-[18px]">{c.subtitle}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <Link href="/register" className="al-btn al-btn-filled px-8">
            {c.cta}
          </Link>
          <Link href="#pricing" className="al-link">
            {c.secondary}
            <Chevron className="size-4" strokeWidth={2} />
          </Link>
        </div>
        <p className="mt-3 text-[13px] text-(--al-faint)">{c.note}</p>
      </div>
    </section>
  );
}

/** An object floating on its own light, named underneath. */
function Node({ caption, glow, children }: { caption: string; glow: string; children: React.ReactNode }) {
  return (
    <span className="relative flex justify-center">
      <span className="absolute -inset-[0.35em] rounded-full" style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }} />
      <span className="al-float relative flex">{children}</span>
      <Caption>{caption}</Caption>
    </span>
  );
}

function Caption({ children }: { children: string }) {
  return (
    <span className="absolute left-1/2 top-full mt-[clamp(14px,0.16em,24px)] -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/50 sm:text-[13px]">
      {children}
    </span>
  );
}

/** The line between an object and the counter, with one pulse travelling `to` (+1 right, -1 left). */
function Wire({ to, at, color }: { to: 1 | -1; at: number; color: string }) {
  return (
    <span className="relative mx-[0.1em] h-px bg-linear-to-r from-white/5 via-white/25 to-white/5">
      <span className="al-pulse absolute inset-0" style={{ "--to": `${to * 100}%`, animationDelay: `${at}s` } as React.CSSProperties}>
        <span
          className={cn("absolute top-1/2 size-[0.06em] min-h-1.5 min-w-1.5 -translate-y-1/2 rounded-full", to > 0 ? "left-0" : "right-0")}
          style={{ background: color, boxShadow: `0 0 0.12em 0.03em ${color}` }}
        />
      </span>
    </span>
  );
}

/** One stock for both channels: ticks 48 → 47 → 46 as the pulses land. */
function Counter({ caption, unit }: { caption: string; unit: string }) {
  return (
    <span className="relative grid size-[1.08em] place-items-center rounded-full bg-[#0a0c14] shadow-[0_0_0.5em_rgba(51,102,255,0.28),inset_0_0_0.22em_rgba(51,102,255,0.22)] ring-1 ring-white/15">
      <span className="flex flex-col items-center">
        <span className="h-[1em] overflow-hidden text-[0.36em] font-bold leading-none tabular-nums text-white">
          <span className="al-tick flex flex-col">
            {["48", "47", "46"].map((n) => (
              <span key={n} className="h-[1em]">
                {n}
              </span>
            ))}
          </span>
        </span>
        <span className="mt-1 text-[9px] text-white/50 sm:text-[12px]">{unit}</span>
      </span>
      <Caption>{caption}</Caption>
    </span>
  );
}

// Shared by both objects: tilt and pop in.
const OBJECT = "al-chip relative inline-flex h-[0.76em]";

/** The shop: a price tag with a scanner's laser sweeping its barcode. */
function PriceTag() {
  return (
    <span
      className={cn(
        OBJECT,
        "w-[1.34em] items-center rounded-[0.12em] bg-white shadow-[0_0.1em_0.24em_-0.06em_rgba(10,60,30,0.45)] ring-[0.012em] ring-black/10",
      )}
      style={{ "--tilt": "-7deg", animationDelay: "0.15s" } as React.CSSProperties}
    >
      {/* The tag's coloured end, punched for the string. */}
      <span className="flex h-full w-[0.22em] shrink-0 items-center justify-center rounded-s-[0.12em] bg-[#1a8a3e]">
        <span className="size-[0.075em] rounded-full bg-white ring-[0.012em] ring-black/15" />
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[0.035em] px-[0.08em]" dir="ltr">
        <span className="flex h-[0.32em] items-stretch gap-[0.016em]">
          {BARS.map((bar, i) => (
            <span key={i} className="bg-[#1d1d1f]" style={{ width: `${bar * 0.014}em` }} />
          ))}
        </span>
        <span className="text-[0.085em] font-semibold leading-none tracking-[0.12em] text-[#1d1d1f]/70 tabular-nums">6 221034 004509</span>
        {/* Laser: sweeps the bars top to bottom and back. */}
        <span className="al-laser absolute inset-x-[0.04em] top-[0.14em] h-[0.018em] rounded-full bg-[#ff3b30] shadow-[0_0_0.06em_0.015em_rgba(255,59,48,0.75)]" />
      </span>
    </span>
  );
}

/** The online store: a tiny storefront window whose cart just got an order. */
function MiniStore() {
  return (
    <span
      className={cn(
        OBJECT,
        "w-[1.4em] flex-col overflow-hidden rounded-[0.12em] bg-white shadow-[0_0.1em_0.24em_-0.06em_rgba(20,71,230,0.5)] ring-[0.012em] ring-black/10",
      )}
      style={{ "--tilt": "6deg", animationDelay: "0.3s" } as React.CSSProperties}
    >
      {/* Browser bar */}
      <span className="flex h-[0.15em] shrink-0 items-center gap-[0.028em] bg-[#1447e6] px-[0.06em]" dir="ltr">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-[0.034em] rounded-full bg-white/70" />
        ))}
        <span className="ms-[0.05em] h-[0.05em] flex-1 rounded-full bg-white/25" />
      </span>
      {/* Two products and the cart */}
      <span className="flex flex-1 items-center gap-[0.05em] px-[0.07em]">
        {[
          { tile: "bg-[#e8eeff]", art: "rounded-full bg-[#1447e6]/40" },
          { tile: "bg-[#f1f1f4]", art: "rounded-[0.03em] bg-[#1d1d1f]/25" },
        ].map((p, i) => (
          <span key={i} className="flex h-[0.42em] flex-1 flex-col items-center justify-center gap-[0.035em]">
            <span className={cn("flex h-[0.26em] w-full items-center justify-center rounded-[0.05em]", p.tile)}>
              <span className={cn("size-[0.12em]", p.art)} />
            </span>
            <span className="h-[0.035em] w-[60%] rounded-full bg-[#1d1d1f]/20" />
          </span>
        ))}
        <span className="relative grid size-[0.3em] shrink-0 place-items-center rounded-full bg-[#1447e6] text-white">
          <ShoppingBag className="size-[0.16em]" strokeWidth={2.4} />
          <span className="al-ping absolute -end-[0.06em] -top-[0.06em] grid size-[0.15em] place-items-center rounded-full bg-[#ff3b30] ring-[0.015em] ring-white">
            <span className="text-[0.1em] font-bold leading-none">1</span>
          </span>
        </span>
      </span>
    </span>
  );
}
