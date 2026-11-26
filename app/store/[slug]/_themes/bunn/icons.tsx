// Bunn's own line glyphs: the bean, and one per brew method / grind. Drawn on
// the same 24px grid and stroke as lucide, so they sit beside its icons.

import type { SVGProps } from "react";

import type { BrewId, GrindId } from "./lib/coffee";

type P = SVGProps<SVGSVGElement>;

function Glyph({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

export function BeanIcon(p: P) {
  return (
    <Glyph {...p}>
      <g transform="rotate(35 12 12)">
        <ellipse cx="12" cy="12" rx="6.2" ry="9" />
        <path d="M12 3.2c-1.9 3-1.9 5.7 0 8.8s1.9 5.8 0 8.8" />
      </g>
    </Glyph>
  );
}

function Beans(p: P) {
  return (
    <Glyph {...p}>
      <g transform="rotate(30 8.5 13)">
        <ellipse cx="8.5" cy="13" rx="4" ry="6" />
        <path d="M8.5 7.2c-1.2 2-1.2 3.8 0 5.8s1.2 3.8 0 5.8" />
      </g>
      <g transform="rotate(-25 16 10)">
        <ellipse cx="16" cy="10" rx="3.6" ry="5.4" />
        <path d="M16 4.8c-1.1 1.8-1.1 3.4 0 5.2s1.1 3.4 0 5.2" />
      </g>
    </Glyph>
  );
}

function Espresso(p: P) {
  return (
    <Glyph {...p}>
      <path d="M5 10h11v2.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 11h1.4a2 2 0 0 1 0 4H15.4" />
      <path d="M3 20.5h16" />
      <path d="M9 3.5c-.7.9.7 1.8 0 2.7M12 3.5c-.7.9.7 1.8 0 2.7" />
    </Glyph>
  );
}

function Cezve(p: P) {
  return (
    <Glyph {...p}>
      <path d="M5.8 9.5h9.4" />
      <path d="M7 9.5l.7 1.9C5.9 12.8 5 14.8 5 17v3h11v-3c0-2.2-.9-4.2-2.7-5.6l.7-1.9" />
      <path d="M15.4 11.2l6.1-3.4" />
      <path d="M9 6.5c-.6-.8.6-1.6 0-2.4M12 6.5c-.6-.8.6-1.6 0-2.4" />
    </Glyph>
  );
}

function Dripper(p: P) {
  return (
    <Glyph {...p}>
      <path d="M3.5 6.5h17" />
      <path d="M5 6.5l4.5 7h5l4.5-7" />
      <path d="M9.5 13.5v1.5h5v-1.5" />
      <path d="M6.5 17h11v1a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3z" />
    </Glyph>
  );
}

function Press(p: P) {
  return (
    <Glyph {...p}>
      <path d="M12 2.5v11" />
      <path d="M7 5h10" />
      <path d="M7.5 13.5h9" />
      <path d="M7 5v14.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5V5" />
      <path d="M17 8h1.5A1.5 1.5 0 0 1 20 9.5v5a1.5 1.5 0 0 1-1.5 1.5H17" />
    </Glyph>
  );
}

function Moka(p: P) {
  return (
    <Glyph {...p}>
      <path d="M11.5 2.5V4" />
      <path d="M7.5 4h8l-1.4 6.5H8.9z" />
      <path d="M7.5 4 5.5 5.6" />
      <path d="M8.5 11h7" />
      <path d="M9 11.5h6l2 9H7z" />
      <path d="M15.5 5.2h2.6l-1 4.6h-2.2" />
    </Glyph>
  );
}

function ColdBrew(p: P) {
  return (
    <Glyph {...p}>
      <path d="M7 3.5h10V6H7z" />
      <path d="M7.5 6h9v13a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z" />
      <path d="M7.5 9.5h9" />
      <path d="M9.6 12.3l2.4-.9.9 2.4-2.4.9zM12.6 16l2.4-.5.5 2.4-2.4.5z" />
    </Glyph>
  );
}

const BREW: Record<BrewId, (p: P) => React.JSX.Element> = {
  filter: Dripper,
  espresso: Espresso,
  turkish: Cezve,
  french: Press,
  moka: Moka,
  cold: ColdBrew,
};

const GRIND: Record<GrindId, (p: P) => React.JSX.Element> = {
  whole: Beans,
  espresso: Espresso,
  turkish: Cezve,
  filter: Dripper,
  french: Press,
  moka: Moka,
};

export function BrewIcon({ id, ...p }: P & { id: BrewId }) {
  const Icon = BREW[id];
  return <Icon {...p} />;
}

export function GrindIcon({ id, ...p }: P & { id: GrindId }) {
  const Icon = GRIND[id];
  return <Icon {...p} />;
}

/** Three wisps of steam over a cup (they drift up when there's motion). */
export function Steam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 80" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden className={className}>
      <path className="bn-wisp" d="M18 76c-8-10 8-16 0-28s8-18 0-30" />
      <path className="bn-wisp" d="M30 76c-8-12 8-18 0-30s8-18 0-30" />
      <path className="bn-wisp" d="M42 76c-8-10 8-16 0-28s8-18 0-30" />
    </svg>
  );
}
