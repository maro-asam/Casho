import { cn } from "@/lib/utils";

const BEANS = 14;

/** The roastery seal: a ring of beans that turns slowly when there's motion,
 *  and the store's own words set straight in the middle (Arabic can't run
 *  round a circle: browsers drop its letter joins on a text path). Words only
 *  from real store data — its name, an origin. */
export default function Stamp({ words, className }: { words: string[]; className?: string }) {
  const [main, sub] = words.map((w) => w?.trim()).filter(Boolean);
  if (!main) return null;
  const long = [...main].length;
  return (
    <span aria-hidden className={cn("bn-stamp", className)}>
      <svg viewBox="0 0 120 120" className="bn-stamp-ring">
        <circle cx="60" cy="60" r="55" className="bn-stamp-rule" />
        <circle cx="60" cy="60" r="39" className="bn-stamp-rule" />
        <g className="bn-stamp-beans">
          {Array.from({ length: BEANS }, (_, i) => (
            <g key={i} transform={`rotate(${(360 / BEANS) * i} 60 60) translate(60 13)`}>
              <ellipse rx="2.6" ry="3.8" />
              <path d="M0 -3.2c-.9 1.2-.9 2 0 3.2s.9 2 0 3.2" />
            </g>
          ))}
        </g>
      </svg>
      <span className="bn-stamp-core">
        <span className="bn-stamp-main" style={{ fontSize: `${long > 9 ? 0.62 : long > 6 ? 0.74 : 0.9}em` }}>
          {main}
        </span>
        {sub && <span className="bn-stamp-sub">{sub}</span>}
      </span>
    </span>
  );
}
