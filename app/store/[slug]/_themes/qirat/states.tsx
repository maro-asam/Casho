import Link from "next/link";
import { Gem, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";
import { Empty, Ornament, Wrap, btn } from "./ui";

export function QiratStoreClosed({ storeSlug, pause }: StoreClosedProps) {
  return (
    <Wrap className="py-16 sm:py-24">
      <Empty
        icon={<Store />}
        title="المتجر مقفول مؤقتًا"
        description={closedDescription(pause)}
        action={pause && storeSlug ? <StorePauseDetails storeSlug={storeSlug} pause={pause} /> : undefined}
        className="mx-auto max-w-xl"
      />
    </Wrap>
  );
}

export function QiratNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="flex flex-col items-center py-20 text-center sm:py-28">
      <span className="qr-empty-icon">
        <Gem />
      </span>
      <h1 className="qr-h1 mt-6">الصفحة دي مش موجودة</h1>
      <Ornament className="mt-5" />
      <p className="mt-5 max-w-md text-[0.9375rem] leading-7 text-(--qr-ink-2)">ممكن يكون الرابط غلط، أو القطعة اتشالت من المتجر. جرّب تدوّر عليها من البحث.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={home} className={btn({ size: "lg" })}>
          الرجوع للرئيسية
        </Link>
        {storeSlug && (
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", variant: "outline" })}>
            كل القطع
          </Link>
        )}
      </div>
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "qr-skel";

function CardSkel() {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(S, "w-full")} style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }} />
      <div className={cn(S, "mt-4 h-2.5 w-1/4")} />
      <div className={cn(S, "mt-2.5 h-4 w-3/4")} />
      <div className={cn(S, "mt-2.5 h-3.5 w-1/3")} />
    </div>
  );
}

export function GridSkel({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("qr-pgrid", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function HeadSkel() {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className={cn(S, "h-3 w-20")} />
      <div className={cn(S, "h-10 w-64 max-w-full")} />
      <div className={cn(S, "h-2 w-24")} />
    </div>
  );
}

export function QiratHomeSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <div className={cn(S, "h-[70svh] w-full !rounded-none")} />
      <Wrap>
        <HeadSkel />
        <div className="flex justify-center gap-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-3">
              <div className={cn(S, "size-24 !rounded-full sm:size-32")} />
              <div className={cn(S, "h-3 w-16")} />
            </div>
          ))}
        </div>
        <HeadSkel />
        <GridSkel count={4} />
      </Wrap>
    </div>
  );
}

export function QiratListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="mb-6 flex justify-center gap-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(S, "h-4 w-16 shrink-0")} />
        ))}
      </div>
      <div className={cn(S, "mb-8 h-12")} />
      <GridSkel count={8} />
    </Wrap>
  );
}

export function QiratProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        <div className={cn(S, "w-full")} style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }} />
        <div className="pt-2">
          <div className={cn(S, "h-3 w-24")} />
          <div className={cn(S, "mt-4 h-10 w-11/12")} />
          <div className={cn(S, "mt-4 h-8 w-40")} />
          <div className={cn(S, "mt-10 h-2 w-24")} />
          <div className="mt-10 flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(S, "size-10 !rounded-full")} />
            ))}
          </div>
          <div className={cn(S, "mt-10 h-13 w-full")} />
          <div className={cn(S, "mt-3 h-13 w-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function QiratPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-28")} />
          ))}
        </div>
        <div className={cn(S, "h-96")} />
      </div>
    </Wrap>
  );
}

export function QiratCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="qr-catgrid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className={cn(S, "aspect-[4/5] w-full")} />
            <div className={cn(S, "h-4 w-2/3")} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function QiratGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <GridSkel count={8} />
    </Wrap>
  );
}
