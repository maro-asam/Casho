import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function CouponsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full bg-card" />
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-border/60 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-card px-5 py-4">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[38px] w-full max-w-lg rounded-full" />
      <div className="apple-card overflow-hidden">
        <div className="flex gap-2 p-4 sm:px-5">
          <Skeleton className="h-9 w-full max-w-sm rounded-[10px]" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <div className="grid gap-3 border-t-[0.5px] border-border p-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-40 overflow-hidden rounded-[18px] bg-(--fill-3)/55">
              <Skeleton className="h-full w-26 rounded-none" />
              <div className="flex-1 space-y-2.5 p-4">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-1 w-full rounded-full" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
