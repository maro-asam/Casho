"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";

// Barcode at the foot of the receipt (bar widths in units).
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 2, 1, 1, 3, 1, 2, 1];

const CHANNEL = {
  pos: { icon: ScanBarcode, ink: "#1a8a3e", wash: "rgba(26,138,62,0.12)", solid: "linear-gradient(160deg,#34c759,#1a8a3e)" },
  online: { icon: Globe, ink: "#1447e6", wash: "rgba(20,71,230,0.1)", solid: "linear-gradient(160deg,#4d7cff,#1447e6)" },
} as const;

// When each notice lands (s): just before its line reaches the slot. The feed
// itself (apple.css al-feed) runs 3.2s after a 0.5s delay.
const POS_NOTICE_AT = 1.1;
const ONLINE_NOTICE_AT = 1.55;

/**
 * Split hero. The claim on one side; on the other, the day's receipt feeding
 * out of a slot in the counter that runs along the bottom of the section.
 * Every line is a sale: some rung up in the shop, some ordered online, all on
 * one roll and one total. Two notices land as the first sale of each kind
 * comes in.
 *
 * Built to be cheap on phones: the object is plain DOM drawn in `em` (one
 * font-size scales it), every animation is CSS transform/opacity, no images,
 * no blur, and the headline (the LCP) paints unanimated. The paper starts
 * feeding when the slot scrolls into view, so phones see the print too.
 * Reduce Motion shows the finished receipt (apple.css).
 */
export default function AppleHero() {
  const copy = useLandingCopy();
  const c = copy.hero;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const themeCount = copy.themes.items.length;

  return (
    <section aria-labelledby="hero-title" className="al-dark relative isolate overflow-hidden">
      {/* A cool wash from the top. Gradients only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(51,102,255,0.13),transparent)]"
      />

      <div className="al-container-wide grid gap-y-12 pt-[clamp(104px,14svh,132px)] lg:min-h-[calc(100dvh-56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 lg:pt-24">
        <div className="text-center lg:self-center lg:pb-16 lg:text-start">
          <Link
            href={c.badge.href}
            className="group inline-flex items-center gap-2 rounded-full bg-white/6 py-1 ps-1 pe-3 text-[13px] text-white/75 ring-1 ring-white/12 transition-colors hover:bg-white/10"
          >
            <span className="rounded-full bg-[#ff9f45]/15 px-2 py-0.5 text-[12px] font-semibold text-[#ff9f45]">{c.badge.tag}</span>
            {c.badge.text}
            <Chevron className="size-3.5 opacity-60" strokeWidth={2} />
          </Link>

          <h1
            id="hero-title"
            className="mt-6 text-[clamp(42px,11.5vw,60px)] font-bold leading-[1.22] text-balance lg:text-[clamp(56px,5.6vw,88px)] ltr:leading-[1.04] ltr:tracking-[-0.035em]"
          >
            <span className="block">{c.title1}</span>
            <span className="al-gradient-text block pb-[0.06em]">{c.title2}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[36ch] text-pretty text-[16px] leading-relaxed text-(--al-muted) sm:text-[19px] lg:mx-0">
            {c.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-start">
            <Link href="/register" className="al-btn al-btn-filled px-8">
              {c.cta}
            </Link>
            <Link href="#pricing" className="al-link">
              {c.secondary}
              <Chevron className="size-4" strokeWidth={2} />
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-(--al-faint)">{c.note}</p>

          <dl className="mt-12 hidden w-fit border-t border-white/10 pt-6 lg:flex">
            <Spec value={c.specs.launch.value} label={c.specs.launch.label} />
            <Spec
              value={`${themeCount} ${themeCount > 10 ? c.specs.themes.unitMany : c.specs.themes.unit}`}
              label={c.specs.themes.label}
            />
            <Spec value={c.specs.payments.value} label={c.specs.payments.label} />
          </dl>
        </div>

        <ReceiptStage />
      </div>

      {/* The counter the receipt prints out of. */}
      <div aria-hidden className="relative h-10 bg-linear-to-b from-[#17181d] via-[#0b0c0f] to-black lg:h-14">
        <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </section>
  );
}

function Spec({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-white/10 pe-6 not-first:border-s not-first:ps-6">
      <dt className="text-[19px] font-semibold text-white">{value}</dt>
      <dd className="mt-1 whitespace-nowrap text-[13px] leading-snug text-(--al-faint)">{label}</dd>
    </div>
  );
}

