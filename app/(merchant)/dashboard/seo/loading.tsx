import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function SeoLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-10" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-52 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-11 w-44 rounded-full bg-card" />
        </div>
        <div className="apple-card grid lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex items-center gap-5 p-8 lg:flex-col lg:items-start">
            <Skeleton className="size-32 rounded-full" />
            <Skeleton className="h-6 w-44 rounded-md" />
          </div>
          <div className="space-y-4 p-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-3 w-72 max-w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="apple-card h-72" />
        <Skeleton className="h-72 rounded-[22px]" />
      </div>
    </div>
  );
}
