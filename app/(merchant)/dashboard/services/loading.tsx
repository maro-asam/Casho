import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ServicesLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-8" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full bg-card" />
      </div>
      <Skeleton className="h-64 rounded-[28px]" />
      <Skeleton className="h-[38px] w-full max-w-xl rounded-full" />
      <div className="apple-card">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-14 rounded-[14px]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-64 max-w-full rounded-md" />
            </div>
            <Skeleton className="h-8 w-18 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
