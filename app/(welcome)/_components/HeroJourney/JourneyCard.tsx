"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface JourneyCardData {
  id: string;
  icon: string;
  title: string;
  status: string;
  meta: string;
  price?: string;
  orderId?: string;
  growth?: string;
  step?: number;
  accentColor: string;   // CSS hex
  gradientFrom: string;  // tailwind from-* class
  gradientTo: string;    // tailwind to-* class
  delay: number;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Mini product grid visual ────────────────────────────────────────────────

function ProductVisual({ color, price }: { color: string; price?: string }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1.5">
        {[0.9, 0.6, 0.75].map((op, i) => (
          <div
            key={i}
            className="h-8 rounded-lg"
            style={{ background: `${color}${Math.round(op * 255).toString(16).padStart(2, "0")}` }}
          />
        ))}
      </div>
      {price && (
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-16 rounded-full bg-foreground/8" />
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{ background: `${color}20`, color }}
          >
            {price}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Mini cart visual ────────────────────────────────────────────────────────

function CartVisual({ color, price }: { color: string; price?: string }) {
  const items = [
    { w: "w-14", p: "60" },
    { w: "w-10", p: "42" },
    { w: "w-12", p: "54" },
  ];
  return (
    <div className="w-full flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <div
            className="h-1.5 rounded-full flex-1"
            style={{ background: `${color}30` }}
          />
          <div
            className={cn("h-1.5 rounded-full", item.w)}
            style={{ background: color }}
          />
        </div>
      ))}
      <div
        className="mt-1 h-px w-full"
        style={{ background: `${color}25` }}
      />
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-8 rounded-full" style={{ background: `${color}30` }} />
        <span className="text-[10px] font-bold" style={{ color }}>{price}</span>
      </div>
    </div>
  );
}

// ── Mini order visual ───────────────────────────────────────────────────────

function OrderVisual({ color, orderId }: { color: string; orderId?: string }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-full" style={{ background: `${color}30`, border: `1.5px solid ${color}` }} />
          <div className="h-1.5 w-14 rounded-full" style={{ background: `${color}25` }} />
        </div>
        {orderId && (
          <span
            className="text-[9px] font-bold rounded-md px-1.5 py-0.5"
            style={{ background: `${color}20`, color }}
          >
            {orderId}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {["w-20", "w-12", "w-16"].map((w, i) => (
          <div key={i} className={cn("h-1.5 rounded-full", w)} style={{ background: `${color}${i === 0 ? "40" : "20"}` }} />
        ))}
      </div>
    </div>
  );
}

// ── Mini payment visual ─────────────────────────────────────────────────────

function PaymentVisual({ color, price }: { color: string; price?: string }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="flex size-7 items-center justify-center rounded-xl text-xs font-bold"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          ✓
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-16 rounded-full" style={{ background: `${color}35` }} />
          <div className="h-1 w-10 rounded-full" style={{ background: `${color}20` }} />
        </div>
      </div>
      {price && (
        <div
          className="rounded-lg px-2 py-1 text-[11px] font-bold text-center"
          style={{ background: `${color}15`, color }}
        >
          {price}
        </div>
      )}
    </div>
  );
}

// ── Mini shipping progress visual ───────────────────────────────────────────

function ShippingVisual({ color, step = 2 }: { color: string; step?: number }) {
  const steps = 4;
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="flex-1 flex items-center gap-1">
            <div
              className="size-3 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: i <= step ? color : `${color}20`,
                border: `1.5px solid ${i <= step ? color : `${color}30`}`,
              }}
            >
              {i < step && (
                <div className="size-1 rounded-full bg-white/90" />
              )}
              {i === step && (
                <div className="size-1.5 rounded-full animate-pulse" style={{ background: "white" }} />
              )}
            </div>
            {i < steps - 1 && (
              <div
                className="h-px flex-1 rounded-full"
                style={{ background: i < step ? color : `${color}25` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="h-1.5 rounded-full w-full" style={{ background: `${color}15` }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${((step + 1) / steps) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Mini profit chart visual ────────────────────────────────────────────────

function ProfitVisual({ color, growth }: { color: string; growth?: string }) {
  const bars = [40, 55, 48, 70, 62, 85, 78];
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-end gap-1 h-8">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: i === bars.length - 1 ? color : `${color}40` }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 1.5 + i * 0.07, duration: 0.5, ease: EASE }}
          />
        ))}
      </div>
      {growth && (
        <div className="flex items-center justify-end">
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{ background: `${color}20`, color }}
          >
            {growth}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────

export default function JourneyCard({
  data,
  className,
}: {
  data: JourneyCardData;
  className?: string;
}) {
  const renderVisual = () => {
    switch (data.id) {
      case "product":  return <ProductVisual  color={data.accentColor} price={data.price} />;
      case "cart":     return <CartVisual     color={data.accentColor} price={data.price} />;
      case "order":    return <OrderVisual    color={data.accentColor} orderId={data.orderId} />;
      case "payment":  return <PaymentVisual  color={data.accentColor} price={data.price} />;
      case "shipping": return <ShippingVisual color={data.accentColor} step={data.step} />;
      case "profit":   return <ProfitVisual   color={data.accentColor} growth={data.growth} />;
      default:         return null;
    }
  };

  return (
    <motion.div
      className={cn("group relative w-36", className)}
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: data.delay, duration: 0.65, ease: EASE }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* hover glow */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: `${data.accentColor}18` }}
      />

      <div
        className="relative flex flex-col gap-3 rounded-2xl border p-4 cursor-default select-none
                   bg-white/80 dark:bg-white/[0.05]
                   border-black/[0.07] dark:border-white/[0.09]
                   shadow-lg shadow-black/5 dark:shadow-black/40
                   backdrop-blur-xl"
      >
        {/* colored top accent */}
        <div
          className={cn("absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-linear-to-r", data.gradientFrom, data.gradientTo)}
        />

        {/* icon + title row */}
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-xl text-base flex-shrink-0"
            style={{ background: `${data.accentColor}18`, border: `1px solid ${data.accentColor}30` }}
          >
            {data.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-foreground truncate leading-tight">
              {data.title}
            </span>
            <span className="text-[9px] text-muted-foreground leading-tight truncate">
              {data.meta}
            </span>
          </div>
        </div>

        {/* mini visual */}
        <div className="min-h-[48px]">
          {renderVisual()}
        </div>

        {/* status pill */}
        <div
          className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold text-center w-full"
          style={{
            background: `${data.accentColor}15`,
            color: data.accentColor,
            border: `1px solid ${data.accentColor}25`,
          }}
        >
          {data.status}
        </div>
      </div>
    </motion.div>
  );
}
