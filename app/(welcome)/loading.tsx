import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomeLoading() {
  return (
    <div dir="rtl" className="mt-10 flex flex-col gap-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <Skeleton className="h-8 w-44 rounded-full" />
        <div className="w-full space-y-3">
          <Skeleton className="mx-auto h-14 w-4/5 max-w-2xl rounded-2xl" />
          <Skeleton className="mx-auto h-14 w-3/5 max-w-xl rounded-2xl" />
        </div>
        <Skeleton className="h-5 w-2/3 max-w-lg rounded-full" />
        <div className="mt-2 flex items-center gap-3">
          <Skeleton className="h-12 w-44 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
        <Skeleton className="mt-8 h-72 w-full max-w-4xl rounded-3xl md:h-96" />
      </section>

      {/* Payment logos */}
      <section className="flex flex-col items-center gap-5">
        <Skeleton className="h-4 w-36 rounded-full" />
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-4 w-24 rounded-full" />
          <Skeleton className="mx-auto h-7 w-64 rounded-xl" />
          <Skeleton className="mx-auto h-5 w-80 rounded-full" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border p-6">
              <Skeleton className="size-11 rounded-xl" />
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-8">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-7 w-44 rounded-xl" />
          <Skeleton className="mx-auto h-5 w-72 rounded-full" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-5 rounded-2xl border p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 w-36 rounded-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
