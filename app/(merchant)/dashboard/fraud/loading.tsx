import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function FraudLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-8" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-16 rounded-full" />
        <Skeleton className="h-10 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>
      <div className="apple-card overflow-hidden">
        <div className="flex items-center gap-5 px-6 py-7">
          <Skeleton className="size-20 rounded-[22px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-80 max-w-full rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2 bg-card px-5 py-4">
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-[14px]" />
        <Skeleton className="h-96 rounded-[14px]" />
      </div>
    </div>
  );
}
