import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ChangePlanLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-10" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32 rounded-full bg-card" />
            <Skeleton className="h-11 w-32 rounded-full bg-card" />
          </div>
        </div>
        <div className="apple-card flex items-center gap-4 p-8">
          <Skeleton className="size-16 rounded-[18px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
          <Skeleton className="size-28 rounded-full" />
        </div>
        <Skeleton className="apple-card h-32" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="apple-card h-[30rem]" />
        ))}
      </div>
    </div>
  );
}
