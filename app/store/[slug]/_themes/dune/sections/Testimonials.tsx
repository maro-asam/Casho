"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TestimonialsContent } from "@/types/store-theme.types";
import { Rating, Wrap, num } from "../ui";

/** Customer words, one at a time: a large centered serif quote with a
 *  crossfade between them. */
export default function Testimonials({ content }: { content?: TestimonialsContent }) {
  const items = content?.items?.filter((t) => t.text?.trim()).slice(0, 8) ?? [];
  const [i, setI] = useState(0);
  if (items.length === 0) return null;
  const go = (n: number) => setI((n + items.length) % items.length);

  return (
    <Wrap data-reveal className="dn-section">
      <section aria-roledescription="carousel" aria-label={content?.headline || "آراء العملاء"} className="dn-appear mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="dn-label text-(--dn-quiet)">{content?.headline || "العملاء بيقولوا إيه"}</p>
        <div className="mt-8 grid w-full">
          {items.map((t, n) => (
            <figure
              key={n}
              aria-hidden={n !== i}
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center transition-[opacity,transform] duration-700 ease-(--dn-ease)",
                n === i ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
              )}
            >
              {t.rating ? <Rating value={t.rating} size="md" /> : null}
              <blockquote className="dn-serif mt-6 text-balance text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.3]">«{t.text}»</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                {t.avatar && (
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
                    <Image src={t.avatar} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                )}
                <span className="dn-label">{t.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {items.length > 1 && (
          <div className="mt-10 flex items-center gap-4">
            <button type="button" onClick={() => go(i - 1)} aria-label="الرأي السابق" className="dn-icon border border-(--dn-line-ink) [&_svg]:size-4">
              <ArrowRight className="ltr:rotate-180" />
            </button>
            <span className="dn-num min-w-14 text-lg tabular-nums" aria-live="polite">
              {num(i + 1)} / {num(items.length)}
            </span>
            <button type="button" onClick={() => go(i + 1)} aria-label="الرأي التالي" className="dn-icon border border-(--dn-line-ink) [&_svg]:size-4">
              <ArrowLeft className="ltr:rotate-180" />
            </button>
          </div>
        )}
      </section>
    </Wrap>
  );
}
