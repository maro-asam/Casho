import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function ShippingLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-40 rounded-full bg-card" />
      </div>
      <Skeleton className="h-[38px] w-80 max-w-full rounded-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="apple-card rounded-[14px]">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-10 rounded-[10px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-52 rounded-md" />
              </div>
              <Skeleton className="h-[26px] w-11 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-56 rounded-[22px]" />
      </div>
    </div>
  );
}
