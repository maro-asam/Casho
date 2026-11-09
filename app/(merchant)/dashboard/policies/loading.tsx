import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function PoliciesLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-8" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-16 rounded-full" />
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <Skeleton className="h-[17rem] rounded-[14px]" />
          <Skeleton className="h-20 rounded-[14px]" />
        </div>
        <Skeleton className="h-64 rounded-[14px]" />
      </div>
    </div>
  );
}
