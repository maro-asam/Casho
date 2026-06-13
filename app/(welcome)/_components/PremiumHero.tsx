"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Play,
  Zap,
  Shield,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Star,
} from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.13, duration: 0.85, ease: EASE },
  }),
};

const CHART_BARS = [28, 45, 36, 62, 50, 78, 58, 91, 70, 100, 82, 95] as const;
const BAR_MAX_H = 72; // px

const METRICS = [
  {
    label: "Revenue",
    value: "$48.2K",
    delta: "+23%",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.18)",
    Icon: DollarSign,
  },
  {
    label: "Users",
    value: "12,847",
    delta: "+18%",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.15)",
    Icon: Users,
  },
  {
    label: "Growth",
    value: "3.84%",
    delta: "+4.2%",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.15)",
    Icon: TrendingUp,
  },
] as const;

const ACTIVITY = [
  { text: "New deployment live", time: "just now", dot: "#a78bfa" },
  { text: "1,200 new signups", time: "2h ago", dot: "#38bdf8" },
  { text: "Payment processed", time: "4h ago", dot: "#34d399" },
];

const FEATURES = [
  { Icon: Zap, label: "Instant Deploy", color: "#a78bfa" },
  { Icon: Shield, label: "99.9% Uptime", color: "#38bdf8" },
  { Icon: BarChart3, label: "Live Analytics", color: "#34d399" },
] as const;

// ─── Animated Background ──────────────────────────────────────────────────────

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.45) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Blob — top-left purple */}
      <motion.div
        className="absolute -top-60 -left-60 rounded-full"
        style={{
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%)",
          filter: "blur(70px)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob — right cyan */}
      <motion.div
        className="absolute top-[20%] -right-40 rounded-full"
        style={{
          width: 550,
          height: 550,
          background:
            "radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
        animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
      />

      {/* Blob — bottom-center green */}
      <motion.div
        className="absolute bottom-[-15%] left-[28%] rounded-full"
        style={{
          width: 480,
          height: 480,
          background:
            "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.14, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Top-center conic glow rays */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 900,
          height: 420,
          background:
            "conic-gradient(from 270deg at 50% 0%, transparent 18%, rgba(139,92,246,0.07) 32%, rgba(6,182,212,0.055) 50%, rgba(139,92,246,0.07) 68%, transparent 82%)",
          filter: "blur(24px)",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "160px 160px",
        }}
      />
    </div>
  );
}

// ─── Dashboard Preview ─────────────────────────────────────────────────────────

function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [7, -7]),
    { stiffness: 130, damping: 22 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-9, 9]),
    { stiffness: 130, damping: 22 }
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative flex items-center justify-center"
      style={{ perspective: 1100 }}
    >
      {/* Ambient glow underneath card */}
      <div
        className="absolute inset-x-10 bottom-0 h-28 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, rgba(139,92,246,0.55) 0%, rgba(6,182,212,0.45) 100%)",
          filter: "blur(55px)",
        }}
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 1.0, ease: EASE }}
        className="relative w-full max-w-[500px]"
      >
        {/* ── Main glass card ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              "0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5 shrink-0">
                <div className="size-2.5 rounded-full bg-red-500/70" />
                <div className="size-2.5 rounded-full bg-yellow-500/70" />
                <div className="size-2.5 rounded-full bg-green-500/70" />
              </div>
              <div
                className="h-4 w-px shrink-0"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
                Analytics Dashboard
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.22)",
              }}
            >
              <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-wide">
                LIVE
              </span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-2.5 p-4">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{
                  background: m.bg,
                  border: `1px solid ${m.border}`,
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 + i * 0.1, duration: 0.5, ease: EASE }}
              >
                <div className="flex items-center justify-between">
                  <m.Icon className="size-3.5" style={{ color: m.color }} />
                  <span
                    className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: m.color, background: `${m.color}1a` }}
                  >
                    {m.delta}
                  </span>
                </div>
                <div>
                  <p
                    className="text-[13px] font-black text-white leading-none tabular-nums"
                  >
                    {m.value}
                  </p>
                  <p className="text-[8.5px] text-slate-500 mt-0.5 font-medium">
                    {m.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="px-4 pb-3">
            <div
              className="rounded-xl p-3.5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.055)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
                  Revenue — 12 weeks
                </span>
                <div className="flex items-center gap-1">
                  <Activity className="size-2.5 text-violet-400" />
                  <span className="text-[9px] font-semibold text-violet-400">
                    ↑ 23.4%
                  </span>
                </div>
              </div>
              <div
                className="flex items-end gap-[3px]"
                style={{ height: BAR_MAX_H }}
              >
                {CHART_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      background:
                        i >= CHART_BARS.length - 3
                          ? "linear-gradient(to top, #8b5cf6 0%, #06b6d4 100%)"
                          : "rgba(139,92,246,0.22)",
                    }}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: Math.round((h / 100) * BAR_MAX_H),
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.95 + i * 0.045,
                      duration: 0.55,
                      ease: EASE,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
                  <span key={m} className="text-[7px] text-slate-600 font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="px-4 pb-4">
            <span className="text-[10px] font-semibold text-slate-500 block mb-2.5 tracking-wide uppercase">
              Recent Activity
            </span>
            <div className="space-y-2">
              {ACTIVITY.map((a, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 1.35 + i * 0.12,
                    duration: 0.45,
                    ease: EASE,
                  }}
                >
                  <motion.div
                    className="size-1.5 rounded-full shrink-0"
                    style={{ background: a.dot }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                  <span className="text-[10px] text-slate-300 flex-1 font-medium">
                    {a.text}
                  </span>
                  <span className="text-[9px] text-slate-600 font-medium shrink-0">
                    {a.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Floating pill: top-right ── */}
        <motion.div
          className="absolute -top-5 -right-8 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 z-10"
          style={{
            background: "rgba(139,92,246,0.14)",
            border: "1px solid rgba(139,92,246,0.32)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(139,92,246,0.2)",
          }}
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.5, ease: EASE }}
        >
          <span className="text-lg leading-none">🚀</span>
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">
              1,200 new users
            </p>
            <p className="text-[8.5px] text-slate-400 leading-tight">
              this week
            </p>
          </div>
        </motion.div>

        {/* ── Floating pill: bottom-left ── */}
        <motion.div
          className="absolute -bottom-5 -left-8 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 z-10"
          style={{
            background: "rgba(6,182,212,0.11)",
            border: "1px solid rgba(6,182,212,0.28)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(6,182,212,0.15)",
          }}
          initial={{ opacity: 0, scale: 0.7, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.5, ease: EASE }}
        >
          <span className="text-lg leading-none">⚡</span>
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">
              Deploy in 2s
            </p>
            <p className="text-[8.5px] text-slate-400 leading-tight">
              instant preview
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

