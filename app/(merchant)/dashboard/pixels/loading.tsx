import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function PixelsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-10" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-6">
        <div className="space-y-2 pt-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="apple-card flex items-center gap-3 p-4">
              <Skeleton className="size-11 rounded-[12px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="apple-card h-40" />
      <div className="grid max-w-5xl gap-8 lg:grid-cols-2">
        <Skeleton className="apple-card h-24 rounded-[14px]" />
        <Skeleton className="apple-card h-32 rounded-[14px]" />
      </div>
    </div>
  );
}
