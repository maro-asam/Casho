import { Skeleton } from "@/components/ui/skeleton";

/** Under the section title and tabs (the layout stays): tiles, then a list card in the pages' shape. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جاري التحميل">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="apple-card space-y-3 px-5 py-4">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        ))}
      </div>
      <div className="apple-card overflow-hidden">
        <div className="space-y-2 px-5 pt-5 pb-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
        </div>
        <div className="apple-rows pb-2 [--row-inset:72px]">
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
