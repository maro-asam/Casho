import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ApiKeysLoading() {
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="apple-card overflow-hidden lg:col-span-2">
          <div className="space-y-1.5 px-5 pt-5 pb-3">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-20 rounded-md" />
          </div>
          <div className="apple-rows border-t-[0.5px] border-border [--row-inset:68px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="size-10 shrink-0 rounded-[10px]" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-44 rounded-md" />
                  <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                </div>
                <Skeleton className="size-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="apple-card space-y-3 p-5">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
