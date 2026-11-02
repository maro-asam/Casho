import { useId } from "react";

import { cn } from "@/lib/utils";

/** A bumper plate drawn in code: the theme's signature object. The rim, the
 *  steel and the stripe come from the store colors, and the store's own name
 *  is cast into the rubber, top and bottom. Decorative. */
export default function WeightPlate({ label, className }: { label: string; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const name = [...label].length > 22 ? `${[...label].slice(0, 21).join("")}…` : label;
  return (
    <svg viewBox="0 0 400 400" aria-hidden className={cn("gy-weight", className)}>
      <defs>
        <radialGradient id={`${id}-rubber`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="var(--gy-steel-1)" />
          <stop offset="100%" stopColor="var(--gy-steel-2)" />
        </radialGradient>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2f1ee" />
          <stop offset="48%" stopColor="#8d8d93" />
          <stop offset="100%" stopColor="#3a3a3f" />
        </linearGradient>
        {/* Upper arc reads left to right; lower arc reads upright along the rim. */}
        <path id={`${id}-top`} d="M 56 200 A 144 144 0 0 1 344 200" fill="none" />
        <path id={`${id}-bottom`} d="M 44 200 A 156 156 0 0 0 356 200" fill="none" />
      </defs>

      <circle cx="200" cy="200" r="197" fill={`url(#${id}-rubber)`} />
      <circle cx="200" cy="200" r="197" fill="none" stroke="var(--gy-line-strong)" strokeWidth="2" />
      <circle cx="200" cy="200" r="183" fill="none" stroke="var(--gy-btn)" strokeWidth="7" />
      <circle cx="200" cy="200" r="128" fill="var(--gy-steel-2)" stroke="var(--gy-line-strong)" strokeWidth="2" />
      <circle cx="200" cy="200" r="110" fill="none" stroke="var(--gy-line)" strokeWidth="1.5" strokeDasharray="3 6" />

      {/* Lifting grips */}
      {[0, 120, 240].map((a) => (
        <path key={a} transform={`rotate(${a} 200 200)`} d="M 151 113 A 100 100 0 0 1 249 113 L 236 134 A 76 76 0 0 0 164 134 Z" fill="var(--gy-bg)" stroke="var(--gy-line-strong)" strokeWidth="1.5" />
      ))}

      <circle cx="200" cy="200" r="58" fill={`url(#${id}-steel)`} />
      <circle cx="200" cy="200" r="42" fill="none" stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="27" fill="var(--gy-bg)" stroke="rgb(0 0 0 / 0.5)" strokeWidth="2" />

      <g fill="var(--gy-quiet)" fontSize="30" fontWeight="900" style={{ fontFamily: "inherit" }}>
        <text textAnchor="middle" direction="rtl">
          <textPath href={`#${id}-top`} startOffset="50%">
            {name}
          </textPath>
        </text>
        <text textAnchor="middle" direction="rtl" dominantBaseline="hanging">
          <textPath href={`#${id}-bottom`} startOffset="50%">
            {name}
          </textPath>
        </text>
      </g>
    </svg>
  );
}
