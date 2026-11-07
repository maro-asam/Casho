"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Check, Globe, ScanBarcode, Shirt, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";

/**
 * Split hero. The claim on the start side — badge, a three-line headline,
 * and the subtitle with the calls to action pinned to the bottom — and on the
 * end side a tall photo card that plays one slide per side of the business:
 * the shop (POS), the online store, shipping and stock. Each slide has its
 * own live cards floating over the photo; the dash under the active slide
 * fills and moves the card on. Hovering or focusing the card pauses it.
 * Payment logos run under the hero.
 *
 * Photos: Unsplash License (free for commercial use), self-hosted in
 * public/images/hero. Card positions are set per photo so they never cover a face.
 */

const SLIDES = [
  { id: "shop", src: "/images/hero/shop.jpg", pos: "50% 38%", icon: ScanBarcode },
  { id: "online", src: "/images/hero/online.jpg", pos: "68% 50%", icon: Globe },
  { id: "ship", src: "/images/hero/delivery.jpg", pos: "55% 40%", icon: Truck },
] as const;
type SlideId = (typeof SLIDES)[number]["id"];

const DURATION = 6000;
const EASE = [0.16, 1, 0.3, 1] as const;

// Each logo's height evens out the whitespace inside its file.
const LOGOS = [
// Line logos turn white on dark; logos drawn on their own badge stay as they are.
  { src: "/payment-logos/visa-mastercard.svg", name: "Visa", h: "h-6 sm:h-7", line: false },
  { src: "/payment/vfcash.svg", name: "Vodafone Cash", h: "h-9 sm:h-10", line: true },
  { src: "/payment-logos/instapay.svg", name: "InstaPay", h: "h-7 sm:h-8", line: true },
  { src: "/payment/fawry.svg", name: "Fawry", h: "h-6 sm:h-7", line: false },
];

