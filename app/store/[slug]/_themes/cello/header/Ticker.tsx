"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

/** Cello's navy promo bar: the merchant's announcement text, split into
 *  messages by "|" or new lines, loops with dot separators and can be
 *  paused (hover, focus or the button). */
export default function Ticker({ text }: { text: string | null }) {
  const [paused, setPaused] = useState(false);
  const messages = (text ?? "")
    .split(/\s*(?:\||\n)\s*/)
    .map((m) => m.trim())
    .filter(Boolean);
  if (messages.length === 0) return null;

  // Enough copies that one half always overflows a wide screen.
  const run = Array.from({ length: Math.max(2, Math.ceil(8 / messages.length)) }, () => messages).flat();

  return (
    <div className="ce-ticker ce-marquee relative flex h-[2.125rem] items-center overflow-hidden" data-paused={paused} role="region" aria-label="إعلانات المتجر">
      <p className="sr-only">{messages.join(" — ")}</p>
      <div className="ce-marquee-track" aria-hidden style={{ ["--ce-marquee-dur" as string]: `${run.length * 6}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((m, i) => (
              <li key={i} className="flex items-center gap-8 pe-8 text-[0.8125rem] font-medium whitespace-nowrap sm:gap-14 sm:pe-14 sm:text-sm">
                {m}
                <span className="size-1.5 rounded-full bg-white" />
              </li>
            ))}
          </ul>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "تشغيل شريط الإعلانات" : "إيقاف شريط الإعلانات"}
        className="absolute inset-y-0 end-0 grid w-9 place-items-center bg-(--ce-navy) text-white/70 transition-colors hover:text-white [&_svg]:size-3"
      >
        {paused ? <Play /> : <Pause />}
      </button>
    </div>
  );
}
