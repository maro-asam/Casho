import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function PaymentMethodsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full bg-card" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          {[2, 1, 5].map((rows, c) => (
            <div key={c} className="apple-card space-y-1 py-4">
              <Skeleton className="mx-5 mb-3 h-5 w-40 rounded-md" />
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2">
                  <Skeleton className="size-10 rounded-[11px]" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-44 rounded-md" />
                  </div>
                  <Skeleton className="h-[26px] w-11 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <Skeleton className="h-[26rem] rounded-[36px]" />
      </div>
    </div>
  );
}