/**
 * Starts the print once it can be seen: on desktop when the slot (the stage's
 * bottom edge) is on screen, on phones as soon as the top of the paper is.
 */
function usePlayInView() {
  const topRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const el = window.matchMedia("(min-width: 1024px)").matches ? slotRef.current : topRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setPlay(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -24px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { topRef, slotRef, play };
}

function ReceiptStage() {
  const c = useLandingCopy().hero;
  const n = c.notices;
  const { topRef, slotRef, play } = usePlayInView();

  return (
    <div
      aria-hidden
      data-play={play}
      className="al-stage relative z-10 mx-auto flex w-full flex-col items-center lg:self-end"
    >
      {/* Light: a spot on the paper, brand light pooling on the counter. */}
      <span className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[44em] w-[38em] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(255,255,255,0.085),transparent)]" />
      <span className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[7em] w-[34em] -translate-x-1/2 translate-y-1/2 bg-[radial-gradient(closest-side,rgba(51,102,255,0.4),transparent)]" />

      {/* Phones: the two notices sit above the paper. Desktop: they float beside it. */}
      <div className="mb-[1.1em] grid w-[22em] grid-cols-2 gap-[0.6em] lg:contents">
        <div className="al-bob lg:absolute lg:top-[2.6em] lg:start-[calc(50%+7.4em)] lg:z-20 lg:w-[12.6em]">
          <Notice channel="pos" title={n.pos.title} detail={n.pos.detail} now={n.now} at={POS_NOTICE_AT} />
        </div>
        <div className="al-bob lg:absolute lg:bottom-[1.1em] lg:end-[calc(50%+7.4em)] lg:z-20 lg:w-[12.6em]" style={{ animationDelay: "-3.5s" }}>
          <Notice channel="online" title={n.online.title} detail={n.online.detail} now={n.now} at={ONLINE_NOTICE_AT} />
        </div>
      </div>

      {/* The paper, clipped where it leaves the counter. */}
      <div ref={topRef} className="relative overflow-hidden">
        <Receipt />
        {/* Shadow where the paper meets the slot. */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.4em] bg-linear-to-t from-black/30 to-transparent" />
      </div>

      {/* The slot, sunk into the counter's top edge, and the printer's light. */}
      <span
        ref={slotRef}
        className="absolute bottom-0 left-1/2 h-[0.5em] w-[21.6em] -translate-x-1/2 translate-y-1/2 rounded-full bg-black shadow-[inset_0_0.12em_0.22em_#000,0_0.06em_0_rgba(255,255,255,0.1)] ring-1 ring-white/10"
      />
      <span className="al-led absolute bottom-0 h-[0.26em] w-[0.26em] translate-y-[0.95em] rounded-full bg-[#30d158] shadow-[0_0_0.4em_#30d158] ltr:left-[calc(50%+10.2em)] rtl:right-[calc(50%+10.2em)]" />
    </div>
  );
}

/** Print order of a block, for the phone animation (apple.css al-line). */
const line = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * 20em × 33em of thermal paper. Block heights are fixed in em so the desktop
 * feed's keyframes (apple.css al-feed) stop on line boundaries.
 */
