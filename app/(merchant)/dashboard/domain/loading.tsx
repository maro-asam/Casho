import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function DomainLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-8" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-16 rounded-full" />
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="apple-card flex flex-col items-center gap-4 px-6 py-10">
          <Skeleton className="h-[52px] w-full max-w-md rounded-[14px]" />
          <Skeleton className="mt-3 h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full" />
          <Skeleton className="mt-4 h-12.5 w-full max-w-md rounded-[12px]" />
          <Skeleton className="h-12.5 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className="h-64 rounded-[14px]" />
      </div>
    </div>
  );
}
