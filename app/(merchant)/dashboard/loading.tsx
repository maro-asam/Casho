import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

// Mirrors the overview layout so nothing jumps when data arrives.
export default async function DashboardLoading() {
  await loadDashboardLocale();
  return (
    <div dir={tdir()} className="space-y-4 sm:space-y-5" aria-busy="true" aria-label={tr("جاري تحميل نظرة عامة")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-60 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-44 rounded-[22px] bg-card" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:*:last:col-span-2 xl:*:last:col-span-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="apple-card space-y-3 p-5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <Skeleton className="h-[26rem] rounded-[22px] bg-card xl:col-span-2" />
        <div className="space-y-4 sm:space-y-5">
          <Skeleton className="h-44 rounded-[22px] bg-card" />
          <Skeleton className="h-56 rounded-[22px] bg-card" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-[22px] bg-card xl:col-span-2" />
        <Skeleton className="h-80 rounded-[22px] bg-card" />
      </div>
    </div>
  );
}
