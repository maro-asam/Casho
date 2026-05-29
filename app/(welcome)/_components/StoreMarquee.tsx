"use client";

import { ShoppingCart, StoreIcon, Wallet, TrendingUp } from "lucide-react";

type StoreData = {
  name: string;
  tagline: string;
  url: string;
  themeGradient: string;
  bannerGradient: string;
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
    bannerGradient: "from-violet-600 to-purple-700",
    bannerTitle: "تخفيضات الموسم",
    bannerSub: "خصم 30%",
    cartCount: 3,
    visitors: "12 زائر",
    products: [
      { name: "تيشيرت", price: "500 ج.م", gradient: "from-violet-300 to-violet-500" },
      { name: "هودي", price: "900 ج.م", gradient: "from-purple-300 to-purple-500" },
      { name: "شنطة", price: "750 ج.م", gradient: "from-fuchsia-300 to-fuchsia-500" },
    ],
  },
  {
    name: "متجر تيك",
    tagline: "إلكترونيات وتقنية",
    url: "casho.store/تيك",
    themeGradient: "from-sky-500 to-blue-600",
    bannerGradient: "from-sky-600 to-blue-700",
    bannerTitle: "أحدث الإكسسوارات",
    bannerSub: "عروض حصرية",
    cartCount: 1,
    visitors: "28 زائر",
    products: [
      { name: "سماعات", price: "800 ج.م", gradient: "from-sky-300 to-sky-500" },
      { name: "ساعة", price: "1,200 ج.م", gradient: "from-blue-300 to-blue-500" },
      { name: "شاحن", price: "250 ج.م", gradient: "from-cyan-300 to-cyan-500" },
    ],
  },
  {
    name: "متجر لمى",
    tagline: "جمال وعناية",
    url: "casho.store/لمى",
    themeGradient: "from-rose-400 to-pink-600",
    bannerGradient: "from-rose-500 to-pink-700",
    bannerTitle: "روتين العناية",
    bannerSub: "جديد الموسم",
    cartCount: 5,
    visitors: "45 زائر",
    products: [
      { name: "كريم", price: "350 ج.م", gradient: "from-rose-300 to-rose-500" },
      { name: "عطر", price: "950 ج.م", gradient: "from-pink-300 to-pink-500" },
      { name: "ماسكارا", price: "180 ج.م", gradient: "from-fuchsia-300 to-pink-400" },
    ],
  },
  {
    name: "متجر مزة",
    tagline: "حلويات وكيك",
    url: "casho.store/مزة",
    themeGradient: "from-amber-400 to-orange-500",
    bannerGradient: "from-amber-500 to-orange-600",
    bannerTitle: "طازج يوميًا",
    bannerSub: "توصيل سريع",
    cartCount: 2,
    visitors: "19 زائر",
    products: [
      { name: "كيكة", price: "120 ج.م", gradient: "from-amber-300 to-amber-500" },
      { name: "كب كيك", price: "200 ج.م", gradient: "from-orange-300 to-orange-500" },
      { name: "تورتة", price: "450 ج.م", gradient: "from-yellow-300 to-amber-500" },
    ],
  },
  {
    name: "متجر تريند",
    tagline: "ستريت فاشون",
    url: "casho.store/تريند",
    themeGradient: "from-emerald-500 to-teal-600",
    bannerGradient: "from-emerald-600 to-teal-700",
    bannerTitle: "الكولكشن الجديد",
    bannerSub: "محدود",
    cartCount: 7,
    visitors: "33 زائر",
    products: [
      { name: "كاب", price: "350 ج.م", gradient: "from-emerald-300 to-emerald-500" },
      { name: "سنيكر", price: "1,100 ج.م", gradient: "from-teal-300 to-teal-500" },
      { name: "هودي", price: "650 ج.م", gradient: "from-green-300 to-emerald-500" },
    ],
  },
  {
    name: "متجر ديكور",
    tagline: "ديكور وهدايا",
    url: "casho.store/ديكور",
    themeGradient: "from-indigo-400 to-violet-600",
    bannerGradient: "from-indigo-500 to-violet-700",
    bannerTitle: "أضواء وإكسسوار",
    bannerSub: "جديد كل أسبوع",
    cartCount: 4,
    visitors: "22 زائر",
    products: [
      { name: "شمعة", price: "280 ج.م", gradient: "from-indigo-300 to-indigo-500" },
      { name: "كوب", price: "180 ج.م", gradient: "from-violet-300 to-violet-500" },
      { name: "إطار", price: "120 ج.م", gradient: "from-purple-300 to-indigo-500" },
    ],
  },
];

