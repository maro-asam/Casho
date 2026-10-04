"use client";

import { useRouter } from "next/navigation";
import { ArrowDownUp, ChevronDown } from "lucide-react";

import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { storeHref } from "../../shared/store-path";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "../../shared/commerce";

export { SORT_OPTIONS };

/** Native <select> — the best picker on every phone, styled to match. */
export default function SortSelect({
  storeSlug,
  query,
  className,
}: {
  storeSlug: string;
  query: ProductsQuery;
  className?: string;
}) {
  const router = useRouter();
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">ترتيب المنتجات</span>
      <ArrowDownUp aria-hidden className="pointer-events-none absolute start-3 size-4 text-muted-foreground" />
      <select
        value={query.sort}
        onChange={(e) =>
          router.push(
            storeHref(
              storeSlug,
              `/products${productsQueryString({ ...query, sort: e.target.value as ProductsQuery["sort"], page: 1 })}`,
            ),
            { scroll: false },
          )
        }
        className="h-(--c-control) w-full cursor-pointer appearance-none rounded-(--c-btn-radius) border border-border bg-background pe-9 ps-9 text-sm font-semibold outline-none transition-colors hover:border-foreground/40 lg:h-10"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute end-3 size-4 text-muted-foreground" />
    </label>
  );
}
