"use client";

import { ShoppingCart, StoreIcon, TrendingUp, Wallet } from "lucide-react";

type StoreData = {
  name: string;
  tagline: string;
  url: string;
  themeGradient: string;
  accentFrom: string;
  accentTo: string;
  bannerTitle: string;
  bannerSub: string;
  cartCount: number;
  visitors: string;
  products: { name: string; price: string; gradient: string }[];
};

type DashboardData = {
  chartData: number[];
  sales: string;
  orders: string;
  conversion: string;
  growth: string;
};

type RowItem =
  | { kind: "store"; data: StoreData }
  | { kind: "dashboard"; data: DashboardData };

const STORES: StoreData[] = [
  {
    name: "متجر نور",
    tagline: "أزياء عصرية",
    url: "casho.store/نور",
    themeGradient: "from-violet-500 to-purple-600",
    accentFrom: "#7c3aed",
    accentTo: "#9333ea",
    bannerTitle: "تخفيضات الموسم",
    bannerSub: "خصم 30%",
    cartCount: 3,
    visitors: "12 زائر",
    products: [
      { name: "تيشيرت", price: "500 ج", gradient: "from-violet-400 to-purple-500" },
      { name: "هودي", price: "900 ج", gradient: "from-purple-400 to-fuchsia-500" },
      { name: "شنطة", price: "750 ج", gradient: "from-fuchsia-400 to-violet-500" },
    ],
  },
  {
    name: "متجر تيك",
    tagline: "إلكترونيات وتقنية",
    url: "casho.store/تيك",
    themeGradient: "from-sky-500 to-blue-600",
    accentFrom: "#0284c7",
    accentTo: "#2563eb",
    bannerTitle: "أحدث الإكسسوارات",
    bannerSub: "عروض حصرية",
    cartCount: 1,
    visitors: "28 زائر",
    products: [
      { name: "سماعات", price: "800 ج", gradient: "from-sky-400 to-blue-500" },
      { name: "ساعة", price: "1,200 ج", gradient: "from-blue-400 to-indigo-500" },
      { name: "شاحن", price: "250 ج", gradient: "from-cyan-400 to-sky-500" },
    ],
  },
  {
    name: "متجر لمى",
    tagline: "جمال وعناية",
    url: "casho.store/لمى",
    themeGradient: "from-rose-400 to-pink-600",
    accentFrom: "#f43f5e",
    accentTo: "#db2777",
    bannerTitle: "روتين العناية",
    bannerSub: "جديد الموسم",
    cartCount: 5,
    visitors: "45 زائر",
    products: [
      { name: "كريم", price: "350 ج", gradient: "from-rose-400 to-pink-500" },
      { name: "عطر", price: "950 ج", gradient: "from-pink-400 to-fuchsia-500" },
      { name: "ماسكارا", price: "180 ج", gradient: "from-fuchsia-400 to-rose-500" },
    ],
  },
  {
    name: "متجر مزة",
    tagline: "حلويات وكيك",
    url: "casho.store/مزة",
    themeGradient: "from-amber-400 to-orange-500",
    accentFrom: "#f59e0b",
    accentTo: "#f97316",
    bannerTitle: "طازج يوميًا",
    bannerSub: "توصيل سريع",
    cartCount: 2,
    visitors: "19 زائر",
    products: [
      { name: "كيكة", price: "120 ج", gradient: "from-amber-400 to-orange-400" },
      { name: "كب كيك", price: "200 ج", gradient: "from-orange-400 to-amber-500" },
      { name: "تورتة", price: "450 ج", gradient: "from-yellow-400 to-amber-500" },
    ],
  },
  {
    name: "متجر تريند",
    tagline: "ستريت فاشون",
    url: "casho.store/تريند",
    themeGradient: "from-emerald-500 to-teal-600",
    accentFrom: "#10b981",
    accentTo: "#0d9488",
    bannerTitle: "الكولكشن الجديد",
    bannerSub: "محدود",
    cartCount: 7,
    visitors: "33 زائر",
    products: [
      { name: "كاب", price: "350 ج", gradient: "from-emerald-400 to-teal-500" },
      { name: "سنيكر", price: "1,100 ج", gradient: "from-teal-400 to-emerald-500" },
      { name: "هودي", price: "650 ج", gradient: "from-green-400 to-emerald-500" },
    ],
  },
  {
    name: "متجر ديكور",
    tagline: "ديكور وهدايا",
    url: "casho.store/ديكور",
    themeGradient: "from-indigo-400 to-violet-600",
    accentFrom: "#6366f1",
    accentTo: "#7c3aed",
    bannerTitle: "أضواء وإكسسوار",
    bannerSub: "جديد كل أسبوع",
    cartCount: 4,
    visitors: "22 زائر",
    products: [
      { name: "شمعة", price: "280 ج", gradient: "from-indigo-400 to-violet-500" },
      { name: "كوب", price: "180 ج", gradient: "from-violet-400 to-indigo-500" },
      { name: "إطار", price: "120 ج", gradient: "from-purple-400 to-indigo-500" },
    ],
  },
];

const DASHBOARDS: DashboardData[] = [
  {
    chartData: [35, 55, 42, 70, 58, 82, 68],
    sales: "9,800 ج.م",
    orders: "26",
    conversion: "38%",
    growth: "+18%",
  },
  {
    chartData: [48, 62, 75, 58, 84, 70, 90],
    sales: "14,500 ج.م",
    orders: "41",
    conversion: "52%",
    growth: "+31%",
  },
];

