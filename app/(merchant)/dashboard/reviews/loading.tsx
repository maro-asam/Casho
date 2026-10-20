import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ReviewsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full bg-card" />
      </div>

      <div className="apple-card grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Skeleton className="h-16 w-24 rounded-xl" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-full rounded-full" />
          ))}
        </div>
      </div>

      <Skeleton className="h-[38px] w-full max-w-md rounded-full" />

      <div className="apple-card overflow-hidden">
        <div className="flex gap-2 p-4 sm:px-5">
          <Skeleton className="h-9 w-full max-w-sm rounded-[10px]" />
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
        <div className="grid gap-3 border-t-[0.5px] border-border p-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2.5 rounded-[16px] bg-(--fill-3)/55 p-4">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-4/5 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
