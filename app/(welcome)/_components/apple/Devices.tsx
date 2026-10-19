"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  CirclePercent,
  Copy,
  ExternalLink,
  Footprints,
  Glasses,
  Globe,
  Heart,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Menu,
  MonitorCheck,
  Package,
  PaintRoller,
  Plus,
  Quote,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  User,
  Watch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";

/* ------------------------------------------------------------------ */
/* Scaling frame — mockups are laid out at a fixed "real" size and      */
/* scaled to their container, so they keep true proportions everywhere. */
/* ------------------------------------------------------------------ */

function Scaled({
  width,
  height,
  className,
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, height, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Merchant dashboard — mirrors app/(merchant)/dashboard overview and   */
/* uses the app's own theme tokens. The real dashboard is Arabic-only,  */
/* so the mock is too.                                                  */
/* ------------------------------------------------------------------ */

const ar = new Intl.NumberFormat("ar-EG");
const money = (n: number) => `${ar.format(n)} ج.م`;

type NavMock = { name: string; icon: typeof Package; active?: boolean; badge?: string };

const NAV: { title?: string; items: NavMock[] }[] = [
  {
    items: [
      { name: "نظرة عامة", icon: LayoutDashboard, active: true },
      { name: "الطلبات", icon: ShoppingCart, badge: "٣" },
      { name: "المنتجات", icon: Package },
      { name: "نقطة البيع (POS)", icon: MonitorCheck },
      { name: "التقارير", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "المتجر",
    items: [
      { name: "التصنيفات", icon: Tag },
      { name: "تخصيص المتجر", icon: PaintRoller },
    ],
  },
  {
    title: "التسويق",
    items: [
      { name: "أكواد الخصم", icon: CirclePercent },
      { name: "عربات التسوق المهجورة", icon: ShoppingBag },
    ],
  },
];

const KPIS = [
  { label: "الإيرادات", value: money(124580), prev: money(105300), delta: "١٨٫٣٪", series: [8, 10, 9, 12, 11, 14, 13, 16, 15, 19] },
  { label: "الطلبات", value: ar.format(1284), prev: ar.format(1142), delta: "١٢٫٤٪", series: [6, 7, 9, 8, 10, 9, 12, 11, 13, 14] },
  { label: "الزيارات", value: ar.format(38240), prev: ar.format(35010), delta: "٩٫٢٪", series: [10, 12, 11, 13, 12, 15, 14, 15, 17, 18] },
  { label: "معدل التحويل", value: "٣٫٤٪", prev: "٢٫٨٪", delta: "٢١٫٤٪", series: [5, 6, 6, 7, 6, 8, 8, 9, 9, 11] },
];

// 30 days of revenue, deterministic so SSR and client match.
const DAILY = Array.from({ length: 30 }, (_, i) => 40 + Math.sin(i / 3.2) * 12 + i * 1.6 + ((i * 7) % 5) * 2.4);

function sparkPath(values: number[], w: number, h: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const step = w / (values.length - 1);
  return values
    .map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(" ");
}

function smoothPath(values: number[], w: number, h: number) {
  const max = Math.max(...values) * 1.1;
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - (v / max) * h] as const);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = ((x0 + x1) / 2).toFixed(1);
    d += ` C${cx},${y0.toFixed(1)} ${cx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

function Delta({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
      <ArrowUpRight className="size-3" />
      {value}
    </span>
  );
}

export function DashboardWindow({ className }: { className?: string }) {
  const chartW = 620;
  const chartH = 168;
  const line = smoothPath(DAILY, chartW, chartH);

  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-[14px] bg-background text-foreground ring-1 ring-black/10 dark:ring-white/10 sm:rounded-[18px]",
        className,
      )}
    >
      <Scaled width={1280} height={800}>
        <div className="flex h-full flex-col" dir="rtl">
          {/* Browser chrome */}
          <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-muted px-4" dir="ltr">
            <div className="flex gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex h-6 w-80 items-center justify-center rounded-md bg-background text-[12px] text-muted-foreground">
              app.casho.store
            </div>
            <div className="w-14" />
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Sidebar */}
            <aside className="flex w-60 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
              <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-3">
                <div className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-xs font-bold text-white">ن</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">نور</p>
                  <p className="text-xs text-sidebar-foreground/60" dir="ltr">
                    nour.casho.store
                  </p>
                </div>
              </div>
              <nav className="flex-1 space-y-5 px-2 py-3">
                {NAV.map((section, i) => (
                  <div key={i}>
                    {section.title && <p className="mb-1 px-2.5 text-xs font-medium text-sidebar-foreground/50">{section.title}</p>}
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.name}
                            className={cn(
                              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm",
                              item.active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/70",
                            )}
                          >
                            <Icon className={cn("size-4 shrink-0", item.active && "text-sidebar-primary")} />
                            <span className="flex-1 truncate">{item.name}</span>
                            {item.badge && (
                              <span className="rounded bg-sidebar-primary/10 px-1.5 py-px text-[10px] font-semibold text-sidebar-primary">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Main */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Topbar */}
              <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
                <p className="flex-1 text-sm font-semibold">نظرة عامة</p>
                <div className="flex h-9 w-56 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                  <Search className="size-4" />
                  <span className="flex-1">ابحث…</span>
                  <kbd className="rounded border border-border bg-background px-1.5 text-[10px]" dir="ltr">
                    ⌘K
                  </kbd>
                </div>
                <span className="relative grid size-9 place-items-center text-muted-foreground">
                  <Bell className="size-4" />
                  <span className="absolute end-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
                </span>
                <span className="mx-1 h-5 w-px bg-border" />
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">ن</span>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-hidden p-6">
                {/* Header */}
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الأحد، ١٩ أكتوبر ٢٠٢٦</p>
                    <p className="text-2xl font-bold">نظرة عامة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 items-center rounded-lg border border-border bg-background">
                      <span className="flex items-center gap-1.5 px-3 text-sm text-muted-foreground" dir="ltr">
                        <ExternalLink className="size-3.5" />
                        nour.casho.store
                      </span>
                      <span className="grid h-full w-9 place-items-center border-s border-border text-muted-foreground">
                        <Copy className="size-4" />
                      </span>
                    </div>
                    <span className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white">
                      <Plus className="size-4" />
                      إضافة منتج
                    </span>
                  </div>
                </div>

                {/* Welcome banner */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-xl bg-primary p-6 text-white">
                  <div className="space-y-3">
                    <p className="text-2xl font-bold">مساء الخير، نور</p>
                    <div className="flex items-start gap-3">
                      <Quote className="mt-1 size-5 shrink-0 -scale-x-100 text-white/60" />
                      <div>
                        <p className="text-xs font-medium text-white/70">جملة النهارده</p>
                        <p className="mt-1 text-base font-medium">المحل والأونلاين إيد واحدة — خلّي الاتنين يكبّروا بعض.</p>
                      </div>
                    </div>
                  </div>
                  <dl className="grid w-96 grid-cols-3 divide-x divide-x-reverse divide-white/15 rounded-lg bg-white/10 py-4">
                    {[
                      { label: "إيرادات النهارده", value: money(4250) },
                      { label: "طلبات النهارده", value: ar.format(18) },
                      { label: "زيارات النهارده", value: ar.format(642) },
                    ].map((s) => (
                      <div key={s.label} className="px-4 text-center">
                        <dt className="text-xs text-white/70">{s.label}</dt>
                        <dd className="mt-1 text-lg font-bold">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  {KPIS.map((k) => (
                    <div key={k.label} className="flex flex-col gap-2.5 bg-card p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                        <Delta value={k.delta} />
                      </div>
                      <p className="text-2xl font-bold">{k.value}</p>
                      <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="h-7 w-full text-primary" style={{ direction: "ltr" }}>
                        <path
                          d={sparkPath(k.series, 120, 28)}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <p className="text-xs text-muted-foreground">
                        الـ٣٠ يوم اللي قبلها: <span className="font-medium text-foreground/80">{k.prev}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart + side cards */}
                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2 rounded-xl border border-border bg-card">
                    <div className="flex items-start justify-between border-b border-border p-4">
                      <div className="space-y-1">
                        <p className="text-base font-semibold">الأداء</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{money(124580)}</span>
                          <Delta value="١٨٫٣٪" />
                        </div>
                      </div>
                      <div className="flex rounded-lg bg-muted p-1 text-xs">
                        <span className="rounded-md bg-background px-3 py-1 font-medium shadow-sm">الإيرادات</span>
                        <span className="px-3 py-1 text-muted-foreground">الطلبات</span>
                        <span className="px-3 py-1 text-muted-foreground">الزيارات</span>
                      </div>
                    </div>
                    <div className="p-4" dir="ltr">
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-[168px] w-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="casho-mock-area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {[0.25, 0.5, 0.75].map((f) => (
                          <line key={f} x1="0" x2={chartW} y1={chartH * f} y2={chartH * f} stroke="var(--border)" strokeWidth="1" />
                        ))}
                        <path d={`${line} L${chartW},${chartH} L0,${chartH} Z`} fill="url(#casho-mock-area)" />
                        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                      <div>
                        <p className="text-base font-semibold">المبيعات حسب القناة</p>
                        <p className="text-xs text-muted-foreground">الإيرادات · آخر ٣٠ يوم</p>
                      </div>
                      {[
                        { label: "المتجر الأونلاين", icon: Globe, value: 78300, share: 63 },
                        { label: "الكاشير (POS)", icon: Store, value: 46280, share: 37 },
                      ].map((ch) => (
                        <div key={ch.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <ch.icon className="size-4 text-muted-foreground" />
                              {ch.label}
                            </span>
                            <span className="font-semibold">{money(ch.value)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${ch.share}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
                      <p className="text-base font-semibold">محتاج انتباهك</p>
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                        <ShoppingCart className="size-4" />
                        ٣ طلبات مستنية تأكيد
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="size-4" />
                        ٢ منتج المخزون قرب يخلص
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Scaled>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Storefront phone                                                    */
/* ------------------------------------------------------------------ */

const PRODUCT_ART = [
  { icon: Shirt, bg: "linear-gradient(160deg,#eef2ff,#dbe4ff)", fg: "#1447e6" },
  { icon: Watch, bg: "linear-gradient(160deg,#f5f5f7,#e5e5ea)", fg: "#1d1d1f" },
  { icon: Footprints, bg: "linear-gradient(160deg,#f1f5ff,#e0e8ff)", fg: "#0b2a8f" },
  { icon: Glasses, bg: "linear-gradient(160deg,#f5f5f7,#e9e9ee)", fg: "#3a3a3c" },
];

export function StorefrontPhone({ className }: { className?: string }) {
  const c = useLandingCopy().mock;

  return (
    <div
      aria-hidden
      className={cn(
        "relative rounded-[15%/7%] bg-[linear-gradient(145deg,#4a4a4d,#1c1c1e_40%,#2c2c2e)] p-[3.2%] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/40",
        className,
      )}
    >
      {/* side buttons */}
      <span className="absolute -start-[1.2%] top-[18%] h-[7%] w-[1.4%] rounded-s bg-[#2c2c2e]" />
      <span className="absolute -end-[1.2%] top-[24%] h-[11%] w-[1.4%] rounded-e bg-[#2c2c2e]" />

      <div className="overflow-hidden rounded-[12.5%/5.8%] bg-white">
        <Scaled width={300} height={640}>
          <div className="relative flex h-full flex-col bg-white text-[#0a0d1a]" dir="rtl">
            {/* status bar + island */}
            <div className="flex h-11 items-center justify-between px-6 pt-1 text-[12px] font-semibold" dir="ltr">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="flex items-end gap-px">
                  {[4, 6, 8, 10].map((h) => (
                    <span key={h} className="w-[3px] rounded-sm bg-black" style={{ height: h }} />
                  ))}
                </span>
                <span className="ms-1 h-[11px] w-[22px] rounded-[3px] border border-black/40 p-px">
                  <span className="block h-full w-[70%] rounded-[1px] bg-black" />
                </span>
              </span>
            </div>
            <div className="absolute left-1/2 top-2.5 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />

            {/* announcement */}
            <div className="bg-[#1447e6] py-1.5 text-center text-[10px] font-medium text-white">شحن مجاني فوق ٥٠٠ ج.م</div>

            {/* header */}
            <div className="flex items-center justify-between px-4 py-3">
              <Menu className="size-5" />
              <p className="text-[17px] font-bold">{c.storeName}</p>
              <span className="relative">
                <ShoppingBag className="size-5" />
                <span className="absolute -end-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1447e6] text-[9px] font-bold text-white">
                  ٢
                </span>
              </span>
            </div>

            {/* hero banner */}
            <div className="relative mx-4 h-36 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0b2a8f,#1447e6_55%,#5c8aff)] p-4 text-white">
              <div className="absolute -bottom-6 -start-6 size-32 rounded-full bg-white/10" />
              <div className="absolute -top-8 end-10 size-24 rounded-full bg-white/10" />
              <Shirt className="absolute bottom-3 start-4 size-20 text-white/25" strokeWidth={1.2} />
              <p className="text-[11px] text-white/80">كوليكشن جديد</p>
              <p className="mt-1 text-[19px] font-bold leading-tight">{c.storeTagline}</p>
              <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#1447e6]">تسوق الآن</span>
            </div>

            {/* categories */}
            <div className="flex gap-2 px-4 py-3 text-[11px]">
              {["الكل", "تيشيرتات", "إكسسوارات", "شنط"].map((t, i) => (
                <span key={t} className={cn("rounded-full px-3 py-1", i === 0 ? "bg-[#0a0d1a] text-white" : "bg-[#f1f3fa] text-[#475569]")}>
                  {t}
                </span>
              ))}
            </div>

            {/* products */}
            <div className="grid grid-cols-2 gap-3 px-4">
              {c.products.map((p, i) => {
                const art = PRODUCT_ART[i];
                return (
                  <div key={p.name}>
                    <div className="relative grid aspect-square place-items-center rounded-xl" style={{ background: art.bg }}>
                      <art.icon className="size-12" style={{ color: art.fg }} strokeWidth={1.3} />
                      <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-white/90">
                        <Heart className="size-3" />
                      </span>
                      {i === 0 && (
                        <span className="absolute start-2 top-2 rounded-md bg-[#e0483a] px-1.5 py-0.5 text-[9px] font-bold text-white">-٢٠٪</span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-[11px] font-medium">{p.name}</p>
                    <p className="text-[11px] font-bold text-[#1447e6]">
                      {p.price} <span className="text-[9px] font-medium text-[#64748b]">{c.currency}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* tab bar */}
            <div className="mt-auto flex items-center justify-around border-t border-black/5 bg-white/95 px-4 pb-6 pt-2 text-[9px] text-[#94a3b8]">
              {[
                { icon: Home, label: "الرئيسية", active: true },
                { icon: LayoutGrid, label: "الأقسام" },
                { icon: ShoppingBag, label: "السلة" },
                { icon: User, label: "حسابي" },
              ].map((t) => (
                <span key={t.label} className={cn("flex flex-col items-center gap-0.5", t.active && "text-[#1447e6]")}>
                  <t.icon className="size-5" />
                  {t.label}
                </span>
              ))}
            </div>
            <div className="absolute bottom-1.5 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-black" />
          </div>
        </Scaled>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* POS receipt                                                         */
/* ------------------------------------------------------------------ */

const BARCODE = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2];

/** Thermal POS receipt with a torn edge. Decorative. */
export function PosReceipt({ className }: { className?: string }) {
  const c = useLandingCopy().mock;
  const r = c.receipt;

  return (
    <div aria-hidden className={cn("drop-shadow-[0_24px_32px_rgba(0,0,0,0.22)]", className)}>
      <div className="al-receipt bg-[#fbfbf8] px-4 pb-7 pt-4 text-[#1d1d1f] [border-radius:14px_14px_0_0]">
        <div className="mx-auto mb-1.5 grid size-7 place-items-center rounded-lg bg-[#1447e6] text-white">
          <MonitorCheck className="size-4" />
        </div>
        <p className="text-center text-[13px] font-bold">{r.title}</p>
        <p className="text-center text-[10px] text-black/50">{r.branch}</p>
        <div className="my-3 border-t border-dashed border-black/20" />
        {r.items.map((it) => (
          <div key={it.name} className="flex items-center justify-between py-1 text-[11px]">
            <span>
              {it.name} <span className="text-black/45">{it.qty}</span>
            </span>
            <span className="tabular-nums">{it.price}</span>
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-black/20" />
        <div className="flex items-center justify-between text-[13px] font-bold">
          <span>{r.total}</span>
          <span className="tabular-nums">
            {r.totalValue} <span className="text-[10px] font-medium text-black/50">{c.currency}</span>
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-[#1a8a3e]">✓ {r.paid}</p>
        <div className="mt-3 flex h-8 items-stretch justify-center gap-[2px]" dir="ltr">
          {BARCODE.map((w, i) => (
            <span key={i} className="bg-[#1d1d1f]" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}
