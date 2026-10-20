import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={`apple-card space-y-4 p-5 ${className ?? ""}`}>
      <Skeleton className="h-5 w-28 rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default async function OrderLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()} className="space-y-6" aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-20 rounded-md" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-11 w-28 rounded-full bg-card" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <CardSkeleton rows={2} className="min-h-44" />
          <CardSkeleton rows={4} />
        </div>
        <div className="space-y-5">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
