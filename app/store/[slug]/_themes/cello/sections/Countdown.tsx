"use client";

import { useEffect, useState } from "react";

const nf = new Intl.NumberFormat("ar-EG", { minimumIntegerDigits: 2 });

function left(end: number) {
  const d = Math.max(0, end - Date.now());
  return { d: Math.floor(d / 86_400_000), h: Math.floor((d % 86_400_000) / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000), done: d === 0 };
}

/** Cello's countdown: navy boxes (number over unit) separated by colons.
 *  Counts down to the merchant's own end date and disappears once it passes. */
export default function Countdown({ endDate, label }: { endDate: string; label?: string }) {
  const end = new Date(endDate).getTime();
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
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm text-(--ce-text)">{label}</span>}
      <div role="timer" aria-live="off" aria-label="الوقت المتبقي على نهاية العرض" className="flex items-center gap-1.5 sm:gap-2.5">
        {units.map((u, i) => (
          <span key={u.l} className="flex items-center gap-1.5 sm:gap-2.5">
            {i > 0 && (
              <span aria-hidden className="text-lg font-semibold text-(--ce-ink)">
                :
              </span>
            )}
            <span className="ce-count">
              {u.v === undefined ? "--" : nf.format(u.v)}
              <small>{u.l}</small>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
