"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useId, useState } from "react";
import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const PRIMARY = "#1447e6";

// ── Storefront products ────────────────────────────────────────────────────────

const STORE_PRODUCTS = [
  { id: 1, name: "فستان ليلى الأسود",  price: "٤٥٠",  oldPrice: "٦٥٠",  disc: "-٣١٪", col: "#e11d48",  bg: "#fff1f2" },
  { id: 2, name: "بلوزة حرير ناعمة",   price: "٢٨٠",                    col: "#7c3aed", bg: "#f5f3ff" },
  { id: 3, name: "جاكيت جلد بيمي",    price: "٨٩٠",  oldPrice: "١٢٠٠", disc: "-٢٦٪", col: "#d97706",  bg: "#fffbeb" },
  { id: 4, name: "حقيبة يد فاخرة",    price: "٥٦٠",                    col: "#059669", bg: "#ecfdf5" },
];

// ── Dashboard stats ────────────────────────────────────────────────────────────

const DASH_STATS = [
  { label: "المبيعات",  value: "٢٤٫٥", unit: "ألف", icon: TrendingUp,  color: PRIMARY,    trend: "+١٨٪" },
  { label: "الطلبات",  value: "١٢٣",              icon: ShoppingCart, color: "#3b82f6",  trend: "+٨٪"  },
  { label: "العملاء",  value: "٨٤",               icon: Users,        color: "#ec4899",  trend: "+٥٪"  },
  { label: "المخزون",  value: "٤٨",               icon: Warehouse,    color: "#10b981"               },
];

// ── Revenue chart bars (relative heights, max=100) ─────────────────────────────

const BARS = [28, 45, 36, 58, 50, 72, 44, 82, 64, 90, 76, 100];
const BAR_MAX_H = 36; // px (h-9)

// ── Recent orders ──────────────────────────────────────────────────────────────

const ORDERS = [
  { id: "#٢٠٤١", name: "أحمد محمود",  status: "مدفوع",          amt: "٤٥٠ ج.م", sc: "#3b82f6", sb: "rgba(59,130,246,0.12)"  },
  { id: "#٢٠٤٠", name: "سارة أحمد",   status: "قيد المراجعة",  amt: "٨٩٠ ج.م", sc: "#d97706", sb: "rgba(217,119,6,0.12)"   },
  { id: "#٢٠٣٩", name: "محمد علي",    status: "تم التسليم",     amt: "٢٨٠ ج.م", sc: "#059669", sb: "rgba(5,150,105,0.12)"   },
];

// ── Floating notification cards ────────────────────────────────────────────────

const NOTIF = [
  {
    id: 0,
    icon: "🛒",
    title: "طلب جديد وصل!",
    sub: "+٤٥٠ ج.م",
    grad: "from-blue-500/20 to-blue-500/5",
    border: "rgba(59,130,246,0.28)",
    glow: "rgba(59,130,246,0.12)",
    pos: { top: "7%", left: "1.5%" } as React.CSSProperties,
  },
  {
    id: 1,
    icon: "💳",
    title: "تم الدفع بنجاح",
    sub: "فودافون كاش",
    grad: "from-emerald-500/20 to-emerald-500/5",
    border: "rgba(16,185,129,0.28)",
    glow: "rgba(16,185,129,0.12)",
    pos: { top: "7%", right: "1.5%" } as React.CSSProperties,
  },
  {
    id: 2,
    icon: "📦",
    title: "المخزون تحدّث",
    sub: "٤٨ قطعة متاحة",
    grad: "from-violet-500/20 to-violet-500/5",
    border: "rgba(124,58,237,0.28)",
    glow: "rgba(124,58,237,0.12)",
    pos: { bottom: "9%", left: "1.5%" } as React.CSSProperties,
  },
  {
    id: 3,
    icon: "👤",
    title: "عميل جديد",
    sub: "سارة أحمد",
    grad: "from-pink-500/20 to-pink-500/5",
    border: "rgba(236,72,153,0.28)",
    glow: "rgba(236,72,153,0.12)",
    pos: { bottom: "9%", right: "1.5%" } as React.CSSProperties,
  },
];

// ── SVG beam paths (viewBox 0 0 900 580) ──────────────────────────────────────
// Storefront right edge ≈ x=492, dashboard left edge ≈ x=590

