import { Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div dir="rtl" className="min-h-screen">
      {/* Banner carousel */}
      <Skeleton className="h-52 w-full rounded-none md:h-80 lg:h-96" />

      <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6">
        {/* Categories row */}
        <div className="mb-10 space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-2">
                <Skeleton className="size-16 rounded-2xl" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Featured products */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-5 w-1/3 rounded-full" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best sellers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-5 w-1/3 rounded-full" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
