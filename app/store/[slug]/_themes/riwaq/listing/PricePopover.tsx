"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "radix-ui";

import type { ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import { filtersQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { RQ_PORTAL, btn } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

export function PriceFields({ query, priceBounds }: { query: ProductsQuery; priceBounds: { min: number; max: number } | null }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        {(["minPrice", "maxPrice"] as const).map((name) => (
          <label key={name} className="block">
            <span className="rq-label block">{name === "minPrice" ? st("من") : st("إلى")}{" "}{st("(ج.م)")}</span>
            <input
              type="number"
              inputMode="numeric"
              name={name}
              min={0}
              defaultValue={query[name] || ""}
              placeholder={priceBounds ? String(Math.floor(name === "minPrice" ? priceBounds.min : priceBounds.max)) : "0"}
              className="rq-field rq-face text-xl tabular-nums"
            />
          </label>
        ))}
      </div>
      {priceBounds && (
        <p className="rq-caption mt-3">
          {st("الأسعار في المتجر من {0} لحد {1}", formatPrice(priceBounds.min), formatPrice(priceBounds.max))}
        </p>
      )}
    </>
  );
}

/** Desktop price filter: a small ruled sheet under the toolbar. */
export default function PricePopover({
  storeSlug,
  query,
  priceBounds,
  dir,
}: {
  storeSlug: string;
  query: ProductsQuery;
  priceBounds: { min: number; max: number } | null;
  dir: "rtl" | "ltr";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = query.minPrice > 0 || query.maxPrice > 0;
  const label = active
    ? `${query.minPrice ? formatPrice(query.minPrice) : "٠"} – ${query.maxPrice ? formatPrice(query.maxPrice) : "∞"}`
    : st("السعر");

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={cn("rq-opt gap-2 border-transparent text-sm data-[state=open]:border-(--rq-ink)", active && "border-(--rq-ink)")}>
        <span className="tabular-nums">{label}</span>
        <ChevronDown className="size-4 transition-transform duration-(--rq-dur) [[data-state=open]>&]:rotate-180" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          dir={dir}
          className={cn(RQ_PORTAL, "z-50 w-80 border border-(--rq-ink) p-5 outline-none data-[state=open]:animate-[rq-rise_220ms_ease-out]")}
        >
          <form
            key={JSON.stringify(query)}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(storeHref(storeSlug, `/products${filtersQueryString(query, new FormData(e.currentTarget))}`), { scroll: false });
              setOpen(false);
            }}
          >
            <p className="rq-h3 mb-4">{st("نطاق السعر")}</p>
            <PriceFields query={query} priceBounds={priceBounds} />
            <div className="mt-5 flex items-center justify-between gap-3">
              {active ? (
                <button
                  type="button"
                  onClick={() => {
                    const data = new FormData();
                    data.set("minPrice", "");
                    data.set("maxPrice", "");
                    router.push(storeHref(storeSlug, `/products${filtersQueryString(query, data)}`), { scroll: false });
                    setOpen(false);
                  }}
                  className={btn({ variant: "text", size: "sm" })}
                >
                  {st("مسح")}
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className={btn({ size: "sm" })}>
                {st("تطبيق")}
              </button>
            </div>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
