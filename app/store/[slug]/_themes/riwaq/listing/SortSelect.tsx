"use client";

import { useRouter } from "next/navigation";

import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "../../shared/commerce";
import { storeHref } from "../../shared/store-path";

/** Native <select> (the best picker on phones), set as an underlined field. */
export default function SortSelect({
  storeSlug,
  query,
  label = "ترتيب",
  className,
}: {
  storeSlug: string;
  query: ProductsQuery;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <label className={cn("flex items-center gap-3", className)}>
      <span className="rq-label shrink-0">{label}</span>
      <select
        value={query.sort}
        onChange={(e) =>
          router.push(
            storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as ProductsQuery["sort"], page: 1 })}`),
            { scroll: false },
          )
        }
        className="rq-field rq-select min-h-11 w-auto min-w-0 border-transparent"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
