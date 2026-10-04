"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import type { CategoryLink } from "../../types";
import { CLASSIC_PORTAL, btn } from "../ui";
import FilterForm from "./FilterForm";
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

/** Sticky filter + sort bar for phones and tablets, filters in a bottom sheet. */
export default function MobileFilterBar({ storeSlug, query, categories, priceBounds, activeCount, total, dir }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-(--c-header-h) z-30 -mx-(--c-gutter) mb-4 border-b border-border bg-background/95 px-(--c-gutter) py-2.5 backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={btn({ variant: "outline", size: "md", className: "w-full px-3" })}>
            <SlidersHorizontal />
            فلترة
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] font-bold text-primary-foreground tabular-nums">
                {activeCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            dir={dir}
            className={cn(CLASSIC_PORTAL, "max-h-[88dvh] gap-0 rounded-t-(--c-radius-lg) border-0 p-0")}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pe-2 ps-4">
              <SheetTitle className="text-base font-bold">فلترة المنتجات</SheetTitle>
              <SheetDescription className="sr-only">اختر التصنيف ونطاق السعر</SheetDescription>
              <SheetPrimitive.Close className={btn({ variant: "ghost", size: "icon" })} aria-label="إغلاق">
                <X />
              </SheetPrimitive.Close>
            </div>
            <FilterForm
              storeSlug={storeSlug}
              query={query}
              categories={categories}
              priceBounds={priceBounds}
              mode="sheet"
              onApplied={() => setOpen(false)}
              footer={
                <div
                  className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-border bg-background p-3"
                  style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                  <button type="reset" className={btn({ variant: "ghost", size: "lg", className: "px-4" })}>
                    مسح الكل
                  </button>
                  <button type="submit" className={btn({ size: "lg", full: true })}>
                    عرض النتائج
                  </button>
                </div>
              }
            />
          </SheetContent>
        </Sheet>

        <SortSelect storeSlug={storeSlug} query={query} className="w-full" />
      </div>
      <p className="sr-only" aria-live="polite">
        {total} منتج
      </p>
    </div>
  );
}
