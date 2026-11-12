"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import "./hero-number.css";

/**
 * "One place, one number." The headline and the call to action sit on top;
 * under them, today's sales fill the width of the page as one giant number
 * that counts up with every order — online (blue) and the shop (ink) into the
 * same total. A thin bar shows the split, and the last three orders sit on
 * the number's foot.
 *
 * No images: the headline is the largest paint. The number counts from zero
 * on first sight, then an order lands every few seconds while the hero is on
 * screen. With Reduce Motion it shows the day's total and stays still.
 */

const START = { online: 8466, shop: 3984 };
const EVERY = 3000;
const COUNT_MS = 900;
const INTRO_MS = 1800;
const RESET_AT = 90_000;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const fill = (t: string, vars: Record<string, string | number>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const easeOut = (k: number) => 1 - (1 - k) ** 4;

export default function HeroNumber() {
  const c = useLandingCopy().number;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const delay = (s: number) => ({ "--hn-d": `${s}s` }) as CSSProperties;

  const [sales, setSales] = useState(START);
  // The newest order first; three are shown.
  const [feed, setFeed] = useState([2, 1, 0].map((i) => ({ n: i, event: i })));
  const [started, setStarted] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  const total = sales.online + sales.shop;
  const onlinePct = Math.round((sales.online / total) * 100);

  // The number is written straight to the DOM while it counts.
  useEffect(() => {
    const el = numberRef.current;
    if (!el || !started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = total;
      el.textContent = fmt(total);
      return;
    }
    const from = shown.current;
    const span = from === 0 ? INTRO_MS : COUNT_MS;
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / span);
      shown.current = from + (total - from) * easeOut(k);
      el.textContent = fmt(shown.current);
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [total, started]);

  // Start on first sight; orders keep landing while the hero is visible.
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let onScreen = false;
    let loop: number | undefined;
    let step = 3;

    const tick = () => {
      const i = step++;
      const ev = c.events[i % c.events.length];
      setSales((s) => {
        if (s.online + s.shop > RESET_AT) return START;
        return ev.shop ? { ...s, shop: s.shop + ev.amount } : { ...s, online: s.online + ev.amount };
      });
      setFeed((f) => [{ n: i, event: i % c.events.length }, ...f].slice(0, 3));
    };
    const sync = () => {
      const live = onScreen && !reduced && document.visibilityState === "visible";
      if (live && loop === undefined) loop = window.setInterval(tick, EVERY);
      else if (!live && loop !== undefined) {
        window.clearInterval(loop);
        loop = undefined;
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) setStarted(true);
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(board);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(loop);
    };
  }, [c.events]);

  return (
    <section aria-labelledby="hero-title" className={cn("hn relative isolate overflow-hidden bg-(--al-bg)", started && "is-on")}>
      <div className="al-container-wide pt-[88px] sm:pt-[112px] lg:pt-[clamp(104px,12.5svh,132px)]">
        <div className="hn-top">
          <div>
            <p className="hn-in inline-flex items-center gap-2 text-[13px] text-(--al-muted)" style={delay(0)}>
              <span className="font-semibold text-(--al-new)">{c.badgeNew}</span>
              <span aria-hidden className="h-3 w-px bg-(--al-hair)" />
              {c.badge}
            </p>
            <h1 id="hero-title" className="hn-title mt-4 text-(--al-text)">
              {c.title.map((line, i) => (
                <span
                  key={line}
                  className={cn("hn-line hn-rise font-bold", i === c.title.length - 1 && "al-gradient-text pb-[0.08em]")}
                  style={{ animationDelay: `${0.05 + i * 0.09}s` }}
                >
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div className="hn-aside">
            <p className="hn-in text-[15.5px] leading-[1.8] text-(--al-muted) text-pretty sm:text-[17px]" style={delay(0.26)}>
              {c.subtitle}
            </p>
            <div className="hn-in mt-5 flex flex-wrap items-center gap-x-7 gap-y-3" style={delay(0.34)}>
              <Link href="/register" className="al-btn al-btn-filled h-12 px-7 text-[16px] font-semibold">
                {c.cta}
              </Link>
              <Link href="#pricing" className="al-link text-[16px]">
                {c.secondary}
                <Chevron className="size-4" strokeWidth={2} />
              </Link>
            </div>
            <p className="hn-in mt-3 text-[12.5px] text-(--al-faint)" style={delay(0.42)}>
              {c.note}
            </p>
          </div>
        </div>
      </div>

      <div ref={boardRef} className="hn-board">
        <p className="sr-only">{fill(c.caption, { amount: fmt(total), online: onlinePct, shop: 100 - onlinePct })}</p>

        <div aria-hidden className="al-container-wide">
          <div className="hn-meter hn-in" style={delay(0.5)}>
            <span className="hn-live">
              <span className="hn-live-dot" />
              {c.live}
            </span>
            <span className="hn-bar">
              <span className="hn-bar-online" style={{ flexGrow: sales.online }} />
              <span className="hn-bar-shop" style={{ flexGrow: sales.shop }} />
            </span>
            <span className="hn-keys">
              <span className="hn-key">
                {c.online} <span dir="ltr">{onlinePct}%</span>
              </span>
              <span className="hn-key" data-k="shop">
                {c.shop} <span dir="ltr">{100 - onlinePct}%</span>
              </span>
            </span>
          </div>
        </div>

        <div aria-hidden className="hn-stage">
          <span ref={numberRef} dir="ltr" className="hn-number">
            0
          </span>

          <div className="al-container-wide hn-feed-wrap">
            <ul className="hn-feed">
              {feed.map((row, slot) => {
                const ev = c.events[row.event];
                return (
                  <li key={slot} className="hn-row" data-shop={ev.shop || undefined}>
                    <span key={row.n} className="hn-row-in" style={{ animationDelay: `${slot * 70}ms` }}>
                      <span className="hn-row-dot" />
                      <span className="hn-row-text">
                        <span className="hn-row-title">{ev.shop ? c.shopSale : c.onlineOrder}</span>
                        <span className="hn-row-meta">{ev.meta}</span>
                      </span>
                      <span dir="ltr" className="hn-row-amount">
                        +{fmt(ev.amount)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