interface CTAButtonProps {
  href: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
}

function CTAButton({ href, variant = "primary", children }: CTAButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.035, y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Hover glow bloom */}
      {isPrimary && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(6,182,212,0.5))",
            filter: "blur(18px)",
            transform: "scale(1.1)",
          }}
        />
      )}
      <Link
        href={href}
        className={cn(
          "relative flex items-center gap-2.5 rounded-xl px-6 py-3 text-[14px] font-semibold overflow-hidden transition-all duration-200",
          isPrimary
            ? "text-white"
            : "text-slate-300 hover:text-white border hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.07]",
        )}
        style={
          isPrimary
            ? {
                background:
                  "linear-gradient(135deg, #8b5cf6 0%, #0ea5e9 80%, #06b6d4 100%)",
                boxShadow:
                  "0 0 0 1px rgba(139,92,246,0.35), 0 4px 22px rgba(139,92,246,0.28)",
                border: "none",
              }
            : {
                borderColor: "rgba(255,255,255,0.1)",
              }
        }
      >
        {/* Shine sweep on primary */}
        {isPrimary && (
          <motion.div
            className="absolute top-0 h-full w-[45%] -skew-x-12 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
            }}
            animate={{ x: ["-120%", "320%"] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeInOut",
            }}
          />
        )}
        {children}
      </Link>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function PremiumHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-14 lg:gap-20 items-center">

          {/* ══════════════════════ LEFT — COPY ══════════════════════ */}
          <div className="flex flex-col gap-7 text-center lg:text-left items-center lg:items-start">

            {/* Badge */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold text-violet-300"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.28)",
                }}
              >
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
                </span>
                New: AI-powered analytics v2.0
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-[70px] font-black tracking-tight leading-[1.04]">
                <span className="block text-white">Build Faster.</span>
                <span
                  className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #c4b5fd 0%, #67e8f9 55%, #6ee7b7 100%)",
                  }}
                >
                  Scale Smarter.
                </span>
              </h1>
            </motion.div>

            {/* Subheadline */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-[17px] text-slate-400 leading-[1.78] max-w-[420px]"
            >
              A modern toolkit for building SaaS products with{" "}
              <span className="text-slate-200 font-semibold">
                speed and precision.
              </span>{" "}
              Ship your ideas before competitors even start.
            </motion.p>

            {/* Feature chips */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
            >
              {FEATURES.map(({ Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon className="size-3.5 shrink-0" style={{ color }} />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3"
            >
              <CTAButton href="/register" variant="primary">
                Get Started
                <ArrowRight className="size-4" />
              </CTAButton>

              <CTAButton href="#demo" variant="ghost">
                <div
                  className="flex items-center justify-center size-5 rounded-full shrink-0"
                  style={{
                    background: "rgba(139,92,246,0.28)",
                    border: "1px solid rgba(139,92,246,0.5)",
                  }}
                >
                  <Play
                    className="size-2.5 text-violet-300"
                    fill="currentColor"
                    style={{ marginLeft: "1px" }}
                  />
                </div>
                View Demo
              </CTAButton>
            </motion.div>

            {/* Social proof */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex items-center gap-4 pt-1"
            >
              <div className="flex -space-x-2.5 shrink-0">
                {[
                  "#8b5cf6",
                  "#06b6d4",
                  "#10b981",
                  "#3b82f6",
                  "#ec4899",
                ].map((color, i) => (
                  <div
                    key={i}
                    className="size-8 rounded-full"
                    style={{
                      background: color,
                      boxShadow: "0 0 0 2.5px #030712",
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-3"
                      fill="#a78bfa"
                      color="#a78bfa"
                    />
                  ))}
                  <span className="text-[11px] font-bold text-white ml-1">
                    5.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  <span className="text-slate-300 font-semibold">50,000+</span>{" "}
                  developers trust us
                </p>
              </div>
            </motion.div>
          </div>

          {/* ══════════════════════ RIGHT — VISUAL ══════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="relative hidden lg:block"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
