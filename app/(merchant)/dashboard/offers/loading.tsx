import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function OffersLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-[28rem] max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full bg-card" />
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[22px] bg-border/60 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-card px-5 py-4">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[38px] w-full max-w-md rounded-full" />
      <div className="apple-card overflow-hidden">
        <div className="flex gap-2 p-4 sm:px-5">
          <Skeleton className="h-9 w-full max-w-sm rounded-[10px]" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <div className="apple-rows border-t-[0.5px] border-border [--row-inset:84px]">
          {Array.from({ length: 7 }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="size-12 shrink-0 rounded-[12px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="hidden w-28 space-y-1.5 md:block">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
              <Skeleton className="hidden h-4 w-20 rounded-md lg:block" />
              <Skeleton className="h-[31px] w-[51px] rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
