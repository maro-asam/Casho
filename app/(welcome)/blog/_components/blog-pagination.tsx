import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  searchParams: { q?: string; category?: string };
};

function buildHref(page: number, searchParams: Props["searchParams"]) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.category) params.set("category", searchParams.category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}

export function BlogPagination({ currentPage, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="mt-14 flex items-center justify-center gap-2">
      {/* Previous */}
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1, searchParams)}
          className="flex h-10 items-center gap-1.5 rounded-xl border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <ChevronRight className="size-4" />
          السابق
        </Link>
      ) : (
        <span className="flex h-10 items-center gap-1.5 rounded-xl border bg-muted/40 px-4 text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none">
          <ChevronRight className="size-4" />
          السابق
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1.5">
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-10 w-10 items-center justify-center text-sm text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p, searchParams)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition ${
                p === currentPage
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "border bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1, searchParams)}
          className="flex h-10 items-center gap-1.5 rounded-xl border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          التالي
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className="flex h-10 items-center gap-1.5 rounded-xl border bg-muted/40 px-4 text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none">
          التالي
          <ChevronLeft className="size-4" />
        </span>
      )}
    </div>
  );
}
