import { Skeleton } from "@/components/ui/skeleton";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function Loading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-8" aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-20 rounded-full" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <div className="apple-card flex flex-col items-center gap-4 px-6 py-10">
            <Skeleton className="h-16 w-48 rounded-[18px]" />
            <Skeleton className="h-7 w-60 rounded-lg" />
            <Skeleton className="h-4 w-80 max-w-full rounded-full" />
            <Skeleton className="mt-3 h-12.5 w-full max-w-md rounded-full" />
          </div>
          <Skeleton className="h-40 rounded-[14px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-60 rounded-[14px]" />
          <Skeleton className="h-48 rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}
