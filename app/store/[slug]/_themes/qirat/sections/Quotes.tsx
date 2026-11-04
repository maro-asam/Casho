"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { TestimonialItem } from "@/types/store-theme.types";
import { Rating } from "../ui";

/** One customer at a time, their words set large in serif between gold
 *  quote marks; arrows and dots move through the rest. */
export default function Quotes({ items }: { items: TestimonialItem[] }) {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + items.length) % items.length);
  const t = items[i];
  const many = items.length > 1;

  return (
    <div className="qr-quotes" aria-roledescription={many ? "carousel" : undefined}>
      <figure key={i} className="qr-quote qr-fade" aria-live="polite">
        <span aria-hidden className="qr-quote-mark">
          ”
        </span>
        <blockquote className="qr-quote-text text-balance">{t.text}</blockquote>
        <figcaption className="mt-8 flex flex-col items-center gap-3">
          {t.avatar ? (
            <span className="relative size-12 overflow-hidden rounded-full ring-1 ring-(--qr-line-gold) ring-offset-2 ring-offset-(--qr-bg)">
              <Image src={t.avatar} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ) : null}
          <span className="qr-serif text-lg text-(--qr-ink)">{t.name}</span>
          {t.rating ? <Rating value={t.rating} /> : null}
        </figcaption>
      </figure>
      {many && (
        <div className="mt-10 flex items-center justify-center gap-5">
          <button type="button" onClick={() => go(i - 1)} aria-label="الرأي السابق" className="qr-paddle">
            <ChevronRight className="ltr:rotate-180" />
          </button>
          <ol className="flex items-center gap-2">
            {items.map((_, n) => (
              <li key={n}>
                <button type="button" onClick={() => setI(n)} aria-label={`الرأي ${n + 1}`} aria-current={n === i} className="qr-pip" />
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => go(i + 1)} aria-label="الرأي التالي" className="qr-paddle">
            <ChevronLeft className="ltr:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
