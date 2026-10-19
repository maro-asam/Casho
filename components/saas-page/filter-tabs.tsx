import Link from "next/link";
import { cn } from "@/lib/utils";
import { hrefWith, type SearchParamsRecord } from "./url-state";
import { lazyIntl } from "@/lib/i18n/dashboard";

export type FilterTab = {
  label: string;
  /** Param value; `undefined` means "all" (param removed). */
  value?: string;
  count?: number;
};

type FilterTabsProps = {
  tabs: FilterTab[];
  /** Search param the tabs control, e.g. "status". */
  param: string;
  basePath: string;
  searchParams?: SearchParamsRecord;
  label: string;
};

const countFormat = lazyIntl.number();

/**
 * Primary segmentation of a list (e.g. order status). Plain links, so it works
 * in server components and every view is shareable by URL.
 */
export function FilterTabs({ tabs, param, basePath, searchParams, label }: FilterTabsProps) {
  const raw = searchParams?.[param];
  const current = (Array.isArray(raw) ? raw[0] : raw) || undefined;

  return (
    <nav aria-label={label} className="-mb-px overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const active = tab.value === current;
          return (
            <li key={tab.value ?? "all"}>
              <Link
                href={hrefWith(basePath, searchParams, { [param]: tab.value })}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-px text-xs tabular-nums",
                      active ? "bg-primary/10 font-medium text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {countFormat.format(tab.count)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
