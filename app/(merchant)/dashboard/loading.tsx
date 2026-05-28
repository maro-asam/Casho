import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div dir="rtl" className="space-y-6">
      <Card className="overflow-hidden rounded-[2.25rem] border-border/70 bg-background/80 shadow-sm shadow-black/5">
        <CardContent className="p-5 sm:p-6 lg:p-7">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-36 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-48 rounded-full" />
                <Skeleton className="h-11 w-full max-w-2xl rounded-2xl" />
                <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
                <Skeleton className="h-5 w-full max-w-lg rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-11 w-36 rounded-2xl" />
                <Skeleton className="h-11 w-32 rounded-2xl" />
                <Skeleton className="h-11 w-32 rounded-2xl" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Skeleton className="h-32 rounded-[1.75rem]" />
              <Skeleton className="h-32 rounded-[1.75rem]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="border-border/70 bg-background/80 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
                <Skeleton className="size-11 rounded-2xl" />
              </div>
              <Skeleton className="h-8 w-32 rounded-2xl" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Skeleton className="h-[450px] xl:col-span-3" />
        <Skeleton className="h-[450px] xl:col-span-2" />
      </div>
    </div>
  );
}
