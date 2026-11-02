"use client";

import { useEffect, useState } from "react";

import { formatPrice } from "@/lib/utils";
import { btn } from "../ui";

/** apple.com's local nav: once the product's title scrolls away, a glass bar
 *  under the global one keeps its name, price and "اشترِ" in reach (wide
 *  screens; phones get the purchase bar at the bottom). */
export default function LocalNav({ name, price, watch, target }: { name: string; price: number; /** Element id that hides the bar while visible. */ watch: string; /** Element id "اشترِ" scrolls to. */ target: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    // Root reaches far below the screen: the bar shows once the title is above the top.
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { rootMargin: "0px 0px 100000px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);

  return (
    <div className="sg-localnav max-lg:hidden" data-show={show} aria-hidden={!show} inert={!show}>
      <div className="sg-wrap flex h-full items-center justify-between gap-6">
        <p className="truncate text-xl font-semibold text-(--sg-ink)">{name}</p>
        <div className="flex shrink-0 items-center gap-4">
          <span className="sg-price text-sm">{formatPrice(price)}</span>
          <button type="button" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })} className={btn({ size: "sm" })}>
            اشترِ
          </button>
        </div>
      </div>
    </div>
  );
}