export default function AppleHero() {
  const c = useLandingCopy().hero;
  const reduce = !!useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Off screen or in a hidden tab, the card waits.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let visible = true;
    const sync = () => setInView(visible && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const slide = SLIDES[index];
  const paused = hold || !inView;
  const next = () => setIndex((i) => (i + 1) % SLIDES.length);

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? { duration: 0 } : { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section aria-labelledby="hero-title" className="relative isolate bg-(--al-bg)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-[radial-gradient(60%_55%_at_80%_0%,rgba(20,71,230,0.09),transparent)] ltr:bg-[radial-gradient(60%_55%_at_20%_0%,rgba(20,71,230,0.09),transparent)] dark:bg-[radial-gradient(60%_55%_at_80%_0%,rgba(51,102,255,0.16),transparent)] dark:ltr:bg-[radial-gradient(60%_55%_at_20%_0%,rgba(51,102,255,0.16),transparent)]"
      />
      <div className="al-container-wide pt-[clamp(92px,12svh,116px)]">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] lg:gap-14">
          {/* The claim */}
          <div className="flex flex-col lg:justify-between lg:py-3">
            <div>
              <motion.p {...enter(0)} className="inline-flex items-center gap-2 text-[13px] text-(--al-muted)">
                <span className="grid size-6 place-items-center rounded-[7px] bg-(--al-tint)/10 text-(--al-tint) ring-1 ring-(--al-tint)/20">
                  <Sparkles className="size-3.5" strokeWidth={2} />
                </span>
                {c.badge}
              </motion.p>
              <h1
                id="hero-title"
                className="mt-6 text-[clamp(42px,11.4vw,58px)] font-bold leading-[1.2] text-(--al-text) lg:mt-8 lg:text-[clamp(54px,min(5.3vw,9svh),82px)] ltr:text-[clamp(40px,10.4vw,54px)] ltr:leading-[1.02] ltr:tracking-[-0.04em] ltr:lg:text-[clamp(46px,min(4.3vw,8svh),64px)]"
              >
                {c.title.map((line, i) => (
                  <span
                    key={line}
                    className={cn("hc-rise block font-bold", i === c.title.length - 1 && "al-gradient-text pb-[0.06em]")}
                    style={{ animationDelay: `${0.08 + i * 0.09}s` }}
                  >
                    {line}
                  </span>
                ))}
              </h1>
            </div>

            <div className="mt-6 lg:mt-10">
              <motion.p {...enter(0.25)} className="max-w-[470px] text-[16px] leading-[1.75] text-(--al-muted) text-pretty sm:text-[17px]">
                {c.subtitle}
              </motion.p>
              <motion.div {...enter(0.35)} className="mt-7 flex flex-wrap items-center gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center rounded-full bg-(--al-tint) px-7 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(20,71,230,0.75)] transition-[background-color,transform] duration-200 hover:bg-(--al-tint-hover) active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--al-tint)"
                >
                  {c.cta}
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex h-12 items-center rounded-full bg-black/[0.05] px-7 text-[15px] font-semibold text-(--al-text) transition-[background-color,transform] duration-200 hover:bg-black/[0.08] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--al-tint) dark:bg-white/10 dark:hover:bg-white/15"
                >
                  {c.secondary}
                </Link>
              </motion.div>
              <motion.p {...enter(0.42)} className="mt-3.5 text-[12.5px] text-(--al-faint)">
                {c.note}
              </motion.p>
            </div>
          </div>

          {/* The photo card */}
          <motion.div
            ref={cardRef}
            initial={{ y: 28 }}
            animate={{ y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 1, ease: EASE }}
            onMouseEnter={() => setHold(true)}
            onMouseLeave={() => setHold(false)}
            onFocusCapture={() => setHold(true)}
            onBlurCapture={() => setHold(false)}
            className={cn(
              "relative isolate aspect-[4/5] overflow-hidden rounded-[26px] bg-(--al-surface) sm:aspect-[5/5] lg:aspect-auto lg:h-[clamp(500px,calc(100svh-250px),660px)] lg:rounded-[30px]",
              paused && "hc-paused",
            )}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                aria-hidden={i !== index}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[900ms] ease-out",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={s.src}
                  alt={c.slides[s.id].alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 620px, 100vw"
                  className={cn("object-cover", i === index && !reduce && "hc-settle")}
                  style={{ objectPosition: s.pos }}
                />
              </div>
            ))}

            {/* Legibility for the caption */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-t from-black/55 via-black/15 to-transparent" />

            <AnimatePresence mode="wait">
              <SlideCards key={slide.id} id={slide.id} reduce={reduce} />
            </AnimatePresence>

            {/* Caption + slide dashes */}
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6 sm:bottom-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={slide.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
                  className="flex min-w-0 items-center gap-2.5 text-[13.5px] font-medium text-white sm:text-[15px]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-white/25 backdrop-blur-md">
                    <slide.icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="truncate">{c.slides[slide.id].caption}</span>
                </motion.p>
              </AnimatePresence>
              <div className="flex shrink-0 items-center gap-1.5">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={c.slide.replace("{n}", String(i + 1)).replace("{total}", String(SLIDES.length))}
                    aria-current={i === index}
                    className="group grid h-6 place-items-center outline-none"
                  >
                    <span
                      className={cn(
                        "relative block h-[3px] overflow-hidden rounded-full bg-white/35 transition-[width] duration-500 group-focus-visible:ring-2 group-focus-visible:ring-white",
                        i === index ? "w-8" : "w-3.5",
                      )}
                    >
                      {i === index ? (
                        reduce ? (
                          <span className="absolute inset-0 bg-white" />
                        ) : (
                          <span
                            key={`${s.id}-${index}`}
                            className="hc-fill absolute inset-0 bg-white"
                            style={{ "--hc-dur": `${DURATION}ms` } as React.CSSProperties}
                            onAnimationEnd={next}
                          />
                        )
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment logos */}
      <div className="al-container-wide mt-10 lg:mt-12">
        <div className="flex items-center gap-6 border-t border-(--al-hair) py-6 sm:py-7">
          <span className="shrink-0 text-[12.5px] text-(--al-faint) sm:text-[13px]">{c.logos}</span>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] lg:[mask-image:none]">
            <div className="hc-marquee flex w-max items-center lg:w-full lg:animate-none lg:justify-between">
              {[...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS].map((l, i) => (
                <span
                  key={`${l.name}-${i}`}
                  className={cn(
                    "flex h-10 shrink-0 items-center px-7 lg:flex-1 lg:justify-center lg:px-0",
                    i >= LOGOS.length && "lg:hidden",
                    i > 0 && "lg:border-s lg:border-(--al-hair)",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.src}
                    alt={i < LOGOS.length ? l.name : ""}
                    aria-hidden={i >= LOGOS.length}
                    className={cn(
                      "w-auto max-w-[120px] object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 dark:opacity-70",
                      l.line && "dark:brightness-0 dark:invert",
                      l.h,
                    )}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- The cards floating on each slide ---------------- */

function SlideCards({ id, reduce }: { id: SlideId; reduce: boolean }) {
  const pop = (delay: number) => ({
    initial: { opacity: 0, y: 16, scale: 0.95, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)", transition: { duration: reduce ? 0 : 0.3 } },
    transition: reduce ? { duration: 0 } : { duration: 0.7, delay, ease: EASE },
  });

  // Positions are physical: they follow each photo's empty areas.
  if (id === "shop")
    return (
      <>
        <motion.div {...pop(0.35)} className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <TodayCard reduce={reduce} />
        </motion.div>
        <motion.div {...pop(0.85)} className="absolute right-4 bottom-[76px] sm:right-6 sm:bottom-[96px]">
          <Ping tone="green" icon={Check} kind="sale" />
        </motion.div>
      </>
    );
  if (id === "online")
    return (
      <>
        <motion.div {...pop(0.35)} className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <OrderCard />
        </motion.div>
        <motion.div {...pop(0.85)} className="absolute bottom-[76px] left-4 sm:bottom-[96px] sm:left-6">
          <Ping tone="blue" icon={Bell} kind="order" />
        </motion.div>
      </>
    );
  return (
    <>
      <motion.div {...pop(0.35)} className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <StockCard reduce={reduce} />
      </motion.div>
      <motion.div {...pop(0.85)} className="absolute right-4 bottom-[76px] sm:right-6 sm:bottom-[96px]">
        <Ping tone="blue" icon={Truck} kind="ship" />
      </motion.div>
    </>
  );
}

const CARD =
  "rounded-[14px] bg-white p-3 text-[#1d1d1f] shadow-[0_18px_44px_-14px_rgba(0,0,0,0.38),0_0_0_1px_rgba(0,0,0,0.04)] sm:p-3.5";

/** Today's sales, split by where they came from. */
function TodayCard({ reduce }: { reduce: boolean }) {
  const c = useLandingCopy().hero.cards;
  const bars = [
    { label: c.shop, value: 62, fill: "bg-[#86efac]" },
    { label: c.online, value: 38, fill: "bg-[#1447e6] text-white" },
  ];
  return (
    <div className={cn(CARD, "w-[176px] sm:w-[218px]")}>
      <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[12px]">
        <span className="font-semibold">{c.today}</span>
        <span className="flex items-center gap-1 text-[10px] text-[#6e6e73] sm:text-[11px]">
          <span className="hc-live size-1.5 rounded-full bg-[#30d158]" />
          {c.live}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-[10px] bg-[#f4f4f6] p-1.5">
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="px-1 pb-1.5 text-[10px] text-[#6e6e73] sm:text-[11px]">{b.label}</div>
            <div className="relative h-[84px] overflow-hidden rounded-[7px] bg-white sm:h-[112px]">
              <motion.div
                initial={{ height: reduce ? `${b.value}%` : "0%" }}
                animate={{ height: `${b.value}%` }}
                transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.7 + i * 0.12, ease: EASE }}
                className={cn("absolute inset-x-0 bottom-0 rounded-[7px]", b.fill)}
              >
                <span dir="ltr" className="absolute top-1.5 start-1.5 text-[10.5px] font-bold tabular-nums sm:text-[11.5px]">
                  {b.value}%
                </span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** An online order, paid. */
function OrderCard() {
  const c = useLandingCopy().hero.cards;
  return (
    <div className={cn(CARD, "w-[190px] sm:w-[232px]")}>
      <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[12px]">
        <span className="font-semibold">{c.order}</span>
        <span dir="ltr" className="font-mono text-[10px] text-[#86868b] sm:text-[11px]">
          #A1B2C3
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 rounded-[10px] bg-[#f4f4f6] p-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-[#1447e6] text-white sm:size-11">
          <Shirt className="size-5" strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-medium sm:text-[12px]">{c.item}</span>
          <span className="text-[12px] font-bold tabular-nums sm:text-[13px]">{c.total}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
        <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 font-medium text-[#c81e1e]">{c.method}</span>
        <span className="flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 font-semibold text-[#15803d]">
          <Check className="size-3" strokeWidth={3} />
          {c.paid}
        </span>
      </div>
    </div>
  );
}

/** One stock for both: a piece leaves, the number follows everywhere. */
function StockCard({ reduce }: { reduce: boolean }) {
  const c = useLandingCopy().hero.cards;
  const [n, setN] = useState(reduce ? 47 : 48);
  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setN(47), 1500);
    return () => window.clearTimeout(t);
  }, [reduce]);
  return (
    <div className={cn(CARD, "w-[180px] sm:w-[222px]")}>
      <div className="flex items-center justify-between gap-2 text-[11px] sm:text-[12px]">
        <span className="font-semibold">{c.stock}</span>
        <span className="truncate text-[10px] text-[#86868b] sm:text-[11px]">{c.stockItem}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="relative inline-block h-[1.1em] overflow-hidden text-[34px] leading-none font-bold tabular-nums sm:text-[40px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={n}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-block"
            >
              {n}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="text-[12px] text-[#6e6e73]">{c.pieces}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 rounded-[9px] bg-[#f4f4f6] px-2 py-1.5 text-[10px] text-[#3a3a3c] sm:text-[11px]">
        <span className="flex shrink-0 items-center -space-x-1 rtl:space-x-reverse">
          <span className="size-2.5 rounded-full bg-[#30d158] ring-2 ring-[#f4f4f6]" />
          <span className="size-2.5 rounded-full bg-[#1447e6] ring-2 ring-[#f4f4f6]" />
        </span>
        <span className="truncate">{c.synced}</span>
      </div>
    </div>
  );
}

/** A notification pill, like the merchant's phone would show. */
function Ping({ tone, icon: Icon, kind }: { tone: "green" | "blue" | "ink"; icon: LucideIcon; kind: "sale" | "order" | "ship" }) {
  const c = useLandingCopy().hero.cards;
  const text = {
    sale: [c.sale, c.saleSub],
    order: [c.orderPing, c.orderPingSub],
    ship: [c.shipped, c.shippedSub],
  }[kind];
  return (
    <div className="flex max-w-[250px] items-center gap-2.5 rounded-full bg-white py-2 ps-2 pe-4 text-[#1d1d1f] shadow-[0_18px_44px_-14px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.04)]">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-white sm:size-9",
          tone === "green" ? "bg-[#1a8a3e]" : tone === "blue" ? "bg-[#1447e6]" : "bg-[#1d1d1f]",
        )}
      >
        <Icon className="size-4" strokeWidth={2.4} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[12px] font-semibold sm:text-[13px]">{text[0]}</span>
        <span className="truncate text-[10.5px] text-[#6e6e73] sm:text-[11.5px]">{text[1]}</span>
      </span>
    </div>
  );
}
