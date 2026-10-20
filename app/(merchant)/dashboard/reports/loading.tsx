import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ReportsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-11 w-28 rounded-full bg-card" />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:justify-between">
        <Skeleton className="h-[38px] w-full max-w-2xl rounded-full" />
        <Skeleton className="h-[38px] w-full max-w-md rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="apple-card space-y-3 p-5">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>

      <div className="apple-card p-5">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="mt-2 h-10 w-36 rounded-lg" />
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-[22px] bg-card lg:col-span-3" />
        <Skeleton className="h-80 rounded-[22px] bg-card lg:col-span-2" />
      </div>
    </div>
  );
}