const DASHBOARDS: DashboardData[] = [
  {
    chartData: [42, 68, 55, 88, 74, 96, 82],
    sales: "9,800 ج.م",
    orders: "26",
    conversion: "38%",
    growth: "+18%",
  },
  {
    chartData: [58, 72, 81, 65, 90, 78, 94],
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
    <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="relative">
          <ShoppingCart className="size-3.5 text-muted-foreground" />
          <span className="absolute -right-1.5 -top-1.5 flex size-3 items-center justify-center rounded-full bg-primary text-[7px] font-bold text-primary-foreground">
            {store.cartCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-xs font-semibold">{store.name}</p>
            <p className="text-[10px] text-muted-foreground">{store.tagline}</p>
          </div>
          <div className={`flex size-7 items-center justify-center rounded-lg bg-linear-to-br ${store.themeGradient}`}>
            <StoreIcon className="size-3.5 text-white" />
          </div>
        </div>
      </div>

      <div className={`bg-linear-to-l ${store.bannerGradient} px-3 py-2 text-right text-white`}>
        <div className="flex items-center justify-between">
          <button className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-medium">
            تسوق الآن
          </button>
          <div>
            <p className="text-[9px] opacity-75">{store.bannerSub}</p>
            <p className="text-xs font-bold">{store.bannerTitle}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-3">
        {store.products.map((p) => (
          <div key={p.name} className="flex-1">
            <div className={`h-12 w-full rounded-lg bg-linear-to-br ${p.gradient}`} />
            <p className="mt-1 truncate text-center text-[9px] font-medium text-foreground">{p.name}</p>
            <p className="text-center text-[9px] font-bold text-primary">{p.price}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          {store.visitors}
        </div>
        <span dir="ltr">{store.url}</span>
      </div>
    </div>
  );
}

function MiniDashboardCard({ data }: { data: DashboardData }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
          <div className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          مباشر الآن
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">لوحة التحكم</p>
          <p className="text-[10px] text-muted-foreground">اليوم</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-3">
        <div className="rounded-xl border border-border/30 bg-muted/20 p-2 text-center">
          <Wallet className="mx-auto mb-1 size-3 text-primary" />
          <p className="text-[8px] text-muted-foreground">مبيعات</p>
          <p className="text-[10px] font-bold leading-tight">{data.sales}</p>
          <p className="text-[8px] font-medium text-emerald-600">{data.growth}</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-2 text-center">
          <ShoppingCart className="mx-auto mb-1 size-3 text-primary" />
          <p className="text-[8px] text-muted-foreground">طلبات</p>
          <p className="text-[10px] font-bold leading-tight">{data.orders}</p>
          <p className="text-[8px] text-muted-foreground">اليوم</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-2 text-center">
          <TrendingUp className="mx-auto mb-1 size-3 text-primary" />
          <p className="text-[8px] text-muted-foreground">تحويل</p>
          <p className="text-[10px] font-bold leading-tight">{data.conversion}</p>
          <p className="text-[8px] font-medium text-emerald-600">نشط</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="flex h-14 items-end gap-0.5 rounded-xl border border-border/30 bg-muted/10 px-2 pb-1.5 pt-2">
          {data.chartData.map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-linear-to-t from-primary to-primary/40"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
        <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
          حركة المبيعات — آخر 7 أيام
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
      <div
        className={`flex ${direction === "left" ? "scroll-left" : "scroll-right"}`}
      >
        {doubled.map((item, i) => (
          <div key={i} className="pr-4 flex-none w-56">
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
      {/* Side fades — physical directions + high z to clear 3D stacking context */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-50 w-52"
        style={{ background: "linear-gradient(to right, var(--background) 35%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-50 w-52"
        style={{ background: "linear-gradient(to left, var(--background) 35%, transparent)" }}
      />

      {/* 3D perspective wrapper */}
      <div style={{ perspective: "1000px" }}>
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
