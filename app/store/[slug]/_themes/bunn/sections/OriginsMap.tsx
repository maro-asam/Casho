"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { MAP, MAP_SIZE, landDots, project, type RoastLevel } from "../lib/coffee";
import { PlateImage, Price, RoastMeter, num } from "../ui";
import { st } from "@/lib/i18n/storefront";

export type MapOrigin = {
  id: string;
  label: string;
  /** Map position, or null for an origin the map doesn't know (listed only). */
  at: { x: number; y: number } | null;
  items: {
    slug: string;
    name: string;
    image: string;
    price: number;
    compareAtPrice: number | null;
    roast: RoastLevel | null;
    process: string | null;
    notes: { label: string; color: string }[];
  }[];
};

const LABEL = 40; // label font size, viewBox units
const TROPIC = 23.44;

/** Greedy label placement: try the end, the start, above, below; a label that
 *  can't fit without overlapping stays off the map (the list has it). */
function placeLabels(pins: { id: string; label: string; x: number; y: number }[]) {
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  const out = new Map<string, { x: number; y: number; anchor: "start" | "end" | "middle" }>();
  const hits = (b: { x: number; y: number; w: number; h: number }) =>
    b.x < 0 || b.x + b.w > MAP_SIZE.w || b.y < 0 || b.y + b.h > MAP_SIZE.h || boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
  for (const p of [...pins].sort((a, b) => a.x - b.x)) boxes.push({ x: p.x - 20, y: p.y - 20, w: 40, h: 40 });
  for (const p of pins) {
    const w = [...p.label].length * LABEL * 0.56 + 10;
    const h = LABEL * 1.25;
    const tries: { box: { x: number; y: number; w: number; h: number }; at: { x: number; y: number; anchor: "start" | "end" | "middle" } }[] = [
      { box: { x: p.x + 26, y: p.y - h / 2, w, h }, at: { x: p.x + 28, y: p.y + LABEL * 0.36, anchor: "start" } },
      { box: { x: p.x - 26 - w, y: p.y - h / 2, w, h }, at: { x: p.x - 28, y: p.y + LABEL * 0.36, anchor: "end" } },
      { box: { x: p.x - w / 2, y: p.y - 26 - h, w, h }, at: { x: p.x, y: p.y - 34, anchor: "middle" } },
      { box: { x: p.x - w / 2, y: p.y + 26, w, h }, at: { x: p.x, y: p.y + 26 + LABEL, anchor: "middle" } },
    ];
    const ok = tries.find((t) => !hits(t.box));
    if (ok) {
      boxes.push(ok.box);
      out.set(p.id, ok.at);
    }
  }
  return out;
}

export default function OriginsMap({ origins, storeSlug }: { origins: MapOrigin[]; storeSlug: string }) {
  const [active, setActive] = useState(origins[0]?.id ?? null);
  const land = useMemo(() => landDots(), []);
  const pins = origins.filter((o) => o.at).map((o) => ({ id: o.id, label: o.label, x: o.at!.x, y: o.at!.y }));
  const labels = useMemo(() => placeLabels(pins), [origins]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = origins.find((o) => o.id === active) ?? origins[0];
  const cancer = project([TROPIC, 0]).y;
  const capricorn = project([-TROPIC, 0]).y;
  const equator = project([0, 0]).y;

  return (
    <div className="bn-belt">
      <div className="bn-belt-map">
        <svg viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`} role="img" aria-label={st("خريطة حزام البن ومناشئ القهوة في المتجر")}>
          <rect className="bn-belt-band" x="0" y={cancer} width={MAP_SIZE.w} height={capricorn - cancer} />
          <path className="bn-belt-land" d={land} />
          {[
            { y: cancer, label: st("مدار السرطان") },
            { y: equator, label: st("خط الاستواء") },
            { y: capricorn, label: st("مدار الجدي") },
          ].map((l) => (
            <g key={l.label} className="bn-belt-line">
              <line x1="0" x2={MAP_SIZE.w} y1={l.y} y2={l.y} />
              <text x={MAP_SIZE.w - 12} y={l.y - 10} textAnchor="end">
                {l.label}
              </text>
            </g>
          ))}
          {pins.map((p) => {
            const on = p.id === current?.id;
            const lab = labels.get(p.id);
            return (
              <g key={p.id} className="bn-pin" data-on={on || undefined}>
                <circle className="bn-pin-pulse" cx={p.x} cy={p.y} r="30" />
                <circle className="bn-pin-dot" cx={p.x} cy={p.y} r={on ? 17 : 13} />
                {lab && (
                  <text className="bn-pin-label" x={lab.x} y={lab.y} textAnchor={lab.anchor} style={{ fontSize: LABEL }}>
                    {p.label}
                  </text>
                )}
                <circle
                  className="bn-pin-hit"
                  cx={p.x}
                  cy={p.y}
                  r="44"
                  onMouseEnter={() => setActive(p.id)}
                  onClick={() => setActive(p.id)}
                />
              </g>
            );
          })}
        </svg>
        <p className="bn-belt-legend" aria-hidden>
          <span>{num(Math.abs(MAP.north))}°</span>
          <span>{st("الحزام بين المدارين، فين البن بيتزرع")}</span>
          <span>{num(Math.abs(MAP.south))}°</span>
        </p>
      </div>

      <div className="bn-belt-side">
        <ul role="tablist" aria-label={st("المناشئ")} className="bn-belt-tabs">
          {origins.map((o) => (
            <li key={o.id}>
              <button type="button" role="tab" aria-selected={o.id === current?.id} onClick={() => setActive(o.id)} className="bn-belt-tab">
                <span>{o.label}</span>
                <span className="bn-num">{num(o.items.length)}</span>
              </button>
            </li>
          ))}
        </ul>
        {current && (
          <ul key={current.id} role="tabpanel" aria-label={current.label} className="bn-belt-items bn-fade">
            {current.items.map((it) => (
              <li key={it.slug}>
                <Link href={buildStoreUrl(storeSlug, `/products/${it.slug}`)} className="bn-belt-item group">
                  <span className="bn-plate relative size-16 shrink-0 overflow-hidden">
                    <PlateImage src={it.image} sizes="64px" className="bn-zoom" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="bn-display line-clamp-1 block text-[0.9375rem]">{it.name}</span>
                    {it.notes.length > 0 && (
                      <span className="bn-notes mt-1" aria-label={st("النكهات")}>
                        {it.notes.map((n) => (
                          <span key={n.label} style={{ ["--note" as string]: n.color }}>
                            <i aria-hidden />
                            {n.label}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="mt-1.5 flex items-center gap-3">
                      <Price price={it.price} compareAt={it.compareAtPrice} size="sm" />
                      {it.roast && <RoastMeter level={it.roast} />}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
