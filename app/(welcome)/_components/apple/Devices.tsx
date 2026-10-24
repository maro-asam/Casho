"use client";

import { useEffect, useRef, useState } from "react";
import {
  Footprints,
  Glasses,
  Heart,
  Home,
  LayoutGrid,
  Lock,
  Menu,
  MonitorCheck,
  Shirt,
  ShoppingBag,
  User,
  Watch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingCopy } from "./copy";

/* ------------------------------------------------------------------ */
/* Scaling frame — mockups are laid out at a fixed "real" size and      */
/* scaled to their container, so they keep true proportions everywhere. */
/* ------------------------------------------------------------------ */

export function Scaled({
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
/* Browser window — holds the real dashboard (DashboardPreview).        */
/* ------------------------------------------------------------------ */

export function BrowserFrame({
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
  return (
    <div
      aria-hidden
      className={cn("overflow-hidden rounded-[14px] ring-1 ring-black/10 dark:ring-white/10 sm:rounded-[18px]", className)}
    >
      <Scaled width={width} height={height}>
        <div className="apple-ui flex h-full flex-col bg-background text-foreground">
          <div className="flex h-11 shrink-0 items-center gap-3 border-b-[0.5px] border-border bg-card px-4" dir="ltr">
            <div className="flex w-16 gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex h-7 w-80 items-center justify-center gap-1.5 rounded-lg bg-muted text-[13px] text-muted-foreground">
              <Lock className="size-3" strokeWidth={2.2} />
              app.casho.store
            </div>
            <div className="w-16" />
          </div>
          <div className="relative min-h-0 flex-1">{children}</div>
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

/** iPhone bezel around a screen laid out at a fixed `width`×`height`. Decorative. */
export function PhoneFrame({
  width,
  height,
  className,
  screenClassName,
  children,
}: {
  width: number;
  height: number;
  className?: string;
  screenClassName?: string;
  children: React.ReactNode;
}) {
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

      <div className={cn("overflow-hidden rounded-[12.5%/5.8%] bg-white", screenClassName)}>
        <Scaled width={width} height={height}>
          {children}
        </Scaled>
      </div>
    </div>
  );
}

/** Status bar + Dynamic Island + home indicator, drawn in the current text color. */
export function PhoneStatusBar() {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between px-6 pt-1 text-[12px] font-semibold" dir="ltr">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="flex items-end gap-px">
            {[4, 6, 8, 10].map((h) => (
              <span key={h} className="w-[3px] rounded-sm bg-current" style={{ height: h }} />
            ))}
          </span>
          <span className="ms-1 h-[11px] w-[22px] rounded-[3px] border border-current/40 p-px">
            <span className="block h-full w-[70%] rounded-[1px] bg-current" />
          </span>
        </span>
      </div>
      <div className="absolute left-1/2 top-2.5 z-50 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute bottom-1.5 left-1/2 z-50 h-1 w-28 -translate-x-1/2 rounded-full bg-current" />
    </>
  );
}

export function StorefrontPhone({ className }: { className?: string }) {
  const c = useLandingCopy().mock;

  return (
    <PhoneFrame width={300} height={640} className={className}>
      <div className="relative flex h-full flex-col bg-white text-[#0a0d1a]" dir="rtl">
        <PhoneStatusBar />

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
      </div>
    </PhoneFrame>
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
