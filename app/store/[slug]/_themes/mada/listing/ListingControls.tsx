"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowDownUp, Check, ChevronDown, Columns2, Columns3, Grid2x2, Rows3, SlidersHorizontal, X } from "lucide-react";
import { Dialog, Popover } from "radix-ui";

import { productsQueryString, type ProductsQuery } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import type { CategoryLink, ListingViewProps } from "../../types";
import { SORT_OPTIONS } from "../../shared/commerce";
import { clearedQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { MD_PORTAL, btn, num } from "../ui";
import FilterPanel from "./FilterPanel";

const PREF_EVENT = "mada:pref";

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

/** Grid density preferences (per device class), kept in this browser. */
const COLS = ["comfy", "dense"] as const;
const MCOLS = ["2", "1"] as const;
export function useGridPrefs() {
  const cols = useSyncExternalStore(subscribePref, () => readPref("mada:cols", "comfy", COLS), () => "comfy" as const);
  const mcols = useSyncExternalStore(subscribePref, () => readPref("mada:mcols", "2", MCOLS), () => "2" as const);
  return { cols, mcols };
}

type Shared = {
  storeSlug: string;
  query: ProductsQuery;
  categories: CategoryLink[];
  priceBounds: ListingViewProps["priceBounds"];
  facets: ListingViewProps["facets"];
  dir: "rtl" | "ltr";
  activeCount: number;
  total: number;
};

function useSort(storeSlug: string, query: ProductsQuery) {
  const router = useRouter();
  return (sort: ProductsQuery["sort"]) =>
    router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort, page: 1 })}`), { scroll: false });
}

/** Desktop sort: a small popover listbox. */
function SortMenu({ storeSlug, query, dir }: Pick<Shared, "storeSlug" | "query" | "dir">) {
  const sort = useSort(storeSlug, query);
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === query.sort) ?? SORT_OPTIONS[0];
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="md-chip gap-2 border-transparent bg-transparent hover:bg-(--md-surface)">
        <span className="text-(--md-quiet)">ترتيب:</span>
        <span className="font-semibold">{current.label}</span>
        <ChevronDown className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} dir={dir} className={cn(MD_PORTAL, "md-pop z-50 w-56 rounded-2xl bg-(--md-surface) p-1.5 shadow-xl outline-none")}>
          <ul role="listbox" aria-label="ترتيب المنتجات">
            {SORT_OPTIONS.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === query.sort}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    sort(o.value);
                  }}
                  className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm hover:bg-(--md-studio)"
                >
                  {o.label}
                  {o.value === query.sort && <Check className="size-4 text-(--md-brand)" />}
                </button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Sheet({ open, onOpenChange, title, dir, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; dir: "rtl" | "ltr"; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="md-scrim fixed inset-0 z-50 bg-[rgb(12_17_15/0.5)]" />
        <Dialog.Content dir={dir} aria-describedby={undefined} className={cn(MD_PORTAL, "md-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[1.75rem] bg-(--md-bg) outline-none")}>
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-(--md-line-strong)" aria-hidden />
          <div className="flex h-14 shrink-0 items-center justify-between px-5">
            <Dialog.Title className="md-h3">{title}</Dialog.Title>
            <Dialog.Close className={btn({ variant: "ghost", icon: true, className: "-me-2" })} aria-label="إغلاق">
              <X />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Phones/tablets: sticky filter | sort bar, each opening a bottom sheet. */
export function MobileControls(props: Shared) {
  const { storeSlug, query, dir, activeCount, total } = props;
  const router = useRouter();
  const sort = useSort(storeSlug, query);
  const [filters, setFilters] = useState(false);
  const [sorting, setSorting] = useState(false);
  const { mcols } = useGridPrefs();
  const current = SORT_OPTIONS.find((o) => o.value === query.sort) ?? SORT_OPTIONS[0];

  return (
    <div className="sticky top-0 z-30 -mx-(--md-gutter) bg-(--md-bg)/95 px-(--md-gutter) py-2.5 backdrop-blur-md lg:hidden">
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilters(true)} className={btn({ variant: "outline", size: "sm", className: "flex-1 bg-(--md-surface)" })}>
          <SlidersHorizontal />
          فلترة
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-(--md-brand) text-[0.6875rem] font-bold text-(--md-brand-ink)">{num(activeCount)}</span>}
        </button>
        <button type="button" onClick={() => setSorting(true)} className={btn({ variant: "outline", size: "sm", className: "min-w-0 flex-1 bg-(--md-surface)" })}>
          <ArrowDownUp />
          <span className="truncate">{current.label}</span>
        </button>
        <button
          type="button"
          onClick={() => setPref("mada:mcols", mcols === "2" ? "1" : "2")}
          aria-label={mcols === "2" ? "عرض منتج واحد في الصف" : "عرض منتجين في الصف"}
          className={btn({ variant: "outline", size: "sm", icon: true, className: "bg-(--md-surface)" })}
        >
          {mcols === "2" ? <Rows3 /> : <Columns2 />}
        </button>
      </div>

      <Sheet open={filters} onOpenChange={setFilters} title="فلترة المنتجات" dir={dir}>
        <FilterPanel
          {...props}
          mode="sheet"
          onApplied={() => setFilters(false)}
          footer={
            <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2.5 border-t border-(--md-line) bg-(--md-surface) p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button
                type="button"
                onClick={() => {
                  router.push(storeHref(storeSlug, `/products${clearedQueryString(query)}`), { scroll: false });
                  setFilters(false);
                }}
                className={btn({ variant: "outline", size: "lg" })}
              >
                مسح الكل
              </button>
              <button type="submit" className={btn({ size: "lg", full: true })}>
                عرض النتائج
              </button>
            </div>
          }
        />
      </Sheet>

      <Sheet open={sorting} onOpenChange={setSorting} title="ترتيب حسب" dir={dir}>
        <ul role="listbox" aria-label="ترتيب المنتجات" className="px-3 pb-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          {SORT_OPTIONS.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === query.sort}>
              <button
                type="button"
                onClick={() => {
                  setSorting(false);
                  sort(o.value);
                }}
                className="flex min-h-13 w-full items-center justify-between rounded-2xl px-4 text-[0.9375rem] hover:bg-(--md-surface) aria-selected:font-semibold"
              >
                {o.label}
                {o.value === query.sort && <Check className="size-5 text-(--md-brand)" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
      <p className="sr-only" aria-live="polite">
        {total} منتج
      </p>
    </div>
  );
}

const SIDEBAR = ["1", "0"] as const;

/** Desktop: toolbar (filters toggle, count, density, sort) + collapsible
 *  sidebar beside the grid. */
export function DesktopLayout({ children, toolbarStart, ...props }: Shared & { children: ReactNode; toolbarStart: ReactNode }) {
  const sidebar = useSyncExternalStore(subscribePref, () => readPref("mada:filters", "1", SIDEBAR), () => "1" as const) === "1";
  const { cols, mcols } = useGridPrefs();
  const toggle = () => setPref("mada:filters", sidebar ? "0" : "1");

  return (
    <div data-sidebar={sidebar} data-cols={cols} data-mcols={mcols} className="group/listing">
      <div className="mb-6 hidden items-center justify-between gap-4 border-b border-(--md-line) pb-4 lg:flex">
        <div className="flex items-center gap-4">
          <button type="button" onClick={toggle} aria-expanded={sidebar} className={btn({ variant: "outline", size: "sm", className: "bg-(--md-surface)" })}>
            <SlidersHorizontal />
            {sidebar ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
            {props.activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-(--md-brand) text-[0.6875rem] font-bold text-(--md-brand-ink)">{num(props.activeCount)}</span>}
          </button>
          {toolbarStart}
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="كثافة العرض" className="flex rounded-full bg-(--md-surface) p-1">
            {(
              [
                { d: "comfy" as const, Icon: Columns3, label: "منتجات أكبر" },
                { d: "dense" as const, Icon: Grid2x2, label: "منتجات أكتر في الصف" },
              ]
            ).map(({ d, Icon, label }) => (
              <button key={d} type="button" onClick={() => setPref("mada:cols", d)} aria-pressed={cols === d} aria-label={label} className={cn("grid size-9 place-items-center rounded-full transition-colors [&_svg]:size-4", cols === d ? "bg-(--md-ink) text-(--md-bg)" : "text-(--md-quiet) hover:text-(--md-ink)")}>
                <Icon />
              </button>
            ))}
          </div>
          <SortMenu storeSlug={props.storeSlug} query={props.query} dir={props.dir} />
        </div>
      </div>

      <MobileControls {...props} />

      <div className="lg:flex lg:items-start lg:gap-10">
        {sidebar && (
          <aside aria-label="الفلاتر" className="hidden w-64 shrink-0 lg:sticky lg:top-[calc(var(--md-header-h)+1.5rem)] lg:block xl:w-72">
            <FilterPanel {...props} mode="sidebar" />
          </aside>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