const ROW1: RowItem[] = [
  { kind: "store", data: STORES[0] },
  { kind: "dashboard", data: DASHBOARDS[0] },
  { kind: "store", data: STORES[1] },
  { kind: "store", data: STORES[2] },
  { kind: "store", data: STORES[3] },
];

const ROW2: RowItem[] = [
  { kind: "store", data: STORES[4] },
  { kind: "store", data: STORES[5] },
  { kind: "dashboard", data: DASHBOARDS[1] },
  { kind: "store", data: STORES[0] },
  { kind: "store", data: STORES[2] },
];

function MiniStoreCard({ store }: { store: StoreData }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-background shadow-md">
      {/* Accent top bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(to right, ${store.accentFrom}, ${store.accentTo})` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Cart badge */}
        <div className="relative">
          <ShoppingCart className="size-3.5 text-muted-foreground" />
          <span
            className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
            style={{ background: store.accentFrom }}
          >
            {store.cartCount}
          </span>
        </div>
        {/* Store identity */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[11px] font-bold leading-tight">{store.name}</p>
            <p className="text-[9px] text-muted-foreground">{store.tagline}</p>
          </div>
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `linear-gradient(135deg, ${store.accentFrom}, ${store.accentTo})` }}
          >
            <StoreIcon className="size-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Banner strip */}
      <div
        className="mx-3 mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-white"
        style={{ background: `linear-gradient(to left, ${store.accentFrom}cc, ${store.accentTo}cc)` }}
      >
        <button className="rounded-lg bg-white/20 px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm">
          تسوق الآن
        </button>
        <div className="text-right">
          <p className="text-[8px] opacity-80">{store.bannerSub}</p>
          <p className="text-[10px] font-bold">{store.bannerTitle}</p>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        {store.products.map((p) => (
          <div key={p.name} className="group cursor-pointer">
            <div
              className={`h-14 w-full rounded-xl bg-gradient-to-br ${p.gradient} transition-transform duration-150 group-hover:scale-95`}
            />
            <p className="mt-1 truncate text-center text-[9px] font-medium text-foreground">
              {p.name}
            </p>
            <p
              className="text-center text-[9px] font-bold"
              style={{ color: store.accentFrom }}
            >
              {p.price}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          {store.visitors}
        </div>
        <span className="text-[8px] text-muted-foreground/70" dir="ltr">
          {store.url}
        </span>
      </div>
    </div>
  );
}

function MiniDashboardCard({ data }: { data: DashboardData }) {
  const max = Math.max(...data.chartData);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-background shadow-md">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-3 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-600">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            مباشر الآن
          </div>
          <p className="text-[11px] font-bold text-foreground">لوحة التحكم</p>
        </div>

        {/* Big revenue number */}
        <div className="mt-2 text-right">
          <p className="text-xl font-extrabold tracking-tight text-foreground">{data.sales}</p>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[9px] font-semibold text-emerald-600">{data.growth}</span>
            <span className="text-[9px] text-muted-foreground">من الأسبوع الماضي</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
        <div className="rounded-xl border border-border/40 bg-muted/30 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
            <ShoppingCart className="size-2.5" />
            طلبات اليوم
          </div>
          <p className="mt-0.5 text-sm font-bold text-foreground">{data.orders}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/30 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
            <TrendingUp className="size-2.5" />
            تحويل
          </div>
          <p className="mt-0.5 text-sm font-bold text-foreground">{data.conversion}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-3">
        <div className="flex h-12 items-end gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-2 pb-1.5 pt-2">
          {data.chartData.map((value, i) => (
            <div
              key={i}
              className="relative flex-1 overflow-hidden rounded-t-sm"
              style={{ height: `${(value / max) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/40" />
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[8px] text-muted-foreground">
          المبيعات — آخر 7 أيام
        </p>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: RowItem[];
  direction: "left" | "right";
}) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden" dir="ltr">
      <div className={`flex ${direction === "left" ? "scroll-left" : "scroll-right"}`}>
        {doubled.map((item, i) => (
          <div key={i} className="flex-none w-56 pr-4">
            {item.kind === "store" ? (
              <MiniStoreCard store={item.data} />
            ) : (
              <MiniDashboardCard data={item.data} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoreMarquee() {
  return (
    <div className="relative mt-14 w-full">
      {/* Edge fades */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-50 w-20 md:w-52"
        style={{ background: "linear-gradient(to right, var(--background) 35%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-50 w-20 md:w-52"
        style={{ background: "linear-gradient(to left, var(--background) 35%, transparent)" }}
      />

      {/* Mobile: single row, flat */}
      <div className="flex flex-col gap-4 md:hidden">
        <MarqueeRow items={ROW1} direction="left" />
      </div>

      {/* Desktop: 3D perspective with two rows */}
      <div className="hidden md:block" style={{ perspective: "1000px" }}>
        <div
          className="flex flex-col gap-4"
          style={{
            transform: "rotateX(18deg)",
            transformOrigin: "center top",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 18%, black 85%, transparent 100%)",
          }}
        >
          <MarqueeRow items={ROW1} direction="left" />
          <MarqueeRow items={ROW2} direction="right" />
        </div>
      </div>
    </div>
  );
}