const BEAMS = [
  { d: "M 492 250 C 536 250, 548 345, 590 345", color: PRIMARY,    delay: 1.3 },
  { d: "M 492 420 C 536 420, 548 108, 590 108", color: "#10b981",  delay: 1.75, reverse: true },
  { d: "M 492 350 C 536 350, 548 205, 590 205", color: "#f59e0b",  delay: 2.15 },
];

// ── Beam component ─────────────────────────────────────────────────────────────

function Beam({
  d,
  color,
  delay,
  reverse = false,
}: {
  d: string;
  color: string;
  delay: number;
  reverse?: boolean;
}) {
  const uid = useId();

  return (
    <g>
      <defs>
        <linearGradient
          id={`grad-${uid}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor={color} stopOpacity="0" />
          <stop offset="45%"  stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-120%" width="160%" height="340%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Animated glow beam */}
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#grad-${uid})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={`url(#glow-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { delay, duration: 1.1, ease: EASE },
          opacity:    { delay, duration: 0.35 },
        }}
      />

      {/* Travelling particle */}
      <motion.circle
        r="4"
        fill={color}
        filter={`url(#glow-${uid})`}
        style={{ offsetPath: `path("${d}")` } as React.CSSProperties}
        animate={{
          offsetDistance: reverse ? ["100%", "0%"] : ["0%", "100%"],
          opacity:        [0, 1, 1, 0],
          scale:          [0.6, 1.4, 1.1, 0.6],
        }}
        transition={{
          duration:     2.6,
          delay:        delay + 1.4,
          repeat:       Infinity,
          repeatDelay:  2,
          ease:         "easeInOut",
        }}
      />
    </g>
  );
}

// ── Floating notification card ─────────────────────────────────────────────────

function NotifCard({ n, show }: { n: (typeof NOTIF)[0]; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`notif-${n.id}`}
          className="absolute z-30"
          style={n.pos}
          initial={{ opacity: 0, scale: 0.72, y: 10 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.82,  y: -6 }}
          transition={{ duration: 0.44, ease: EASE }}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 backdrop-blur-xl bg-gradient-to-br",
              n.grad,
            )}
            style={{
              border:     `1px solid ${n.border}`,
              boxShadow: `0 8px 28px ${n.glow}, 0 2px 6px rgba(0,0,0,0.06)`,
            }}
          >
            <span className="text-sm leading-none shrink-0">{n.icon}</span>
            <div className="flex flex-col gap-0.5">
              <p className="whitespace-nowrap text-[11px] font-bold text-foreground/90 leading-tight">
                {n.title}
              </p>
              <p className="whitespace-nowrap text-[9.5px] text-muted-foreground leading-tight">
                {n.sub}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Left: Storefront panel ─────────────────────────────────────────────────────

