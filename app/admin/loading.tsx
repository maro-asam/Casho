import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جاري التحميل">
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-10 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="apple-card space-y-3 px-5 py-4">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-[22px] bg-card lg:col-span-2" />
        <Skeleton className="h-96 rounded-[22px] bg-card" />
      </div>
    </div>
  );
}
