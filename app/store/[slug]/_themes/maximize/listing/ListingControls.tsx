"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { productsQueryString } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "../../shared/commerce";
import { clearedQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { MX_PORTAL, btn, num } from "../ui";
import FilterPanel, { type FilterProps } from "./FilterPanel";

// Per-viewer layout preferences, remembered in this browser.
const PREF_EVENT = "maximize:pref";

function readPref<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function subscribePref(cb: () => void) {
  window.addEventListener(PREF_EVENT, cb);
  return () => window.removeEventListener(PREF_EVENT, cb);
}
function setPref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(PREF_EVENT));
}

const SIDEBAR = ["1", "0"] as const;
const VIEW = ["grid", "list"] as const;

type Props = FilterProps & { dir: "rtl" | "ltr"; activeCount: number; total: number };

function SortSelect({ storeSlug, query }: Pick<Props, "storeSlug" | "query">) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-sm text-(--mx-text) max-sm:sr-only">
        ترتيب حسب:
      </label>
      <select
        id={id}
        value={query.sort}
        onChange={(e) => router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as typeof query.sort, page: 1 })}`), { scroll: false })}
        className="mx-select h-10 rounded-(--mx-r-sm) bg-transparent ps-2 text-sm font-semibold text-(--mx-ink) outline-none hover:bg-(--mx-band)"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Maximize's bordered toolbar (filter button, product count, sort, grid/list
 *  switch) over the grid, with a start-side filter sidebar on desktop and a
 *  filter drawer on phones. */
export default function ListingLayout({ children, ...props }: Props & { children: ReactNode }) {
  const router = useRouter();
  const { storeSlug, query, dir, activeCount, total } = props;
  const sidebar = useSyncExternalStore(subscribePref, () => readPref("maximize:filters", "1", SIDEBAR), () => "1" as const) === "1";
  const view = useSyncExternalStore(subscribePref, () => readPref("maximize:view", "grid", VIEW), () => "grid" as const);
  const [drawer, setDrawer] = useState(false);

  const badge = activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-(--mx-btn) text-[0.625rem] font-bold text-(--mx-btn-ink)">{num(activeCount)}</span>;
  const viewBtn = (v: (typeof VIEW)[number], label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => setPref("maximize:view", v)}
      aria-pressed={view === v}
      aria-label={label}
      className={cn("grid size-9 place-items-center rounded-(--mx-r-sm) transition-colors [&_svg]:size-5", view === v ? "bg-(--mx-band) text-(--mx-link)" : "text-(--mx-quiet) hover:text-(--mx-ink)")}
    >
      <Icon />
    </button>
  );

  return (
    <div data-sidebar={sidebar} data-view={view}>
      <div className="mb-6 flex min-h-14 items-center justify-between gap-3 rounded-(--mx-r) border border-(--mx-line) p-1.5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className={btn({ variant: "soft", size: "sm", className: "h-10 lg:hidden" })}>
            <SlidersHorizontal />
            فلترة
            {badge}
          </button>
          <button type="button" onClick={() => setPref("maximize:filters", sidebar ? "0" : "1")} aria-expanded={sidebar} className={btn({ variant: "soft", size: "sm", className: "hidden h-10 lg:inline-flex" })}>
            <SlidersHorizontal />
            {sidebar ? "إخفاء الفلاتر" : "فلترة"}
            {badge}
          </button>
          <p className="text-sm text-(--mx-text) max-sm:hidden" aria-live="polite">
            {total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortSelect storeSlug={storeSlug} query={query} />
          <div className="flex items-center gap-0.5 rounded-(--mx-r-sm) border border-(--mx-line) p-0.5">
            {viewBtn("list", "عرض كقائمة", List)}
            {viewBtn("grid", "عرض كشبكة", LayoutGrid)}
          </div>
        </div>
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        {sidebar && (
          <aside aria-label="الفلاتر" className="hidden w-64 shrink-0 lg:sticky lg:top-4 lg:block">
            <FilterPanel {...props} mode="sidebar" />
          </aside>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="mx-scrim fixed inset-0 z-50 bg-[rgb(16_15_15/0.5)]" />
          <Dialog.Content
            dir={dir}
            aria-describedby={undefined}
            className={cn(MX_PORTAL, "mx-drawer mx-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(90vw,23rem)] flex-col bg-(--mx-surface) outline-none")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--mx-line) px-5">
              <Dialog.Title className="mx-h3">فلترة المنتجات</Dialog.Title>
              <Dialog.Close className="mx-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <FilterPanel
              {...props}
              mode="drawer"
              onApplied={() => setDrawer(false)}
              footer={
                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2.5 border-t border-(--mx-line) p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(storeHref(storeSlug, `/products${clearedQueryString(query)}`), { scroll: false });
                      setDrawer(false);
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
