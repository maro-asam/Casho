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
import { MK_PORTAL, btn, num } from "../ui";
import FilterPanel, { type FilterProps } from "./FilterPanel";

// Per-viewer layout preferences, remembered in this browser.
const PREF_EVENT = "market:pref";

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
      <label htmlFor={id} className="shrink-0 text-sm text-(--mk-ink) max-sm:sr-only">
        ترتيب حسب:
      </label>
      <select
        id={id}
        value={query.sort}
        onChange={(e) => router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as typeof query.sort, page: 1 })}`), { scroll: false })}
        className="mk-select h-10 rounded-(--mk-r-sm) border border-(--mk-sep) bg-(--mk-cell) ps-4 text-[0.8125rem] font-semibold text-(--mk-ink) outline-none hover:border-(--mk-btn)"
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

/** Toolbar (filter button, grid/list switch, sort, product count) over the
 *  grid, with a start-side filter panel on desktop and a filter drawer on
 *  phones. */
export default function ListingLayout({ children, ...props }: Props & { children: ReactNode }) {
  const router = useRouter();
  const { storeSlug, query, dir, activeCount, total } = props;
  const sidebar =
    useSyncExternalStore(
      subscribePref,
      () => readPref("market:filters", "1", SIDEBAR),
      () => "1" as const,
    ) === "1";
  const view = useSyncExternalStore(
    subscribePref,
    () => readPref("market:view", "grid", VIEW),
    () => "grid" as const,
  );
  const [drawer, setDrawer] = useState(false);

  const badge = activeCount > 0 && <span className="grid size-5 place-items-center rounded-(--mk-r-sm) bg-(--mk-btn) text-[0.625rem] font-bold text-(--mk-btn-ink)">{num(activeCount)}</span>;
  const viewBtn = (v: (typeof VIEW)[number], label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => setPref("market:view", v)}
      aria-pressed={view === v}
      aria-label={label}
      className={cn("grid size-9 place-items-center rounded-(--mk-r-sm) transition-colors [&_svg]:size-[1.125rem]", view === v ? "bg-(--mk-btn) text-(--mk-btn-ink)" : "text-(--mk-label-2) hover:text-(--mk-ink)")}
    >
      <Icon />
    </button>
  );

  return (
    <div data-sidebar={sidebar} data-view={view}>
      <div className="lg:flex lg:items-start lg:gap-8">
        {sidebar && (
          <aside aria-label="الفلاتر" className="mk-panel hidden w-72 shrink-0 px-5 pb-5 lg:sticky lg:top-24 lg:block">
            <h2 className="flex min-h-14 items-center border-b border-(--mk-sep) text-lg font-bold text-(--mk-ink)">فلترة النتائج</h2>
            <FilterPanel {...props} mode="sidebar" />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <div className="mk-panel mb-5 flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className={btn({ variant: "outline", size: "sm", className: "h-10 lg:hidden" })}>
                <SlidersHorizontal />
                فلترة
                {badge}
              </button>
              <button
                type="button"
                onClick={() => setPref("market:filters", sidebar ? "0" : "1")}
                aria-expanded={sidebar}
                className={btn({ variant: "outline", size: "sm", className: "hidden h-10 lg:inline-flex" })}
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
              <p className="text-sm whitespace-nowrap text-(--mk-ink) max-sm:hidden" aria-live="polite">
                {total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(MK_PORTAL, "mk-scrim fixed inset-0 z-50")} />
          <Dialog.Content
            dir={dir}
            aria-describedby={undefined}
            className={cn(MK_PORTAL, "mk-drawer mk-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(90vw,23rem)] flex-col bg-(--mk-sheet) outline-none")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--mk-sep) px-5">
              <Dialog.Title className="mk-h3">فلترة المنتجات</Dialog.Title>
              <Dialog.Close className="mk-icon -me-2" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <FilterPanel
              {...props}
              mode="drawer"
              onApplied={() => setDrawer(false)}
              footer={
                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2.5 border-t border-(--mk-sep) p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
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
