import { Skeleton } from "@/components/ui/skeleton";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export default async function QrCodeLoading() {
  await loadDashboardLocale();
  return (
    <div className="space-y-6" dir={tdir()} aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-8">
          {[28, 52, 40].map((h, i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="apple-card" style={{ height: `${h * 4}px` }} />
            </div>
          ))}
        </div>
        <Skeleton className="h-[30rem] rounded-[28px]" />
      </div>
    </div>
  );
}
