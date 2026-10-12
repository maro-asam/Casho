"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { UrgencyContent } from "@/types/store-theme.types";
import { btn } from "../ui";

const nf2 = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });

function left(end: number) {
  const d = Math.max(0, end - Date.now());
  return { d: Math.floor(d / 86_400_000), h: Math.floor((d % 86_400_000) / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000), done: d === 0 };
}

/** Limited-time offer band on sand with a live countdown (merchant end date).
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
    <section data-reveal className="dn-section">
      <div className="bg-(--dn-sand) text-(--dn-sand-ink)">
        <div className="dn-wrap flex flex-col items-center py-14 text-center sm:py-20">
          <p className="dn-label dn-appear">{content?.timerLabel || "عرض لفترة محدودة"}</p>
          <h2 className="dn-h2 dn-appear mt-4 max-w-3xl text-balance">{content?.headline || "العرض بيخلص قريب"}</h2>
          <div className="dn-appear mt-9 flex gap-6 sm:gap-12" role="timer" aria-live="off" aria-label="الوقت المتبقي">
            {units.map((u) => (
              <span key={u.l} className="flex min-w-14 flex-col items-center">
                <span className="dn-num text-[clamp(2.75rem,6vw,4.5rem)] leading-none">{u.v === undefined ? "--" : nf2.format(u.v)}</span>
                <span className="dn-label mt-2 opacity-75">{u.l}</span>
              </span>
            ))}
          </div>
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", className: "dn-appear mt-10 bg-(--dn-sand-ink) text-(--dn-sand) hover:bg-(--dn-sand-ink)" })}>
            الحق العرض
          </Link>
        </div>
      </div>
    </section>
  );
}
