"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  animate as motionAnimate,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Star,
  BarChart3,
  Palette,
  ArrowLeft,
  Check,
  Globe,
  Package,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";

// ─── Animation variants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.11, duration: 0.75, ease: EASE },
  }),
};

// ─── Animated counter ────────────────────────────────────────────────────────

function Counter({ to, duration = 2.4 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const c = motionAnimate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setVal(Math.floor(v)),
    });
    return c.stop;
  }, [to, duration]);
  return <>{val.toLocaleString("ar-EG")}</>;
}

// ─── Live orders data ─────────────────────────────────────────────────────────

const LIVE_ORDERS = [
  { product: "فستان ليلى الأسود", price: "٤٥٠", city: "القاهرة" },
  { product: "بلوزة حرير ناعمة", price: "٢٨٠", city: "الإسكندرية" },
  { product: "جاكيت جلد بيمي", price: "٨٩٠", city: "الجيزة" },
];

// ─── Glassmorphic card wrapper ────────────────────────────────────────────────

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-xl shadow-black/8 dark:border-white/10 dark:bg-zinc-900/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Mini SVG sparkline ───────────────────────────────────────────────────────

function Sparkline() {
  return (
    <svg viewBox="0 0 100 40" className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1447e6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1447e6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,36 C5,33 10,31 15,27 S25,22 30,19 S40,15 50,12 S65,8 75,5 S88,3 100,1"
        stroke="#1447e6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0,36 C5,33 10,31 15,27 S25,22 30,19 S40,15 50,12 S65,8 75,5 S88,3 100,1 L100,40 L0,40 Z"
        fill="url(#sparkGrad)"
      />
    </svg>
  );
}

// ─── Arabic premium storefront mockup ───────────────────────────────────────