function StorefrontPanel() {
  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 shrink-0 px-3 py-2 bg-slate-200/90 dark:bg-slate-800/80 border-b border-black/8 dark:border-white/[0.07]">
        <div className="flex gap-1.5 shrink-0">
          <div className="size-2.5 rounded-full bg-red-400" />
          <div className="size-2.5 rounded-full bg-yellow-400" />
          <div className="size-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-1.5 rounded-full bg-white/65 dark:bg-white/10 px-3 py-0.5 flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-green-400 shrink-0" />
          <span className="text-[8px] text-slate-500 dark:text-slate-400 font-mono truncate">
            متجرليلى.casho.store
          </span>
        </div>
      </div>

      {/* Store body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">

        {/* Store header */}
        <header className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <div
              className="size-6 rounded-lg text-white text-[9px] font-bold flex items-center justify-center shrink-0"
              style={{ background: PRIMARY }}
            >
              ل
            </div>
            <span className="text-[10px] font-bold text-slate-900 dark:text-white">متجر ليلى</span>
          </div>
          <div className="flex items-center gap-3">
            {["الرئيسية", "المنتجات", "عن المتجر"].map((item) => (
              <span key={item} className="text-[8px] text-slate-500 hidden lg:block">
                {item}
              </span>
            ))}
            <div className="relative">
              <ShoppingCart className="size-3.5 text-slate-600 dark:text-slate-400" />
              <span
                className="absolute -top-1.5 -right-1.5 size-3 rounded-full text-white text-[6px] font-bold flex items-center justify-center"
                style={{ background: PRIMARY }}
              >
                ٢
              </span>
            </div>
          </div>
        </header>

        {/* Hero banner */}
        <motion.div
          className="relative mx-3 mt-2.5 rounded-xl overflow-hidden shrink-0"
          style={{
            height: 38,
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #4f46e5 45%, #7c3aed 100%)`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
        >
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="relative flex flex-col justify-center gap-0.5 px-3 py-2.5">
            <p className="text-[8px] text-blue-200 font-medium">موسم الصيف ٢٠٢٥</p>
            <p className="text-[13px] font-bold text-white leading-tight">خصم حتى ٤٠٪</p>
          </div>
          <div className="absolute bottom-2 left-3">
            <div className="rounded-full bg-white/20 px-2 py-0.5 text-[7.5px] text-white font-semibold backdrop-blur-sm border border-white/20">
              تسوق الآن →
            </div>
          </div>
        </motion.div>

        {/* Section label */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
          <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">
            منتجاتنا
          </span>
          <span className="text-[8px] font-medium" style={{ color: PRIMARY }}>
            عرض الكل
          </span>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-2 px-3 flex-1 overflow-hidden pb-2">
          {STORE_PRODUCTS.map((p, i) => (
            <motion.div
              key={p.id}
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.09, duration: 0.5, ease: EASE }}
            >
              {/* Image placeholder */}
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ aspectRatio: "1 / 1", background: p.bg }}
              >
                {/* Decorative product shape */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="size-7 rounded-lg"
                    style={{ background: `${p.col}cc` }}
                  />
                </div>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, white 0%, transparent 60%)`,
                  }}
                />
                {p.disc && (
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-red-500 text-white text-[6.5px] font-bold px-1.5 py-0.5">
                    {p.disc}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex flex-col gap-0.5">
                <p className="text-[8px] font-medium text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">
                  {p.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold" style={{ color: PRIMARY }}>
                    {p.price} ج.م
                  </span>
                  {p.oldPrice && (
                    <span className="text-[7px] text-slate-400 line-through">{p.oldPrice}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cart strip */}
        <motion.div
          className="mx-3 mb-2.5 mt-auto shrink-0 rounded-xl flex items-center justify-between px-3 py-2"
          style={{
            background: `${PRIMARY}0e`,
            border: `1px solid ${PRIMARY}22`,
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
        >
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="size-3 shrink-0" style={{ color: PRIMARY }} />
            <span className="text-[8.5px] font-bold text-slate-800 dark:text-slate-200">
              السلة • ٢ منتج
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] font-bold" style={{ color: PRIMARY }}>
              ٧٣٠ ج.م
            </span>
            <div
              className="rounded-full px-2 py-0.5 text-[7.5px] text-white font-bold"
              style={{ background: PRIMARY }}
            >
              إتمام الشراء
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Right: Dashboard panel ─────────────────────────────────────────────────────

function DashboardPanel() {
  return (
    <div className="h-full flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-[52px] h-full bg-[#f7f8fc] dark:bg-slate-900/80 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center h-10 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div
            className="size-7 rounded-lg text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: PRIMARY }}
          >
            ل
          </div>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1.5 overflow-hidden">
          {[
            { Icon: LayoutDashboard, active: true },
            { Icon: ShoppingCart,    badge: "١٢" },
            { Icon: Package },
            { Icon: Users },
            { Icon: BarChart3 },
            { Icon: Warehouse,       badge: "جديد", bc: "#10b981" },
            { Icon: CreditCard },
          ].map(({ Icon, active, badge, bc }, i) => (
            <div
              key={i}
              className={cn(
                "relative w-full flex items-center justify-center rounded-[5px] py-1.5 cursor-default transition-colors",
                active
                  ? "text-white"
                  : "text-slate-400 dark:text-slate-600",
              )}
              style={active ? { background: PRIMARY } : undefined}
            >
              <Icon className="size-3.5" />
              {badge && (
                <span
                  className="absolute -top-0.5 -left-0.5 h-3.5 min-w-3.5 px-0.5 rounded-md text-white text-[5.5px] font-bold flex items-center justify-center"
                  style={{ background: bc ?? PRIMARY }}
                >
                  {badge}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
        {/* Topbar */}
        <div className="flex items-center justify-between px-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0 h-10">
          <span className="text-[9px] font-bold text-slate-900 dark:text-white">
            لوحة التحكم
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1">
              <Search className="size-2.5 text-slate-400" />
              <span className="text-[7.5px] text-slate-400">بحث...</span>
            </div>
            <div className="relative">
              <Bell className="size-3.5 text-slate-400" />
              <span
                className="absolute -top-0.5 -left-0.5 size-2 rounded-full"
                style={{ background: PRIMARY }}
              />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5 p-2 shrink-0">
          {DASH_STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-slate-900 p-2 flex flex-col gap-1.5"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.45, ease: EASE }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="size-5 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}18` }}
                  >
                    <Icon className="size-3" style={{ color: s.color }} />
                  </div>
                  {s.trend && (
                    <span className="text-[6.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-1 py-0.5">
                      {s.trend}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-none">
                      {s.value}
                    </p>
                    {s.unit && (
                      <p className="text-[7px] text-slate-400">{s.unit}</p>
                    )}
                  </div>
                  <p className="text-[7.5px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue chart */}
        <div className="px-2 shrink-0">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-slate-900 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8.5px] font-bold text-slate-900 dark:text-white">
                المبيعات — ٣٠ يوم
              </span>
              <span
                className="text-[6.5px] font-semibold rounded-full px-1.5 py-0.5"
                style={{ color: PRIMARY, background: `${PRIMARY}12` }}
              >
                ج.م
              </span>
            </div>
            <div className="flex items-end gap-[2px] h-9">
              {BARS.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-[2px]"
                  style={{
                    background:
                      i >= BARS.length - 3 ? PRIMARY : `${PRIMARY}3a`,
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.round((h / 100) * BAR_MAX_H) }}
                  transition={{
                    delay: 0.72 + i * 0.04,
                    duration: 0.5,
                    ease: EASE,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Orders table */}
        <div className="px-2 pt-1.5 pb-2 flex-1 overflow-hidden">
          <div className="h-full rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-slate-900 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[8.5px] font-bold text-slate-900 dark:text-white">
                آخر الطلبات
              </span>
              <span
                className="text-[7.5px] font-medium"
                style={{ color: PRIMARY }}
              >
                عرض الكل
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              {ORDERS.map((o, i) => (
                <motion.div
                  key={o.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100/70 dark:border-slate-800/70 last:border-0"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1, duration: 0.4, ease: EASE }}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-slate-800 dark:text-slate-200">
                      {o.id}
                    </span>
                    <span className="text-[7px] text-slate-400 truncate">{o.name}</span>
                  </div>
                  <div
                    className="rounded-full px-1.5 py-0.5 text-[6.5px] font-semibold whitespace-nowrap shrink-0"
                    style={{ background: o.sb, color: o.sc }}
                  >
                    {o.status}
                  </div>
                  <span className="text-[7.5px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0">
                    {o.amt}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Center connector ──────────────────────────────────────────────────────────

function CenterConnector() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 shrink-0 w-[88px] lg:w-[96px] relative z-10">
      <motion.div
        className="flex flex-col items-center gap-2.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.0, duration: 0.7, ease: EASE }}
      >
        {/* Casho logo badge */}
        <div
          className="rounded-full px-3 py-1 text-[8px] font-bold tracking-widest uppercase backdrop-blur-md"
          style={{
            background: `${PRIMARY}12`,
            border: `1px solid ${PRIMARY}2a`,
            color: `${PRIMARY}cc`,
          }}
        >
          كاشو
        </div>

        {/* Pulse dots */}
        <div className="flex flex-col gap-1.5 items-center">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="rounded-full shrink-0"
              style={{
                width:  4 - i * 0.6,
                height: 4 - i * 0.6,
                background: PRIMARY,
                opacity: 1 - i * 0.22,
              }}
              animate={{
                scale:   [1, 1.35, 1],
                opacity: [1 - i * 0.22, 1 - i * 0.06, 1 - i * 0.22],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.22,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* "Powered by Casho" label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.6 }}
      >
        <div
          className="rounded-full px-2 py-0.5 text-[6.5px] font-medium text-center whitespace-nowrap backdrop-blur-sm"
          style={{
            background: `${PRIMARY}0c`,
            color: `${PRIMARY}88`,
            border: `1px solid ${PRIMARY}18`,
          }}
        >
          مدعوم بكاشو
        </div>
      </motion.div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function SplitScreenHero() {
  const [shown, setShown] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    NOTIF.forEach((n, idx) => {
      let hideTimer: ReturnType<typeof setTimeout>;

      const show = () => {
        setShown((prev) => new Set([...prev, n.id]));
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setShown((prev) => {
            const next = new Set(prev);
            next.delete(n.id);
            return next;
          });
        }, 4000);
      };

      const startTimer = setTimeout(() => {
        show();
        const interval = setInterval(show, NOTIF.length * 2200);
        cleanups.push(() => clearInterval(interval));
      }, 1000 + idx * 1700);

      cleanups.push(() => {
        clearTimeout(startTimer);
        clearTimeout(hideTimer);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ minHeight: 320 }}
    >
      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
        {/* Radial center tint */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 60% at 50% 50%, rgba(20,71,230,0.045) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern — light */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,116,139,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(100,116,139,0.1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Grid pattern — dark */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Ambient glows */}
        <div
          className="absolute left-[22%] top-1/2 -translate-y-1/2 size-96 rounded-full blur-[140px] opacity-20 dark:opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(20,71,230,0.55) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-[18%] top-1/2 -translate-y-1/2 size-72 rounded-full blur-[110px] opacity-12 dark:opacity-22"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)",
          }}
        />
        {/* Border */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}
        />
        <div
          className="absolute inset-0 rounded-3xl hidden dark:block"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        />
      </div>

      {/* ── Floating notification cards ─────────────────────────────────────── */}
      {NOTIF.map((n) => (
        <NotifCard key={n.id} n={n} show={shown.has(n.id)} />
      ))}

      {/* ── SVG beam connections ────────────────────────────────────────────── */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 w-full h-full"
        viewBox="0 0 900 580"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        {BEAMS.map((b, i) => (
          <Beam key={i} {...b} />
        ))}
      </svg>

      {/* ── Desktop split screen ─────────────────────────────────────────────── */}
      <div
        className="relative z-10 hidden md:flex items-stretch"
        style={{ minHeight: 320, padding: "10px 10px 14px" }}
        dir="ltr"
      >
        {/* Left: Storefront */}
        <motion.div
          className="flex-[57] min-w-0 rounded-2xl overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/45"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.8, ease: EASE }}
        >
          <StorefrontPanel />
        </motion.div>

        {/* Center connector */}
        <CenterConnector />

        {/* Right: Dashboard */}
        <motion.div
          className="flex-[37] min-w-0 rounded-2xl overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/45"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.28, duration: 0.8, ease: EASE }}
        >
          <DashboardPanel />
        </motion.div>
      </div>

      {/* ── Mobile vertical stack ────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col gap-3 md:hidden"
        style={{ padding: "8px", minHeight: 260 }}
        dir="ltr"
      >
        <motion.div
          className="rounded-2xl overflow-hidden shadow-xl shadow-black/10"
          style={{ height: 140, border: "1px solid rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.7, ease: EASE }}
        >
          <StorefrontPanel />
        </motion.div>

        <motion.div
          className="rounded-2xl overflow-hidden shadow-xl shadow-black/10"
          style={{ height: 125, border: "1px solid rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.7, ease: EASE }}
        >
          <DashboardPanel />
        </motion.div>
      </div>

      {/* ── Bottom labels ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-5 left-[29%] z-20 hidden md:block"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.3, duration: 0.6 }}
      >
        <div
          className="rounded-full px-3 py-1 text-[8px] font-semibold backdrop-blur-md whitespace-nowrap"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(0,0,0,0.09)",
            color: "rgba(15,23,42,0.55)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          🛍️ ما يراه العميل
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-5 right-[11%] z-20 hidden md:block"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.6 }}
      >
        <div
          className="rounded-full px-3 py-1 text-[8px] font-semibold backdrop-blur-md whitespace-nowrap"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(0,0,0,0.09)",
            color: "rgba(15,23,42,0.55)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          📊 ما يديره التاجر
        </div>
      </motion.div>
    </div>
  );
}
