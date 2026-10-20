import { Skeleton } from "@/components/ui/skeleton";
import { tr } from "@/lib/i18n/dashboard";

function SectionSkeleton({ fields = 2, className }: { fields?: number; className?: string }) {
  return (
    <div className={`apple-card space-y-4 p-5 ${className ?? ""}`}>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-56 rounded-md" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** loading.tsx body for a two-column form page (new / edit product, banner…). */
export function FormPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={tr("جاري التحميل")}>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionSkeleton fields={2} />
          <SectionSkeleton fields={0} className="min-h-56" />
          <SectionSkeleton fields={2} />
        </div>
        <div className="space-y-5">
          <SectionSkeleton fields={1} />
          <SectionSkeleton fields={2} />
        </div>
      </div>
    </div>
  );
}
