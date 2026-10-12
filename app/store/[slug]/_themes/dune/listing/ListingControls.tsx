"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { Columns2, Rows3, SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { productsQueryString } from "@/lib/products-query";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "../../shared/commerce";
import { clearedQueryString } from "../../shared/filters";
import { storeHref } from "../../shared/store-path";
import { DN_PORTAL, btn, num } from "../ui";
import FilterPanel, { type FilterProps } from "./FilterPanel";

const PREF_EVENT = "dune:pref";

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
const MCOLS = ["2", "1"] as const;

type Props = FilterProps & { dir: "rtl" | "ltr"; activeCount: number; total: number };

function SortSelect({ storeSlug, query, className }: Pick<Props, "storeSlug" | "query"> & { className?: string }) {
  const router = useRouter();
  const id = useId();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={id} className="dn-label shrink-0 text-(--dn-quiet) max-sm:sr-only">
        ترتيب
      </label>
      <select
        id={id}
        value={query.sort}
        onChange={(e) => router.push(storeHref(storeSlug, `/products${productsQueryString({ ...query, sort: e.target.value as typeof query.sort, page: 1 })}`), { scroll: false })}
        className="dn-field h-10 min-h-10 w-auto border-transparent bg-transparent pe-9 ps-2 text-sm hover:border-(--dn-line)"
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

/** Toolbar (filter toggle/drawer, count, sort, phone density) above a grid
 *  with a collapsible start-side filter sidebar on desktop. */
export default function ListingLayout({ children, ...props }: Props & { children: ReactNode }) {
  const router = useRouter();
  const { storeSlug, query, dir, activeCount, total } = props;
  const sidebar = useSyncExternalStore(subscribePref, () => readPref("dune:filters", "1", SIDEBAR), () => "1" as const) === "1";
  const mcols = useSyncExternalStore(subscribePref, () => readPref("dune:mcols", "2", MCOLS), () => "2" as const);
  const [drawer, setDrawer] = useState(false);

  const badge = activeCount > 0 && (
    <span className="grid size-5 place-items-center rounded-full bg-(--dn-ink) text-[0.625rem] font-bold text-(--dn-bg)">{num(activeCount)}</span>
  );

  return (
    <div data-sidebar={sidebar} data-mcols={mcols}>
      <div className="sticky top-(--dn-header-h) z-30 -mx-(--dn-gutter) mb-8 border-y border-(--dn-line) bg-(--dn-bg)/95 px-(--dn-gutter) backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className="dn-label inline-flex min-h-11 items-center gap-2 lg:hidden">
              <SlidersHorizontal className="size-4" />
              فلترة
              {badge}
            </button>
            <button type="button" onClick={() => setPref("dune:filters", sidebar ? "0" : "1")} aria-expanded={sidebar} className="dn-label hidden min-h-11 items-center gap-2 lg:inline-flex">
              <SlidersHorizontal className="size-4" />
              {sidebar ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
              {badge}
            </button>
            <p className="text-sm text-(--dn-quiet) max-sm:hidden" aria-live="polite">
              {total > 0 ? `${num(total)} منتج` : "مفيش نتائج"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <SortSelect storeSlug={storeSlug} query={query} />
            <button
              type="button"
              onClick={() => setPref("dune:mcols", mcols === "2" ? "1" : "2")}
              aria-label={mcols === "2" ? "منتج واحد في الصف" : "منتجين في الصف"}
              className="dn-icon md:hidden [&_svg]:size-[1.125rem]"
            >
              {mcols === "2" ? <Rows3 /> : <Columns2 />}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:items-start lg:gap-12">
        {sidebar && (
          <aside aria-label="الفلاتر" className="hidden w-60 shrink-0 lg:sticky lg:top-[calc(var(--dn-header-h)+1.5rem)] lg:block xl:w-64">
            <FilterPanel {...props} mode="sidebar" />
          </aside>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="dn-scrim fixed inset-0 z-50 bg-[rgb(29_29_28/0.45)]" />
          <Dialog.Content
            dir={dir}
            aria-describedby={undefined}
            className={cn(DN_PORTAL, "dn-drawer dn-drawer--start fixed inset-y-0 start-0 z-50 flex w-[min(92vw,24rem)] flex-col bg-(--dn-drawer) outline-none")}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--dn-line) px-6">
              <Dialog.Title className="dn-h3">فلترة</Dialog.Title>
              <Dialog.Close className="dn-icon -me-2.5" aria-label="إغلاق">
                <X />
              </Dialog.Close>
            </div>
            <FilterPanel
              {...props}
              mode="drawer"
              onApplied={() => setDrawer(false)}
              footer={
                <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-(--dn-line) p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(storeHref(storeSlug, `/products${clearedQueryString(query)}`), { scroll: false });
                      setDrawer(false);
                    }}
                    className={btn({ variant: "outline" })}
                  >
                    مسح
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
