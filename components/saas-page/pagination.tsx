import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { hrefWith, type SearchParamsRecord } from "./url-state";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: SearchParamsRecord;
  /** Plural noun for the range text, e.g. "طلب". */
  noun: string;
};

const nf = lazyIntl.number();

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

const btn =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Pagination({ page, pageSize, total, basePath, searchParams, noun }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const link = (p: number) => hrefWith(basePath, searchParams, { page: p === 1 ? undefined : p });

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground tabular-nums">
        {tr("عرض {0}–{1} من {2} {3}", nf.format(from), nf.format(to), nf.format(total), noun)}
      </p>

      {totalPages > 1 && (
        <nav aria-label={tr("الصفحات")} className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={link(page - 1)} className={cn(btn, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <ChevronRight className="size-4 ltr:-scale-x-100" />
              {tr("السابق")}
            </Link>
          ) : (
            <span aria-disabled className={cn(btn, "pointer-events-none text-muted-foreground/40")}>
              <ChevronRight className="size-4 ltr:-scale-x-100" />
              {tr("السابق")}
            </span>
          )}

          <ul className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === "gap" ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
                  …
                </li>
              ) : (
                <li key={p}>
                  <Link
                    href={link(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      btn,
                      "tabular-nums",
                      p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {nf.format(p)}
                  </Link>
                </li>
              ),
            )}
          </ul>

          {page < totalPages ? (
            <Link href={link(page + 1)} className={cn(btn, "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {tr("التالي")}
              <ChevronLeft className="size-4 ltr:-scale-x-100" />
            </Link>
          ) : (
            <span aria-disabled className={cn(btn, "pointer-events-none text-muted-foreground/40")}>
              {tr("التالي")}
              <ChevronLeft className="size-4 ltr:-scale-x-100" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
