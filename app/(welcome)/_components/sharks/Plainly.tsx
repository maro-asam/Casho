"use client";

import Reveal from "../apple/Reveal";
import { useSharksCopy } from "./copy";

/** The program's commitments, stated plainly — a hairline grid, no decoration. */
export default function Plainly() {
  const c = useSharksCopy();
  return (
    <section className="al-section" aria-labelledby="sharks-plainly-title">
      <div className="al-container">
        <Reveal>
          <h2 id="sharks-plainly-title" className="al-section-title text-center">
            {c.plainly.title}
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-(--al-hair) sm:grid-cols-2">
          {c.plainly.items.map((item) => (
            <div key={item.title} className="bg-(--al-bg) p-8 md:p-10">
              <h3 className="text-[24px] font-bold leading-snug md:text-[28px]">{item.title}</h3>
              <p className="mt-3 text-[17px] leading-relaxed text-(--al-muted)">{item.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
