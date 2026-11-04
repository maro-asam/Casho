"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { productsQueryString } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "../../shared/commerce";
import { clearedQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { QR_PORTAL, btn, num } from "../ui";
import FilterPanel, { type FilterProps } from "./FilterPanel";

type Props = FilterProps & { dir: "rtl" | "ltr"; activeCount: number; total: number };

/** The toolbar over the grid: the filter drawer's button with the active
 *  count, the number of pieces, and the sort. The grid itself keeps the
 *  merchant's columns at full width. */
export default function ListingControls(props: Props) {
  const router = useRouter();
  const { storeSlug, query, dir, activeCount, total } = props;
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="qr-toolbar">
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="qr-toolbar-btn">
        <SlidersHorizontal aria-hidden />
        <span>الفلاتر</span>
        {activeCount > 0 && <span className="qr-count !static">{num(activeCount)}</span>}
      </button>
      <p className="qr-num text-sm text-(--qr-ink-2) max-sm:hidden" aria-live="polite">
        {total > 0 ? `${num(total)} قطعة` : "مفيش نتائج"}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="shrink-0 text-sm text-(--qr-ink-2) max-sm:sr-only">
          الترتيب:
        </label>
        <select
          id={id}
          value={query.sort}
          onChange={(e) => router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as typeof query.sort, page: 1 })}`), { scroll: false })}
          className="qr-select"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(QR_PORTAL, "qr-scrim fixed inset-0 z-50")} />
          <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(QR_PORTAL, "qr-drawer qr-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-(--qr-sheet) outline-none")}>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--qr-line) px-6">
              <Dialog.Title className="qr-h3">فلترة القطع</Dialog.Title>
              <Dialog.Close className="qr-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <FilterPanel
              {...props}
              onApplied={() => setOpen(false)}
              footer={
                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2.5 border-t border-(--qr-line) p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(storeHref(storeSlug, `/products${clearedQueryString(query)}`), { scroll: false });
                      setOpen(false);
                    }}
                    className={btn({ variant: "outline" })}
                  >
                    مسح الكل
                  </button>
                  <button type="submit" className={btn({ full: true })}>
                    عرض النتائج
                  </button>
                </div>
              }
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
