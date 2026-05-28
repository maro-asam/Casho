import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div dir="rtl" className="flex min-h-screen">
      {/* Form panel (right in RTL) */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-104 space-y-7">
          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden">
            <Skeleton className="size-11 rounded-xl" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-44 rounded-xl" />
            <Skeleton className="h-5 w-72 rounded-full" />
          </div>

          {/* Form fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          {/* Submit */}
          <Skeleton className="h-11 w-full rounded-xl" />

          {/* Footer link */}
          <Skeleton className="mx-auto h-4 w-52 rounded-full" />
        </div>
      </div>

      {/* Brand panel (left in RTL) — hidden on mobile */}
      <div className="relative hidden w-130 flex-col justify-between overflow-hidden bg-slate-900 p-10 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg opacity-25" />
          <Skeleton className="h-5 w-16 rounded-full opacity-20" />
        </div>

        {/* Features */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-9 w-56 rounded-xl opacity-20" />
            <Skeleton className="h-9 w-40 rounded-xl opacity-20" />
            <Skeleton className="mt-1 h-4 w-72 rounded-full opacity-15" />
            <Skeleton className="h-4 w-60 rounded-full opacity-15" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-xl opacity-20" />
                <Skeleton className="h-4 w-52 rounded-full opacity-15" />
              </div>
            ))}
          </div>
        </div>

        {/* Stats widget */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-around gap-6 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-7 w-16 rounded-lg opacity-20" />
                <Skeleton className="h-3 w-14 rounded-full opacity-15" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
