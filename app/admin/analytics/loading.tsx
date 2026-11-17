import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جاري التحميل">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-full bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[134px] rounded-[22px] bg-card" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[22px] bg-card" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[22px] bg-card" />
        <Skeleton className="h-72 rounded-[22px] bg-card" />
      </div>
    </div>
  );
}
