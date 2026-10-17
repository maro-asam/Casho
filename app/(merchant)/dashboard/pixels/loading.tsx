import { Skeleton } from "@/components/ui/skeleton";

export default function PixelsLoading() {
  return (
    <div className="space-y-6" dir="rtl" aria-busy="true" aria-label="جاري التحميل">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
