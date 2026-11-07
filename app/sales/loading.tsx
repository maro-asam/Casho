import { Skeleton } from "@/components/ui/skeleton";

/** Overview skeleton: hero, then the card grid in the page's shape. */
export default function Loading() {
  return (
    <div className="space-y-4 md:space-y-5" aria-busy="true" aria-label="جاري التحميل">
      <div className="apple-card space-y-3 px-5 py-6 sm:px-7 sm:py-7">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-11 w-64 rounded-lg" />
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      {[["lg:grid-cols-2", "h-72"], ["lg:grid-cols-2", "h-80"]].map(([cols, h]) => (
        <div key={cols} className={`grid gap-4 md:gap-5 ${cols}`}>
          <Skeleton className={`${h} rounded-[22px] bg-card`} />
          <Skeleton className={`${h} rounded-[22px] bg-card`} />
        </div>
      ))}
    </div>
  );
}
