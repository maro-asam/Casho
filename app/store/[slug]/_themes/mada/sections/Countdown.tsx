"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { UrgencyContent } from "@/types/store-theme.types";
import { Arrow, Wrap, btn } from "../ui";

const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });

function left(end: number) {
  const d = Math.max(0, end - Date.now());
  return { d: Math.floor(d / 86_400_000), h: Math.floor((d % 86_400_000) / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000), done: d === 0 };
}

/** Limited-time offer band with a live countdown (merchant end date).
 *  Hidden when there's no date or the offer already ended. */
export default function Countdown({ content, storeSlug }: { content?: UrgencyContent; storeSlug: string }) {
  const end = content?.timerEndDate ? new Date(content.timerEndDate).getTime() : NaN;
  const [t, setT] = useState<ReturnType<typeof left> | null>(null);

  useEffect(() => {
    if (Number.isNaN(end)) return;
    const tick = () => setT(left(end));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  if (Number.isNaN(end) || (t && t.done)) return null;

  const units = [
    { v: t?.d, l: "يوم" },
    { v: t?.h, l: "ساعة" },
    { v: t?.m, l: "دقيقة" },
    { v: t?.s, l: "ثانية" },
  ];

  return (
    <Wrap className="md-section md-reveal">
      <div className="flex flex-col items-start gap-7 rounded-[1.75rem] bg-(--md-ink) px-6 py-9 text-(--md-bg) sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-12">
        <div className="max-w-xl">
          <span className="md-eyebrow">{content?.timerLabel || "عرض لفترة محدودة"}</span>
          <h2 className="md-h2 mt-4">{content?.headline || "العرض بيخلص قريب"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-2" role="timer" aria-live="off" aria-label="الوقت المتبقي">
            {units.map((u) => (
              <span key={u.l} className="flex w-16 flex-col items-center rounded-2xl bg-white/10 py-3 sm:w-[4.5rem]">
                <span className="md-price text-2xl sm:text-3xl">{u.v === undefined ? "--" : nf2.format(u.v)}</span>
                <span className="mt-0.5 text-[0.6875rem] opacity-70">{u.l}</span>
              </span>
            ))}
          </div>
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "signal", size: "lg" })}>
            الحق العرض
            <Arrow />
          </Link>
        </div>
      </div>
    </Wrap>
  );
}
