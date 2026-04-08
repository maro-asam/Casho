import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function ProductDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-screen-2xl py-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="gap-2" disabled>
            <Skeleton className="h-4 w-4 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </Button>

          <span>/</span>
          <Skeleton className="h-4 w-24" />

          <span>/</span>
          <Skeleton className="h-4 w-20" />

          <span>/</span>
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 xl:grid-cols-[1fr_800px]">
          {/* Details */}
          <div className="order-2 space-y-6 xl:order-2">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-28 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-[85%] max-w-2xl" />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <Card className="rounded-lg shadow-sm">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>

                  <div className="flex items-center justify-between border-b pb-3">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg border-primary/10 bg-muted/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-11 w-36 rounded-lg" />
                    <Skeleton className="h-11 w-36 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Image */}
          <Card className="order-1 h-fit overflow-hidden rounded-lg border-border/60 shadow-sm xl:order-1">
            <CardContent>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Products */}
        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>

            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="group overflow-hidden rounded-lg border-border/60 shadow-sm"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden bg-muted/30">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                </CardContent>

                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-14 rounded-lg" />
                  </div>

                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>

                <CardFooter className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}