function ArabicStorefront() {
  const V = {
    bg: "var(--background)",
    card: "var(--card)",
    border: "var(--border)",
    fg: "var(--foreground)",
    muted: "var(--muted-foreground)",
    mutedBg: "var(--muted)",
    primary: "var(--primary)",
    priFg: "var(--primary-foreground)",
    pri20: "color-mix(in srgb, var(--primary) 20%, transparent)",
    pri12: "color-mix(in srgb, var(--primary) 12%, transparent)",
    pri30: "color-mix(in srgb, var(--primary) 30%, transparent)",
  };

  return (
    <div
      style={{ direction: "rtl", backgroundColor: V.bg, color: V.fg }}
      className="select-none overflow-hidden"
    >
      {/* ── Navbar ───────────────────────────────── */}
      <div
        style={{
          borderBottom: `1px solid ${V.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: 17,
            color: V.fg,
            letterSpacing: "0.03em",
          }}
        >
          زُهرة
        </span>
        <div
          style={{
            display: "flex",
            gap: 22,
            color: V.muted,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              color: V.primary,
              borderBottom: `1px solid ${V.primary}`,
              paddingBottom: 2,
            }}
          >
            الرئيسية
          </span>
          <span>نساء</span>
          <span>رجال</span>
          <span>تخفيضات</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            color: V.muted,
          }}
        >
          <ShoppingBag style={{ width: 16, height: 16 }} />
          <span
            style={{
              fontSize: 10,
              background: V.mutedBg,
              borderRadius: 999,
              padding: "1px 8px",
            }}
          >
            ٢
          </span>
        </div>
      </div>

      {/* ── Hero Banner ──────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", height: 300 }}>
        <div style={{ position: "absolute", inset: 0, background: V.card }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse 50% 90% at 16% 55%, ${V.pri20}, transparent)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, ${V.pri12} 0, ${V.pri12} 1px, transparent 0, transparent 50%)`,
            backgroundSize: "9px 9px",
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "5%",
            top: 0,
            width: 110,
            height: "100%",
            background: `linear-gradient(to bottom, ${V.pri20}, transparent)`,
            clipPath: "polygon(25% 0%,100% 0%,75% 100%,0% 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "19%",
            top: 0,
            width: 65,
            height: "100%",
            background: `linear-gradient(to bottom, ${V.pri12}, transparent)`,
            clipPath: "polygon(15% 0%,85% 0%,85% 100%,15% 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            right: 32,
            textAlign: "right",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${V.pri30}`,
              borderRadius: 999,
              padding: "3px 12px",
              fontSize: 9,
              fontWeight: 600,
              color: V.primary,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: V.primary,
                flexShrink: 0,
              }}
            />
            كولكشن جديد · ربيع ٢٠٢٥
          </div>
          <h3
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: V.fg,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            موضة
            <br />
            <span style={{ color: V.primary }}>الربيع</span>
          </h3>
          <p
            style={{
              fontSize: 11,
              color: V.muted,
              marginTop: 8,
              fontWeight: 400,
            }}
          >
            إيديشن محدود — متوفر لفترة محدودة
          </p>
          <button
            style={{
              marginTop: 16,
              background: V.primary,
              borderRadius: 999,
              padding: "9px 22px",
              fontSize: 11,
              fontWeight: 700,
              color: V.priFg,
              cursor: "pointer",
              border: "none",
            }}
          >
            تسوّق دلوقتي ←
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 28,
            background: V.pri12,
            border: `1px solid ${V.pri30}`,
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 9,
            color: V.primary,
            fontWeight: 600,
          }}
        >
          يبدأ من ٢٨٠ ج.م
        </div>
      </div>

      {/* ── Product grid ─────────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${V.border}`,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 1,
          backgroundColor: V.border,
        }}
      >
        {[
          {
            label: "فستان سهرة",
            price: "٦٥٠",
            badge: "جديد",
            bg: "linear-gradient(145deg,#4a1020,#1a0508)",
          },
          {
            label: "بلوزة حرير",
            price: "٣٢٠",
            badge: null,
            bg: "linear-gradient(145deg,#1c2535,#080d14)",
          },
          {
            label: "عباية فاخرة",
            price: "٨٩٠",
            badge: "−٢٠٪",
            bg: "linear-gradient(145deg,#2a1f10,#100c04)",
          },
          {
            label: "كاب ستايل",
            price: "٢٨٠",
            badge: null,
            bg: "linear-gradient(145deg,#141a14,#060a06)",
          },
        ].map((p) => (
          <div
            key={p.label}
            style={{ backgroundColor: V.card, padding: "14px 12px" }}
          >
            <div
              style={{
                height: 96,
                borderRadius: 8,
                background: p.bg,
                marginBottom: 10,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  height: "45%",
                  background:
                    "linear-gradient(to bottom,rgba(255,255,255,0.06),transparent)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: 32,
                  height: 40,
                  background: "rgba(255,255,255,0.04)",
                  clipPath: "polygon(0 0,0 100%,100% 100%)",
                }}
              />
              {p.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 7,
                    background: p.badge.startsWith("−")
                      ? "rgba(239,68,68,0.88)"
                      : V.primary,
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 8,
                    fontWeight: 700,
                    color: p.badge.startsWith("−") ? "#fff" : V.priFg,
                  }}
                >
                  {p.badge}
                </div>
              )}
            </div>
            <p
              style={{
                fontSize: 10,
                color: V.muted,
                fontWeight: 500,
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {p.label}
            </p>
            <p
              style={{
                fontSize: 12,
                color: V.primary,
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {p.price} ج.م
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse parallax
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = { stiffness: 45, damping: 18, mass: 0.8 };
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  // Neon border spotlight position (0-100 percentage)
  const [glowPct, setGlowPct] = useState({ x: 50, y: 40 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setGlowPct({ x: nx * 100, y: ny * 100 });
    rawX.set((nx - 0.5) * 30);
    rawY.set((ny - 0.5) * 30);
  }
  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    setGlowPct({ x: 50, y: 40 });
  }

  // Floating card parallax (different depths)
  const f1x = useTransform(springX, [-15, 15], [-10, 10]);
  const f1y = useTransform(springY, [-15, 15], [-8, 8]);
  const f2x = useTransform(springX, [-15, 15], [14, -14]);
  const f2y = useTransform(springY, [-15, 15], [-6, 6]);
  const f3x = useTransform(springX, [-15, 15], [-12, 12]);
  const f3y = useTransform(springY, [-15, 15], [8, -8]);
  const f4x = useTransform(springX, [-15, 15], [8, -8]);
  const f4y = useTransform(springY, [-15, 15], [12, -12]);

  // Live orders rotation
  const [orderIdx, setOrderIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setOrderIdx((i) => (i + 1) % LIVE_ORDERS.length),
      2800,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-visible"
    >
      {/* ── Stacked layout: copy top, visual bottom ─────────── */}
      <div className="flex flex-col items-center gap-8 pt-10 pb-0">
        {/* ════════════════════════════════════════════════════════
            TOP: Copy block — centered
            ════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center text-center gap-6 w-full  mx-auto">
          {/* Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/7 px-4 py-2 text-sm font-semibold text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              +5000 متجر نشط على كاشو
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <h1 className="text-[2.6rem] leading-snug sm:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.4rem] font-extrabold tracking-tight">
              <span className="block text-foreground">سيبك من زحمة الشات</span>
              <span className="block bg-linear-to-l from-primary  to-sky-500 bg-clip-text text-transparent font-bold">
                وابدأ بيزنس حقيقي دلوقتي...
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-base lg:text-lg text-muted-foreground leading-[1.8] max-w-2xl"
          >
            <span className="font-bold ">كاشو</span> منصة تجارة إلكترونية مصرية بتخليك تبني متجرك
            الإلكتروني وتشغله بسهولة، من غير تعقيدات ولا مصاريف خفية. انضم لآلاف
            التجار اللي بيحققوا مبيعات يومية وبيكبروا البيزنس بتاعهم مع <span className="font-bold">كاشو</span> في 3 دقايق بس ...
          </motion.p>

          {/* Feature pills */}
          <motion.ul
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-2.5"
          >
            {[
              { icon: Palette, label: "تصميم فاخر" },
              { icon: Package, label: "طلبات لحظية" },
              { icon: BarChart3, label: "تحليلات ذكية" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground/80"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap justify-center items-center gap-3 pt-1"
          >
            <Button size="lg" className="h-[52px] px-8 text-[15px]" asChild>
              <Link href="/register">
                <span className="font-bold">ابدأ مجاناً دلوقتي</span>
                <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-[52px] px-8 text-[15px]"
              asChild
            >
              <Link href="#features">
                <span className="font-bold">شوف المميزات أكتر</span>
                <Globe className="size-4 opacity-70" />
              </Link>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-4 pt-1"
          >
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {[
                "bg-rose-400",
                "bg-primary",
                "bg-emerald-400",
                "bg-blue-400",
                "bg-violet-400",
              ].map((color, i) => (
                <div
                  key={i}
                  className={cn(
                    "size-8 rounded-full ring-2 ring-background",
                    color,
                  )}
                />
              ))}
            </div>
            <div className="flex flex-col gap-0.5 text-start">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-primary text-primary"
                  />
                ))}
                <span className="ms-1 text-xs font-bold text-foreground">
                  ٥.٠
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">+٥٬٠٠٠</span>{" "}
                تاجر بيثقوا في كاشو
              </p>
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════════════════
            BOTTOM: Full-bleed visual ecosystem
            ════════════════════════════════════════════════════════ */}
        <motion.div
          className="relative w-full -mx-4 sm:-mx-5 md:-mx-6 lg:-mx-8 rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ height: "580px" }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: EASE }}
        >
          {/* ── NEON BORDER LAYER 1: constant glow ───────────── */}
          <div
            className="pointer-events-none absolute inset-0 z-30 rounded-xl sm:rounded-2xl"
            style={{
              border: "1px solid rgba(20,71,230,0.3)",
              boxShadow: [
                "0 0 0 1px rgba(20,71,230,0.08)",
                "0 0 24px rgba(20,71,230,0.35)",
                "0 0 60px rgba(20,71,230,0.2)",
                "0 0 120px rgba(20,71,230,0.1)",
                "inset 0 0 40px rgba(20,71,230,0.06)",
              ].join(", "),
            }}
          />

          {/* ── NEON BORDER LAYER 2: BorderBeam (normal + reverse) ── */}
          <BorderBeam
            colorFrom="var(--primary)"
            colorTo="transparent"
            size={160}
            duration={8}
            borderWidth={2}
            className="z-30"
          />
          <BorderBeam
            colorFrom="var(--primary)"
            colorTo="transparent"
            size={160}
            duration={8}
            borderWidth={2}
            reverse
            delay={4}
            className="z-30"
          />

          {/* ── NEON BORDER LAYER 3: mouse spotlight ─────────── */}
          <div
            className="pointer-events-none absolute z-30"
            style={{
              inset: "-1px",
              borderRadius: "inherit",
              padding: "1.5px",
              background: `radial-gradient(circle 420px at ${glowPct.x}% ${glowPct.y}%, rgba(20,71,230,0.65), transparent 60%)`,
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              transition: "background 80ms linear",
            }}
          />

          {/* ── Browser chrome ────────────────────────────────── */}
          <div className="relative flex items-center gap-1.5 px-5 py-3 bg-card border-b border-white/8 z-10">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-400/80" />
            <div className="mx-4 flex-1 rounded-md bg-white/8 px-3 py-1.5 text-[11px] text-primary text-center tracking-wide font-semibold">
              zuhra.casho.store
            </div>
          </div>

          {/* ── Arabic storefront fills the container ─────────── */}
          <ArabicStorefront />

          {/* ══ CARD 1 — Revenue ══ */}
          <motion.div
            style={{ x: f1x, y: f1y }}
            className="absolute top-14 right-6 z-20"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <GlassCard className="w-44.5 p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                      <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      اليوم
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    +١٨٪
                  </span>
                </div>
                <div className="text-[22px] font-extrabold text-foreground leading-none">
                  <Counter to={12450} />
                  <span className="text-sm font-semibold text-muted-foreground ms-1">
                    ج.م
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  إجمالي المبيعات
                </p>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ══ CARD 2 — Live Orders ══ */}
          <motion.div
            style={{ x: f2x, y: f2y }}
            className="absolute top-10 left-6 z-20"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          >
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{
                duration: 4.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <GlassCard className="w-49 p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    طلب جديد
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={orderIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28 }}
                  >
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {LIVE_ORDERS[orderIdx].product}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {LIVE_ORDERS[orderIdx].city}
                      </span>
                      <span className="text-[12px] font-bold text-primary">
                        {LIVE_ORDERS[orderIdx].price} ج.م
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ══ CARD 3 — Theme Builder ══ */}
          <motion.div
            style={{ x: f3x, y: f3y }}
            className="absolute bottom-10 left-6 z-20"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.7, ease: EASE }}
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{
                duration: 5.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <GlassCard className="w-40.5 p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-7 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                    <Palette className="size-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">
                    Theme Builder
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    "#1447e6",
                    "#0a0a0a",
                    "#f59e0b",
                    "#10b981",
                    "#ef4444",
                    "#8b5cf6",
                    "#ec4899",
                    "#06b6d4",
                    "#f97316",
                    "#6366f1",
                  ].map((c) => (
                    <div
                      key={c}
                      className="aspect-square rounded-full ring-1 ring-white/50 dark:ring-zinc-700/50"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ══ CARD 4 — Analytics ══ */}
          <motion.div
            style={{ x: f4x, y: f4y }}
            className="absolute bottom-10 right-6 z-20"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.7, ease: EASE }}
          >
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{
                duration: 4.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            >
              <GlassCard className="w-40.5 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="size-4 text-primary" />
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      الزيارات
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary">
                    +١٢٤٪
                  </span>
                </div>
                <Sparkline />
                <p className="text-[11px] text-muted-foreground mt-1">
                  هذا الشهر
                </p>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* ══ Badge — active customers ══ */}
          <motion.div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.7, duration: 0.65, ease: EASE }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5,
              }}
            >
              <GlassCard className="flex items-center gap-2.5 rounded-full px-4 py-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <Users className="size-3.5 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-foreground whitespace-nowrap">
                  ٢٣ عميل أونلاين دلوقتي
                </span>
              </GlassCard>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
