"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import type { ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import { clearedQueryString, filtersQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { RQ_PORTAL, btn, num } from "../ui";
import { PriceFields } from "./PricePopover";
import SortSelect from "./SortSelect";

type Props = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: { min: number; max: number } | null;
  activeCount: number;
  total: number;
  dir: "rtl" | "ltr";
};

/** Phones/tablets: a sticky two-part bar (filter | sort) and a full-screen
 *  paper filter page with big, thumb-sized choices. */
export default function MobileFilters({ storeSlug, query, categories, priceBounds, activeCount, total, dir }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const push = (qs: string) => {
    router.push(storeHref(storeSlug, `/products${qs}`), { scroll: false });
    setOpen(false);
  };

  return (
    <div className="sticky top-(--rq-bar-h) z-30 -mx-(--rq-gutter) mb-0 border-b border-(--rq-rule) bg-(--rq-paper)/95 backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-2 divide-x divide-(--rq-rule) rtl:divide-x-reverse">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold">
            تصفية
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center bg-(--rq-accent) px-1 text-[0.6875rem] font-bold text-(--rq-accent-ink)">
                {num(activeCount)}
              </span>
            )}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content
              dir={dir}
              aria-describedby={undefined}
              className={cn(RQ_PORTAL, "fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-[rq-rise_280ms_cubic-bezier(.16,1,.3,1)]")}
            >
              <div className="rq-wrap flex h-(--rq-bar-h) shrink-0 items-center justify-between border-b border-(--rq-rule)">
                <Dialog.Title className="rq-h3">تصفية المنتجات</Dialog.Title>
                <Dialog.Close className="-me-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold">
                  إغلاق
                  <X className="size-5" />
                </Dialog.Close>
              </div>

              <form
                key={JSON.stringify(query)}
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  push(filtersQueryString(query, new FormData(e.currentTarget)));
                }}
              >
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="rq-wrap space-y-10 py-6">
                    {categories.length > 0 && (
                      <fieldset>
                        <legend className="rq-label mb-2">التصنيف</legend>
                        {[{ id: "", slug: "", name: "الكل", productCount: null as number | null }, ...categories].map((c) => (
                          <label
                            key={c.id || "all"}
                            className="flex min-h-14 cursor-pointer items-center gap-4 border-b border-(--rq-rule) has-[:checked]:text-(--rq-accent)"
                          >
                            <input
                              type="radio"
                              name="category"
                              value={c.slug}
                              defaultChecked={query.category === c.slug}
                              className="size-5 shrink-0 accent-(--rq-accent)"
                            />
                            <span className="rq-face min-w-0 flex-1 truncate text-lg font-semibold">{c.name}</span>
                            {c.productCount !== null && <span className="rq-num text-xs text-(--rq-quiet)">{num(c.productCount)}</span>}
                          </label>
                        ))}
                      </fieldset>
                    )}

                    <fieldset>
                      <legend className="rq-label mb-3">السعر</legend>
                      <PriceFields query={query} priceBounds={priceBounds} />
                    </fieldset>

                    <fieldset>
                      <legend className="rq-label mb-2">عرض</legend>
                      <input type="hidden" name="featuredField" value="1" />
                      <label className="flex min-h-14 cursor-pointer items-center gap-4 border-y border-(--rq-rule)">
                        <input
                          type="checkbox"
                          name="featured"
                          value="true"
                          defaultChecked={query.featured}
                          className="size-5 shrink-0 accent-(--rq-accent)"
                        />
                        <span className="text-base">اختيارات المتجر بس</span>
                      </label>
                    </fieldset>
                  </div>
                </div>

                <div
                  className="rq-wrap grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-(--rq-rule) py-3"
                  style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                  <button type="button" onClick={() => push(clearedQueryString(query))} className={btn({ variant: "line", size: "lg" })}>
                    مسح الكل
                  </button>
                  <button type="submit" className={btn({ size: "lg", full: true })}>
                    عرض النتائج
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <SortSelect storeSlug={storeSlug} query={query} className="justify-center px-3" />
      </div>
      <p className="sr-only" aria-live="polite">
        {total} منتج
      </p>
    </div>
  );
}
