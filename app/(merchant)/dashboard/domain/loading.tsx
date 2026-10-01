import { Skeleton } from "@/components/ui/skeleton";

export default function DomainLoading() {
  return (
    <div className="space-y-6" dir="rtl" aria-busy="true" aria-label="جاري التحميل">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
