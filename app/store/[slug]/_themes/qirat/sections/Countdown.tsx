"use client";

import { useEffect, useState } from "react";
import { lazyStoreIntl, st } from "@/lib/i18n/storefront";

const nf = lazyStoreIntl.number({ minimumIntegerDigits: 2 });

function left(end: number) {
  const d = Math.max(0, end - Date.now());
  return { d: Math.floor(d / 86_400_000), h: Math.floor((d % 86_400_000) / 3_600_000), m: Math.floor((d % 3_600_000) / 60_000), s: Math.floor((d % 60_000) / 1000), done: d === 0 };
}

/** Counts down to the merchant's own end date in serif numerals divided by
 *  gold hairlines, and disappears once it passes. */
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
    { v: t?.d, l: st("يوم") },
    { v: t?.h, l: st("ساعة") },
    { v: t?.m, l: st("دقيقة") },
    { v: t?.s, l: st("ثانية") },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <span className="qr-kicker !mb-0">{label}</span>}
      <div role="timer" aria-live="off" aria-label={st("الوقت المتبقي على نهاية العرض")} className="qr-countdown">
        {units.map((u) => (
          <span key={u.l}>
            <b>{u.v === undefined ? "--" : nf.format(u.v)}</b>
            <small>{u.l}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
