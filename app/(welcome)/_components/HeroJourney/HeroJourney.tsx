"use client";

import { motion } from "framer-motion";
import { useLang } from "../../_i18n/LanguageContext";
import JourneyCard, { type JourneyCardData } from "./JourneyCard";
import AnimatedConnection from "./AnimatedConnection";
import FloatingEvents from "./FloatingEvent";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Accent colors + gradient classes per card — independent of translations
const CARD_STYLES = [
  { accentColor: "#38bdf8", gradientFrom: "from-sky-400",     gradientTo: "to-blue-500",    delay: 0.3 },
  { accentColor: "#a78bfa", gradientFrom: "from-violet-400",  gradientTo: "to-purple-500",  delay: 0.5 },
  { accentColor: "#fbbf24", gradientFrom: "from-amber-400",   gradientTo: "to-orange-500",  delay: 0.7 },
  { accentColor: "#34d399", gradientFrom: "from-emerald-400", gradientTo: "to-teal-500",    delay: 0.9 },
  { accentColor: "#fb923c", gradientFrom: "from-orange-400",  gradientTo: "to-red-500",     delay: 1.1 },
  { accentColor: "#4ade80", gradientFrom: "from-emerald-400", gradientTo: "to-green-500",   delay: 1.3 },
];

const IDS = ["product", "cart", "order", "payment", "shipping", "profit"] as const;
const ICONS = ["📦", "🛒", "📋", "💳", "🚚", "📈"] as const;

// SVG coordinate system: 900 × 560
// Cols: CL=165 (left), CR=735 (right). Rows: R1=118, R2=308, R3=468
const SVG_W = 900;
const SVG_H = 560;
const CL = 165;
const CR = 735;
const R1 = 118;
const R2 = 308;
const R3 = 468;

const CONNECTIONS = [
  { d: `M ${CL+88} ${R1} C ${CL+190} ${R1-28}, ${CR-190} ${R1+28}, ${CR-88} ${R1}`, color: "#a78bfa", delay: 0.8 },
  { d: `M ${CR} ${R1+56} C ${CR+52} ${R1+140}, ${CL-52} ${R2-110}, ${CL} ${R2-56}`, color: "#fbbf24", delay: 1.05, reverse: true },
  { d: `M ${CL+88} ${R2} C ${CL+190} ${R2-28}, ${CR-190} ${R2+28}, ${CR-88} ${R2}`, color: "#34d399", delay: 1.25 },
  { d: `M ${CR} ${R2+56} C ${CR+52} ${R2+130}, ${CL-52} ${R3-110}, ${CL} ${R3-56}`, color: "#fb923c", delay: 1.5,  reverse: true },
  { d: `M ${CL+88} ${R3} C ${CL+190} ${R3-28}, ${CR-190} ${R3+28}, ${CR-88} ${R3}`, color: "#4ade80", delay: 1.7 },
];

export default function HeroJourney() {
  const { t } = useLang();
  const jt = t.hero.journey;

  const cards: JourneyCardData[] = jt.cards.map((c, i) => ({
    id: IDS[i],
    icon: ICONS[i],
    title: c.title,
    status: c.status,
    meta: c.meta,
    price: c.price,
    orderId: c.orderId,
    growth: c.growth,
    step: c.step,
    accentColor: CARD_STYLES[i].accentColor,
    gradientFrom: CARD_STYLES[i].gradientFrom,
    gradientTo: CARD_STYLES[i].gradientTo,
    delay: CARD_STYLES[i].delay,
  }));

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ minHeight: 560 }}>

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {/* base layer — light: subtle blue-tinted white; dark: deep navy */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
        {/* radial center tint */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)" }}
        />
        {/* grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,116,139,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(100,116,139,0.12) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* dark-mode override for grid — stronger */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.045) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* ambient glows */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-120 w-150 rounded-full opacity-30 dark:opacity-100 blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
        />
        <div className="absolute left-[18%] top-[28%] h-52 w-52 rounded-full blur-[100px] opacity-20 dark:opacity-60 bg-violet-500/15" />
        <div className="absolute right-[18%] bottom-[22%] h-52 w-52 rounded-full blur-[100px] opacity-20 dark:opacity-60 bg-emerald-500/15" />
        {/* border */}
        <div className="absolute inset-0 rounded-3xl"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        />
        <div className="absolute inset-0 rounded-3xl hidden dark:block"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        />
      </div>

      {/* ── Floating events ────────────────────────────────────────────────── */}
      <FloatingEvents events={jt.events} />

      {/* ── Desktop zig-zag ─────────────────────────────────────────────────── */}
      <div className="relative z-10 hidden md:block" style={{ height: 560 }}>
        {/* SVG connections */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          fill="none"
        >
          {CONNECTIONS.map((c, i) => (
            <AnimatedConnection key={i} d={c.d} color={c.color} delay={c.delay} reverse={c.reverse} />
          ))}
        </svg>

        {/* Row 1 */}
        <div className="absolute" style={{ top: 46, left: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[0]} />
        </div>
        <div className="absolute" style={{ top: 46, right: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[1]} />
        </div>

        {/* Row 2 */}
        <div className="absolute" style={{ top: 232, left: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[2]} />
        </div>
        <div className="absolute" style={{ top: 232, right: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[3]} />
        </div>

        {/* Row 3 */}
        <div className="absolute" style={{ top: 390, left: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[4]} />
        </div>
        <div className="absolute" style={{ top: 390, right: "calc(18.3% - 72px)" }}>
          <JourneyCard data={cards[5]} />
        </div>

        {/* Center badge */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.1, duration: 0.6, ease: EASE }}
        >
          <div
            className="rounded-full px-4 py-1.5 text-[10px] font-semibold backdrop-blur-sm tracking-widest uppercase"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.18)",
              color: "rgba(99,102,241,0.7)",
            }}
          >
            {jt.sectionLabel}
          </div>
          <div
            className="text-[9px] tracking-[0.18em] uppercase font-medium"
            style={{ color: "rgba(100,116,139,0.5)" }}
          >
            {jt.poweredBy}
          </div>
        </motion.div>
      </div>

      {/* ── Mobile vertical ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex md:hidden flex-col items-center py-8 px-4">
        {cards.map((card, i) => (
          <div key={card.id} className="w-full max-w-72 flex flex-col items-center">
            <JourneyCard data={card} className="w-full" />
            {i < cards.length - 1 && (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: card.delay + 0.4 }}
              >
                <motion.div
                  className="w-px my-1 rounded-full"
                  style={{
                    height: 28,
                    background: `linear-gradient(to bottom, ${card.accentColor}60, ${CARD_STYLES[i+1].accentColor}60)`,
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: card.delay + 0.5, duration: 0.35 }}
                />
                <motion.div
                  className="size-1.5 rounded-full mb-1"
                  style={{ background: CARD_STYLES[i+1].accentColor }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: card.delay + 0.7, duration: 0.3 }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
