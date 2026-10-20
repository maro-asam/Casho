import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function BalanceLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-36 rounded-full bg-card" />
          <Skeleton className="h-11 w-32 rounded-full bg-card" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="apple-card space-y-4 p-6">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-12 w-56 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="apple-card space-y-1 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-40 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="apple-card h-80" />
      </div>
    </div>
  );
}
