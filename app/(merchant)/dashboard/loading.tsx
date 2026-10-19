import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Mirrors the overview layout so nothing jumps when data arrives.
export default async function DashboardLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()} className="space-y-6" aria-busy="true" aria-label={tr("جاري تحميل نظرة عامة")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-40 rounded-xl" />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:[&>:last-child]:col-span-2 xl:[&>:last-child]:col-span-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-card p-5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-[26rem] rounded-xl xl:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
