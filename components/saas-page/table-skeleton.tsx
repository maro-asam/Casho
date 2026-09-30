import { Skeleton } from "@/components/ui/skeleton";

/** loading.tsx body for a SaaS list page: header, tabs, toolbar, rows. */
export function SaasPageSkeleton({ rows = 8, columns = 5, tabs = 5 }: { rows?: number; columns?: number; tabs?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جاري التحميل">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 border-b border-border pb-2.5">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex gap-2 border-b border-border p-3">
            <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="flex items-center gap-6 px-4 py-4">
                {Array.from({ length: columns }).map((_, c) => (
                  <Skeleton key={c} className={c === 0 ? "h-4 w-32" : "h-4 flex-1"} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
