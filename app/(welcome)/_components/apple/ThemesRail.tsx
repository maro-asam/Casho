"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import SectionHead from "./SectionHead";

// Swatches approximate each preset in constants/store-themes.ts.
const THEME_TOKENS: Record<string, { bg: string; fg: string; primary: string; accent: string; serif?: boolean; arch?: boolean }> = {
  default: { bg: "#ffffff", fg: "#0a0d1a", primary: "#2563eb", accent: "#eff6ff" },
  riwaq: { bg: "#f2ece1", fg: "#1d1a16", primary: "#a8432a", accent: "#efd9cb", serif: true, arch: true },
  mada: { bg: "#f7f7f4", fg: "#121714", primary: "#123b30", accent: "#d5ee6a" },
  dune: { bg: "#f7f7f7", fg: "#2a2a28", primary: "#2a2a28", accent: "#c7b8a1", serif: true },
  maximize: { bg: "#ffffff", fg: "#100f0f", primary: "#0b7f6f", accent: "#e3f4f1" },
  cello: { bg: "#f8f8f8", fg: "#202020", primary: "#1447e6", accent: "#ffd23f" },
  medical: { bg: "#f4f8f8", fg: "#0f2a2e", primary: "#0a6c74", accent: "#e3f3f1" },
  gym: { bg: "#0b0b0d", fg: "#f5f3ef", primary: "#e10600", accent: "#efece6" },
  market: { bg: "#ffffff", fg: "#1d1d1f", primary: "#f26a00", accent: "#f5f5f7" },
  stage: { bg: "#f5f5f7", fg: "#1d1d1f", primary: "#0071e3", accent: "#000000" },
  qirat: { bg: "#fbf9f5", fg: "#1f1a14", primary: "#1f1a14", accent: "#b08d57", serif: true },
};

export default function ThemesRail() {
  const c = useLandingCopy().themes;
  const { lang } = useLang();
  const railRef = useRef<HTMLDivElement>(null);

  // In RTL the rail scrolls the other way; "next" always moves toward the end.
  const scrollBy = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = (rail.firstElementChild as HTMLElement | null)?.offsetWidth ?? 320;
    rail.scrollBy({ left: dir * (step + 20) * (lang === "ar" ? -1 : 1), behavior: "smooth" });
  };

  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <section id="themes" aria-labelledby="themes-title" className="al-section al-section-surface scroll-mt-16 overflow-hidden">
      <SectionHead id="themes-title" eyebrow={c.eyebrow} title={c.title} accent={c.accent} subtitle={c.subtitle} />

      <div ref={railRef} className="al-rail al-body">
        {c.items.map((item) => {
          const t = THEME_TOKENS[item.id];
          return (
            <article key={item.id} className="w-[78vw] max-w-[340px] sm:w-[340px]">
              <ThemePreview tokens={t} name={item.name} />
              <h3 className="al-item-title mt-5">{item.name}</h3>
              <p className="al-item-note">{item.note}</p>
            </article>
          );
        })}
      </div>

      <div className="al-container mt-4 flex justify-end gap-3">
        <button type="button" onClick={() => scrollBy(-1)} aria-label={c.prev} className="al-icon-btn">
          <Prev className="size-5" strokeWidth={2} />
        </button>
        <button type="button" onClick={() => scrollBy(1)} aria-label={c.next} className="al-icon-btn">
          <Next className="size-5" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

function ThemePreview({ tokens: t, name }: { tokens: (typeof THEME_TOKENS)[string]; name: string }) {
  return (
    <div
      aria-hidden
      className="aspect-[4/5] overflow-hidden rounded-(--al-r-lg) p-4 shadow-[inset_0_0_0_0.5px_var(--al-hair)]"
      style={{ background: t.bg, color: t.fg }}
    >
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold" style={{ fontFamily: t.serif ? "Georgia, serif" : undefined }}>
          {name}
        </span>
        <span className="flex gap-1.5">
          <span className="h-1.5 w-6 rounded-full opacity-30" style={{ background: t.fg }} />
          <span className="h-1.5 w-4 rounded-full opacity-30" style={{ background: t.fg }} />
        </span>
      </div>

      <div
        className="mt-3 flex h-[38%] items-end p-3"
        style={{
          background: t.accent,
          borderRadius: t.arch ? "999px 999px 14px 14px" : t.serif ? "2px" : "16px",
        }}
      >
        <span className="rounded-full px-3 py-1.5 text-[10px] font-semibold text-white" style={{ background: t.primary }}>
          ●●●
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div
              className="aspect-square"
              style={{
                background: i % 2 ? t.accent : `color-mix(in srgb, ${t.fg} 10%, ${t.bg})`,
                borderRadius: t.serif ? "2px" : "12px",
              }}
            />
            <div className="mt-1.5 h-1.5 w-3/4 rounded-full opacity-25" style={{ background: t.fg }} />
            <div className="mt-1 h-1.5 w-1/3 rounded-full" style={{ background: t.primary }} />
          </div>
        ))}
      </div>
    </div>
  );
}
