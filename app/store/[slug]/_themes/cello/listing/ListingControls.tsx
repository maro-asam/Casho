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
import { CE_PORTAL, btn, num } from "../ui";
import FilterPanel, { type FilterProps } from "./FilterPanel";

// Per-viewer layout preferences, remembered in this browser.
const PREF_EVENT = "cello:pref";

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
      <label htmlFor={id} className="shrink-0 text-sm text-(--ce-text) max-sm:sr-only">
        ترتيب حسب:
      </label>
      <select
        id={id}
        value={query.sort}
        onChange={(e) => router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as typeof query.sort, page: 1 })}`), { scroll: false })}
        className="ce-select h-10 rounded-(--ce-r-sm) border border-(--ce-line) bg-(--ce-card) ps-3 text-[0.8125rem] text-(--ce-ink) outline-none hover:border-(--ce-ink)"
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

/** Cello's bordered toolbar (filter button, product count, sort, grid/list
 *  switch) over the grid, with a start-side filter sidebar on desktop and a
 *  filter drawer on phones. */
export default function ListingLayout({ children, ...props }: Props & { children: ReactNode }) {
  const router = useRouter();
  const { storeSlug, query, dir, activeCount, total } = props;
  const sidebar =
    useSyncExternalStore(
      subscribePref,
      () => readPref("cello:filters", "1", SIDEBAR),
      () => "1" as const,
    ) === "1";
  const view = useSyncExternalStore(
    subscribePref,
    () => readPref("cello:view", "grid", VIEW),
    () => "grid" as const,
  );
  const [drawer, setDrawer] = useState(false);

  const badge = activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-(--ce-btn) text-[0.625rem] font-bold text-(--ce-btn-ink)">{num(activeCount)}</span>;
  const viewBtn = (v: (typeof VIEW)[number], label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => setPref("cello:view", v)}
      aria-pressed={view === v}
      aria-label={label}
      className={cn("grid size-9 place-items-center rounded-(--ce-r-sm) transition-colors [&_svg]:size-5", view === v ? "text-(--ce-ink)" : "text-(--ce-quiet) opacity-60 hover:opacity-100")}
    >
      <Icon />
    </button>
  );

  return (
    <div data-sidebar={sidebar} data-view={view}>
      <div className="lg:flex lg:items-start lg:gap-8">
        {sidebar && (
          <aside aria-label="الفلاتر" className="hidden w-72 shrink-0 lg:sticky lg:top-4 lg:block">
            <h2 className="mb-1 flex min-h-14 items-center text-2xl font-medium text-(--ce-ink)">فلترة:</h2>
            <FilterPanel {...props} mode="sidebar" />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex min-h-14 items-center justify-between gap-3 border-b border-(--ce-line) pb-2">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className={btn({ variant: "outline", size: "sm", className: "h-10 bg-(--ce-card) lg:hidden" })}>
                <SlidersHorizontal />
                فلترة
                {badge}
              </button>
              <button
                type="button"
                onClick={() => setPref("cello:filters", sidebar ? "0" : "1")}
                aria-expanded={sidebar}
                className={btn({ variant: "outline", size: "sm", className: "hidden h-10 bg-(--ce-card) lg:inline-flex" })}
              >
                <SlidersHorizontal />
                {sidebar ? "إخفاء الفلاتر" : "فلترة"}
                {badge}
              </button>
              <div className="flex items-center gap-1">
                {viewBtn("grid", "عرض كشبكة", LayoutGrid)}
                {viewBtn("list", "عرض كقائمة", List)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SortSelect storeSlug={storeSlug} query={query} />
              <p className="text-sm whitespace-nowrap text-(--ce-text) max-sm:hidden" aria-live="polite">
                {total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="ce-scrim fixed inset-0 z-50 bg-[rgb(16_15_15/0.5)]" />
          <Dialog.Content
            dir={dir}
            aria-describedby={undefined}
            className={cn(CE_PORTAL, "ce-drawer ce-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(90vw,23rem)] flex-col bg-(--ce-surface) outline-none")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--ce-line) px-5">
              <Dialog.Title className="ce-h3">فلترة المنتجات</Dialog.Title>
              <Dialog.Close className="ce-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <FilterPanel
              {...props}
              mode="drawer"
              onApplied={() => setDrawer(false)}
              footer={
                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2.5 border-t border-(--ce-line) p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
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
