"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { BannerData } from "../../types";
import { Arrow, num } from "../ui";

/** Merchant banners as numbered "plates": an uncropped-feeling wide image
 *  with a caption line under it. Swipe on touch, arrows on desktop; the next
 *  plate peeks in so it reads as a sequence. */
export default function Plates({ banners, storeSlug }: { banners: BannerData[]; storeSlug: string }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const multiple = banners.length > 1;

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(rail).columnGap || "0");
    const i = Math.round(Math.abs(rail.scrollLeft) / step);
    setActive((prev) => (prev === i ? prev : Math.min(banners.length - 1, i)));
  }, [banners.length]);

  const goTo = (i: number) => {
    const target = Math.max(0, Math.min(banners.length - 1, i));
    (railRef.current?.children[target] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  return (
    <section aria-roledescription="carousel" aria-label="العروض" className="rq-wrap rq-section">
      <ul ref={railRef} onScroll={onScroll} className="rq-rail rq-bleed gap-3 lg:mx-0 lg:gap-5 lg:px-0">
        {banners.map((b, i) => (
          <li
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${num(i + 1)} من ${num(banners.length)}`}
            className={cn("min-w-0 shrink-0", multiple ? "basis-[88%] lg:basis-[86%]" : "basis-full")}
          >
            <Link href={buildStoreUrl(storeSlug, "/products")} tabIndex={i === active ? 0 : -1} className="group block">
              <div className="rq-plate relative aspect-[4/3] overflow-hidden sm:aspect-[16/7] lg:aspect-[16/6]">
                <Image
                  src={b.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1024px) 88vw, 1240px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.025]"
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-4 border-b border-(--rq-rule) pb-3">
                <p className="min-w-0">
                  <span className="rq-num me-3 text-xs text-(--rq-accent)">
                    {num(i + 1)} / {num(banners.length)}
                  </span>
                  <span className="rq-face text-lg font-semibold sm:text-xl">{b.title}</span>
                </p>
                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
                  <span className="rq-link">تسوّق</span>
                  <Arrow />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {multiple && (
        <div className="mt-4 flex items-center justify-between gap-6">
          <div className="flex h-0.5 flex-1 gap-1" aria-hidden>
            {banners.map((b, i) => (
              <span
                key={b.id}
                className={cn("h-full flex-1 transition-colors duration-(--rq-dur)", i === active ? "bg-(--rq-ink)" : "bg-(--rq-rule)")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="العرض السابق"
              className="grid size-11 place-items-center border border-(--rq-rule-strong) transition-colors hover:border-(--rq-ink) disabled:opacity-35"
            >
              <ArrowRight className="size-[1.125rem] ltr:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === banners.length - 1}
              aria-label="العرض التالي"
              className="grid size-11 place-items-center border border-(--rq-rule-strong) transition-colors hover:border-(--rq-ink) disabled:opacity-35"
            >
              <ArrowLeft className="size-[1.125rem] ltr:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