function Receipt() {
  const r = useLandingCopy().hero.receipt;
  return (
    <div className="al-paper al-feed flex flex-col px-[1.5em]">
      <div className="h-[1.4em] shrink-0" />

      {/* Header — 5.4em */}
      <div style={line(0)} className="al-line flex h-[5.4em] shrink-0 flex-col items-center justify-center text-center">
        <span className="grid size-[1.9em] place-items-center rounded-[0.55em] bg-[#1447e6] font-bold text-white">
          <span className="text-[1em] leading-none">{r.initial}</span>
        </span>
        <span className="mt-[0.3em] text-[1.05em] font-bold leading-tight">{r.store}</span>
        <span className="text-[0.68em] leading-tight text-black/50" dir="ltr">
          {r.url}
        </span>
      </div>

      {/* Meta — 1.9em */}
      <div style={line(1)} className="al-line flex h-[1.9em] shrink-0 items-center justify-between border-y border-dashed border-black/20">
        <span className="text-[0.7em] font-semibold">{r.meta}</span>
        <span className="text-[0.7em] text-black/50">{r.count}</span>
      </div>

      {/* Items — 4 × 3em */}
      {r.items.map((item, i) => {
        const ch = CHANNEL[item.channel as keyof typeof CHANNEL];
        const Icon = ch.icon;
        return (
          <div key={item.name} style={line(2 + i)} className="al-line flex h-[3em] shrink-0 items-center gap-[0.6em]">
            <span className="grid size-[1.75em] shrink-0 place-items-center rounded-full" style={{ background: ch.wash }}>
              <Icon className="size-[0.95em]" style={{ color: ch.ink }} strokeWidth={2.2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[0.86em] font-semibold leading-snug">{item.name}</span>
              <span className="truncate text-[0.7em] leading-snug text-black/50">{item.via}</span>
            </span>
            <span className="text-[0.86em] font-semibold tabular-nums">{item.price}</span>
          </div>
        );
      })}

      {/* Rule — 0.9em */}
      <div style={line(6)} className="al-line flex h-[0.9em] shrink-0 items-center">
        <span className="h-0 w-full border-t border-dashed border-black/20" />
      </div>

      {/* Totals — 6.2em */}
      <div style={line(6)} className="al-line flex h-[6.2em] shrink-0 flex-col justify-center">
        <TotalRow ink={CHANNEL.pos.ink} label={r.shop} value={r.shopTotal} />
        <TotalRow ink={CHANNEL.online.ink} label={r.online} value={r.onlineTotal} />
        {/* Shop vs online share of the day. */}
        <span className="al-grow my-[0.45em] flex h-[0.32em] origin-left gap-[0.12em] rtl:origin-right">
          <span className="rounded-full" style={{ background: CHANNEL.pos.ink, flex: 670 }} />
          <span className="rounded-full" style={{ background: CHANNEL.online.ink, flex: 1950 }} />
        </span>
        <span className="flex items-baseline justify-between">
          <span className="text-[0.95em] font-bold">{r.total}</span>
          <span className="flex items-baseline gap-[0.25em]">
            <span className="text-[1.4em] font-bold leading-none tabular-nums">{r.grand}</span>
            <span className="text-[0.7em] font-semibold text-black/60">{r.currency}</span>
          </span>
        </span>
      </div>

      {/* Footer — 4.4em */}
      <div style={line(7)} className="al-line flex h-[4.4em] shrink-0 flex-col items-center justify-center gap-[0.4em] border-t border-dashed border-black/20">
        <span className="flex h-[1.8em] items-stretch gap-[0.1em]" dir="ltr">
          {BARS.map((bar, i) => (
            <span key={i} className="bg-[#1d1d1f]" style={{ width: `${bar * 0.1}em` }} />
          ))}
        </span>
        <span className="text-[0.66em] leading-none text-black/45">{r.thanks}</span>
      </div>
    </div>
  );
}

function TotalRow({ ink, label, value }: { ink: string; label: string; value: string }) {
  return (
    <span className="flex h-[1.45em] items-center justify-between">
      <span className="flex items-center gap-[0.45em]">
        <span className="size-[0.45em] rounded-full" style={{ background: ink }} />
        <span className="text-[0.74em] text-black/65">{label}</span>
      </span>
      <span className="text-[0.74em] font-semibold tabular-nums">{value}</span>
    </span>
  );
}

/** A phone-style notification: one sale arriving from one channel. */
function Notice({
  channel,
  title,
  detail,
  now,
  at,
}: {
  channel: keyof typeof CHANNEL;
  title: string;
  detail: string;
  now: string;
  at: number;
}) {
  const ch = CHANNEL[channel];
  const Icon = ch.icon;
  return (
    <div
      className="al-notice flex items-center gap-[0.55em] rounded-[0.95em] bg-[#1c1c1e]/95 p-[0.55em] pe-[0.75em] text-[0.8em] shadow-[0_1em_2.2em_-0.5em_rgba(0,0,0,0.8)] ring-1 ring-white/10 lg:text-[0.86em]"
      style={{ animationDelay: `${at}s` }}
    >
      <span className="grid size-[2.2em] shrink-0 place-items-center rounded-[0.6em]" style={{ background: ch.solid }}>
        <Icon className="size-[1.15em] text-white" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[0.1em] text-start">
        <span className="flex items-baseline justify-between gap-[0.6em]">
          <span className="truncate text-[0.92em] font-semibold leading-tight text-white">{title}</span>
          <span className="hidden shrink-0 text-[0.72em] text-white/40 lg:inline">{now}</span>
        </span>
        <span className="truncate text-[0.8em] leading-tight text-white/60 tabular-nums">{detail}</span>
      </span>
    </div>
  );
}
