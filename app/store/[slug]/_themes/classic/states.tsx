import Link from "next/link";
import { SearchX, Store } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Container, EmptyState, btn } from "./ui";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";

export function ClassicStoreClosed({ storeSlug, pause }: StoreClosedProps) {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<Store />}
        title="المتجر مقفول مؤقتًا"
        description={closedDescription(pause)}
        action={pause && storeSlug ? <StorePauseDetails storeSlug={storeSlug} pause={pause} /> : undefined}
        className="mx-auto max-w-xl bg-transparent"
      />
    </Container>
  );
}

export function ClassicNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={<SearchX />}
        title="الصفحة دي مش موجودة"
        description="ممكن يكون الرابط غلط أو المنتج اتشال من المتجر."
        className="mx-auto max-w-xl"
        action={
          <>
            <Link href={home} className={btn()}>
              الرجوع للرئيسية
            </Link>
            {storeSlug && (
              <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "outline" })}>
                تصفح المنتجات
              </Link>
            )}
          </>
        }
      />
    </Container>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "bg-(--c-subtle)";

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className={cn(S, "w-full rounded-(--c-radius)")} style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }} />
      <Skeleton className={cn(S, "mt-3 h-4 w-11/12")} />
      <Skeleton className={cn(S, "mt-2 h-4 w-2/3")} />
      <Skeleton className={cn(S, "mt-3 h-5 w-1/3")} />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="c-product-grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="pb-5 pt-4 sm:pb-8 sm:pt-6">
      <Skeleton className={cn(S, "h-4 w-40")} />
      <Skeleton className={cn(S, "mt-4 h-8 w-56")} />
      <Skeleton className={cn(S, "mt-2.5 h-4 w-24")} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10 pt-4 sm:pt-6">
      <Skeleton className={cn(S, "aspect-[4/3] w-full rounded-(--c-radius-lg) sm:aspect-[16/9] lg:aspect-[16/6]")} />
      <div className="c-section">
        <Skeleton className={cn(S, "mb-5 h-6 w-44")} />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-[4.75rem] shrink-0 sm:w-24">
              <Skeleton className={cn(S, "aspect-square rounded-full")} />
              <Skeleton className={cn(S, "mx-auto mt-2.5 h-3 w-3/4")} />
            </div>
          ))}
        </div>
      </div>
      <div className="c-section">
        <Skeleton className={cn(S, "mb-5 h-6 w-36")} />
        <ProductGridSkeleton count={8} />
      </div>
    </Container>
  );
}

export function ListingSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10">
      <HeaderSkeleton />
      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        <Skeleton className={cn(S, "h-11")} />
        <Skeleton className={cn(S, "h-11")} />
      </div>
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className={cn(S, "h-8")} />
          ))}
        </div>
        <div>
          <div className="c-product-grid" data-cols="3" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

export function ProductSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10">
      <Skeleton className={cn(S, "my-4 h-4 w-52 sm:my-6")} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <Skeleton className={cn(S, "-mx-(--c-gutter) aspect-square lg:mx-0 lg:rounded-(--c-radius-lg)")} />
        <div>
          <Skeleton className={cn(S, "h-4 w-24")} />
          <Skeleton className={cn(S, "mt-3 h-8 w-11/12")} />
          <Skeleton className={cn(S, "mt-2 h-8 w-2/3")} />
          <Skeleton className={cn(S, "mt-5 h-9 w-40")} />
          <Skeleton className={cn(S, "mt-8 h-px w-full")} />
          <div className="mt-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={cn(S, "h-11 w-14")} />
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Skeleton className={cn(S, "h-12 w-32")} />
            <Skeleton className={cn(S, "h-12 flex-1")} />
          </div>
          <Skeleton className={cn(S, "mt-3 h-12 w-full")} />
        </div>
      </div>
    </Container>
  );
}

export function PageSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10">
      <HeaderSkeleton />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-12">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className={cn(S, "size-24 shrink-0 rounded-(--c-radius-sm)")} />
              <div className="flex-1 space-y-2.5 pt-1">
                <Skeleton className={cn(S, "h-4 w-3/4")} />
                <Skeleton className={cn(S, "h-4 w-1/3")} />
                <Skeleton className={cn(S, "mt-4 h-9 w-28")} />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className={cn(S, "h-80 rounded-(--c-radius-lg)")} />
      </div>
    </Container>
  );
}

export function CategoriesSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10">
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className={cn(S, "aspect-[4/3] rounded-(--c-radius)")} />
            <Skeleton className={cn(S, "mt-3 h-4 w-2/3")} />
          </div>
        ))}
      </div>
    </Container>
  );
}

export function ProductGridPageSkeleton() {
  return (
    <Container role="status" aria-label="جاري التحميل" className="pb-10">
      <HeaderSkeleton />
      <ProductGridSkeleton count={8} />
    </Container>
  );
}
