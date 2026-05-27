"use client";

import { useEffect, useState } from "react";
import { Timer, Users, Zap } from "lucide-react";
import type { UrgencyContent } from "@/types/store-theme.types";

type Props = {
  content?: UrgencyContent;
};

function calcTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(endDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(endDate)), 1_000);
    return () => clearInterval(id);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2" dir="ltr">
      {[
        { value: pad(timeLeft.h), label: "ساعة" },
        { value: pad(timeLeft.m), label: "دقيقة" },
        { value: pad(timeLeft.s), label: "ثانية" },
      ].map(({ value, label }, i) => (
        <span key={i} className="flex flex-col items-center">
          <span
            className="flex min-w-[2.5rem] items-center justify-center rounded-xl px-3 py-2 text-2xl font-extrabold tabular-nums"
            style={{
              background: "color-mix(in srgb, var(--store-primary) 12%, transparent)",
              color: "var(--store-primary)",
            }}
          >
            {value}
          </span>
          <span className="mt-1 text-[10px]" style={{ color: "var(--store-muted-foreground)" }}>
            {label}
          </span>
          {i < 2 && (
            <span
              className="-mt-6 text-xl font-bold"
              style={{ color: "var(--store-muted-foreground)" }}
            >
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function UrgencySection({ content }: Props) {
  const headline = content?.headline ?? "⚡ عرض محدود الوقت — لا تفوّته!";
  const timerLabel = content?.timerLabel ?? "العرض ينتهي بعد";
  const showTimer = content?.timerEndDate !== undefined;
  const showStock = content?.showStockBadge ?? true;
  const showViewers = content?.showViewersBadge ?? true;
  const minViewers = content?.minViewers ?? 12;
  const maxViewers = content?.maxViewers ?? 48;

  const [viewers] = useState(() =>
    Math.floor(Math.random() * (maxViewers - minViewers + 1)) + minViewers,
  );

  return (
    <section
      className="overflow-hidden rounded-3xl border"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--store-primary) 6%, var(--store-background)) 0%, var(--store-card) 100%)",
        borderColor: "color-mix(in srgb, var(--store-primary) 20%, transparent)",
      }}
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-6 p-8 text-center sm:p-10">
        {/* Headline */}
        <h2
          className="text-xl font-bold sm:text-2xl"
          style={{ color: "var(--store-foreground)" }}
        >
          {headline}
        </h2>

        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Timer */}
          {showTimer && content?.timerEndDate && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--store-muted-foreground)" }}>
                <Timer className="size-4" />
                {timerLabel}
              </div>
              <Countdown endDate={content.timerEndDate} />
            </div>
          )}

          {/* Viewers badge */}
          {showViewers && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: "color-mix(in srgb, #22c55e 10%, transparent)",
                border: "1px solid color-mix(in srgb, #22c55e 25%, transparent)",
              }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              <Users className="size-4" style={{ color: "#22c55e" }} />
              <span className="text-sm font-semibold" style={{ color: "#16a34a" }}>
                {viewers} شخص يتصفح الآن
              </span>
            </div>
          )}

          {/* Stock badge */}
          {showStock && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: "color-mix(in srgb, #ef4444 10%, transparent)",
                border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
              }}
            >
              <Zap className="size-4" style={{ color: "#ef4444" }} />
              <span className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                مخزون محدود — اطلب الآن!
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
