import { Skeleton } from "@/components/ui/skeleton";

// Mirrors AuthSplit: form on the grouped background, dark showcase panel on desktop.
export default function AuthLoading() {
  return (
    <div dir="rtl" className="apple-ui grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" aria-busy="true">
      <div className="flex min-h-svh flex-col px-5 py-5 sm:px-10 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-[9px]" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full bg-card" />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] space-y-7">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-10 w-52 rounded-xl" />
              <Skeleton className="h-5 w-64 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-full bg-card" />
            <Skeleton className="mx-auto h-3 w-24 rounded-full" />
            <div className="space-y-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-12 w-full rounded-[12px] bg-card" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-black">
          <div className="pointer-events-none absolute -top-1/4 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/35 blur-[120px]" />
        </div>
      </div>
    </div>
  );
}
