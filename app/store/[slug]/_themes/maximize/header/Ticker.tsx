"use client";

import { useState } from "react";
import { Pause, Play, Sparkle } from "lucide-react";

/** Scrolling promo bar over the header. The merchant's announcement text is
 *  split into messages by "|" or new lines; the strip loops and can be
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
    <div className="mx-ticker mx-marquee relative flex h-10 items-center overflow-hidden" data-paused={paused} role="region" aria-label="إعلانات المتجر">
      <p className="sr-only">{messages.join(" — ")}</p>
      <div className="mx-marquee-track" aria-hidden style={{ ["--mx-marquee-dur" as string]: `${run.length * 5}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {run.map((m, i) => (
              <li key={i} className="flex items-center gap-12 pe-12 text-[0.8125rem] font-semibold whitespace-nowrap sm:text-sm">
                {m}
                <Sparkle className="size-4 opacity-80" strokeWidth={1.75} />
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
        className="absolute inset-y-0 end-0 grid w-10 place-items-center bg-[color-mix(in_srgb,var(--mx-btn)_92%,#000)] text-white/85 transition-colors hover:text-white [&_svg]:size-3.5"
      >
        {paused ? <Play /> : <Pause />}
      </button>
    </div>
  );
}
