"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Globe, Layers, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";
import { useLandingCopy } from "./copy";
import HeroMap from "./HeroMap";

/**
 * Panorama hero, centred. The claim, then what Casho is as a sum — barcode
 * POS + online store = one stock and one report — then the call to action.
 * Under them, full bleed, the world laid back to the horizon with the
 * merchant's shop in Cairo right below the headline: online orders fly in
 * from around the world (blue), sales at the till pulse on the spot (green).
 * The sum's icons and colours are the map's, so the scene reads as the sum
 * in motion.
 * Light and dark follow the site theme.
 *
 * The headline (the LCP) paints unanimated; the panorama is one canvas that
 * only runs while on screen (HeroMap.tsx).
 */
export default function AppleHero() {
  const c = useLandingCopy().hero;
  const { lang } = useLang();
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const textRef = useRef<HTMLDivElement>(null);

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex flex-col overflow-hidden bg-(--al-bg) lg:min-h-[100dvh]">
      {/* A cool wash from the top. Gradients only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60%] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(51,102,255,0.09),transparent)] dark:bg-[radial-gradient(70%_60%_at_50%_0%,rgba(51,102,255,0.13),transparent)]"
      />

      <div ref={textRef} className="al-container-wide relative z-10 pt-[clamp(108px,14svh,136px)] text-center">
        <h1
          id="hero-title"
          className="text-[clamp(42px,11.5vw,60px)] font-bold leading-[1.22] text-balance lg:text-[clamp(54px,min(5vw,8.6svh),78px)] ltr:leading-[1.04] ltr:tracking-[-0.035em]"
        >
          <span className="block">{c.title1}</span>
          <span className="al-gradient-text block pb-[0.06em]">{c.title2}</span>
        </h1>

        {/* What Casho is: POS + online store = one stock, one report. */}
        <div className="mx-auto mt-7 flex max-w-[820px] items-stretch justify-center gap-1.5 sm:mt-8 sm:gap-3">
          <Pillar tone="pos" icon={ScanBarcode} title={c.pillars.pos.title} caption={c.pillars.pos.caption} />
          <Operator>+</Operator>
          <Pillar tone="online" icon={Globe} title={c.pillars.online.title} caption={c.pillars.online.caption} />
          <Operator>=</Operator>
          <Pillar tone="one" icon={Layers} title={c.pillars.one.title} caption={c.pillars.one.caption} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <Link href="/register" className="al-btn al-btn-filled px-8">
            {c.cta}
          </Link>
          <Link href="#pricing" className="al-link">
            {c.secondary}
            <Chevron className="size-4" strokeWidth={2} />
          </Link>
        </div>
        <p className="mt-3 text-[13px] text-(--al-faint)">{c.note}</p>
      </div>

      {/* Full bleed; tucks up under the text, whose side it fades out on. */}
      <HeroMap
        avoidRef={textRef}
        className="-mt-4 h-[clamp(320px,46svh,420px)] lg:mt-0 lg:h-auto lg:min-h-[clamp(360px,44svh,560px)] lg:flex-1"
      />
    </section>
  );
}

const TERM = "bg-black/[0.035] ring-black/[0.06] dark:bg-white/[0.06] dark:ring-white/10";
const TONE = {
  pos: { tile: "from-[#34c759] to-[#1a8a3e]", card: TERM },
  online: { tile: "from-[#4d7cff] to-[#1447e6]", card: TERM },
  one: {
    tile: "from-white/30 to-white/10",
    card: "bg-[#1447e6] ring-[#1447e6] text-white shadow-[0_14px_36px_-14px_rgba(20,71,230,0.7)] dark:bg-[#2f5cff] dark:ring-[#2f5cff]",
  },
};

/** One term of the sum: an icon in its channel's colour, a name, what it's for. */
function Pillar({
  tone,
  icon: Icon,
  title,
  caption,
}: {
  tone: keyof typeof TONE;
  icon: typeof Globe;
  title: string;
  caption: string;
}) {
  const result = tone === "one";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 basis-0 flex-col items-center rounded-[18px] px-2 py-3 ring-1 sm:flex-row sm:gap-3 sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-start",
        TONE[tone].card,
      )}
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] bg-linear-to-b text-white sm:size-10 sm:rounded-[12px]", TONE[tone].tile)}>
        <Icon className="size-4 sm:size-5" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("mt-2 text-[13px] font-semibold leading-snug text-balance sm:mt-0 sm:text-[15px]", !result && "text-(--al-text)")}>
          {title}
        </span>
        <span className={cn("mt-0.5 text-[10.5px] leading-snug text-balance sm:text-[12.5px]", result ? "text-white/75" : "text-(--al-muted)")}>
          {caption}
        </span>
      </span>
    </div>
  );
}

function Operator({ children }: { children: string }) {
  return (
    <span aria-hidden className="grid w-3 shrink-0 place-items-center text-[18px] font-semibold text-(--al-faint) sm:w-5 sm:text-[24px]">
      {children}
    </span>
  );
}
