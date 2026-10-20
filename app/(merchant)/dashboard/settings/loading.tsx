import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function SettingsLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-9 w-52 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="apple-card h-22 rounded-[14px]" />
          <Skeleton className="apple-card hidden h-72 rounded-[14px] lg:block" />
        </div>
        <div className="max-w-3xl space-y-8">
          {[3, 1, 5].map((rows, g) => (
            <div key={g} className="space-y-2">
              <Skeleton className="ms-4 h-3 w-24 rounded-md" />
              <div className="apple-card rounded-[14px]">
                {Array.from({ length: rows }, (_, i) => (
                  <div key={i} className="flex h-11 items-center gap-3 px-4">
                    <Skeleton className="size-[29px] rounded-[7px]" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="ms-auto h-4 w-36 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
