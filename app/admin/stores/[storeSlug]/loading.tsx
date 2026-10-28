import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جاري التحميل">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-28 rounded-[22px] bg-card" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 rounded-[22px] bg-card" />
          <Skeleton className="h-48 rounded-[22px] bg-card" />
          <Skeleton className="h-72 rounded-[22px] bg-card" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-[22px] bg-card" />
          <Skeleton className="h-72 rounded-[22px] bg-card" />
        </div>
      </div>
    </div>
  );
}
