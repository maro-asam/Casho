"use client";

import { useEffect, useState } from "react";

const nf = new Intl.NumberFormat("ar-EG");

function left(end: number) {
  const d = Math.max(0, end - Date.now());
  return { d: Math.floor(d / 86_400_000), h: Math.floor((d % 86_400_000) / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000), done: d === 0 };
}

/** "Hurry up! Offer ends in: 81 : 8 : 23 : 31" — counts down to the
 *  merchant's own end date and disappears once it passes. */
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm text-(--mx-text)">{label || "العرض بيخلص خلال:"}</span>
      <div role="timer" aria-live="off" aria-label="الوقت المتبقي على نهاية العرض" className="flex items-center gap-1">
        {units.map((u, i) => (
          <span key={u.l} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden className="text-lg font-bold text-(--mx-sale-badge)">
                :
              </span>
            )}
            <span className="mx-count" title={u.l}>
              {u.v === undefined ? "--" : nf.format(u.v)}
              <span className="sr-only"> {u.l}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
