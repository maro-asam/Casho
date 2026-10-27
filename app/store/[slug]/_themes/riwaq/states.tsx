import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Wrap, btn } from "./ui";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";

// ─── Closed / not found ─────────────────────────────────────────────────────

export function RiwaqStoreClosed({ storeSlug, pause }: StoreClosedProps) {
  return (
    <Wrap className="grid min-h-[60dvh] items-center py-16">
      <div className="grid grid-cols-1 items-end gap-10 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-14">
        <div className="rq-arch h-48 w-36 border border-(--rq-ink) bg-transparent" aria-hidden />
        <div>
          <p className="rq-label text-(--rq-accent)">مقفول مؤقتًا</p>
          <h1 className="rq-h1 mt-3">المتجر واخد استراحة</h1>
          <p className="rq-body mt-4 max-w-[44ch] text-(--rq-quiet)">{closedDescription(pause)}</p>
          {pause && storeSlug && <StorePauseDetails storeSlug={storeSlug} pause={pause} align="start" className="mt-8" />}
        </div>
      </div>
    </Wrap>
  );
}

export function RiwaqNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="py-14 sm:py-24">
      <p
        aria-hidden
        className="rq-face select-none text-[clamp(7rem,30vw,18rem)] font-semibold leading-[0.9] text-transparent [-webkit-text-stroke:1.5px_var(--rq-ink)]"
      >
        ٤٠٤
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-(--rq-ink) pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h1 className="rq-h2">الصفحة دي مش موجودة</h1>
          <p className="rq-body mt-3 max-w-[48ch] text-(--rq-quiet)">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={home} className={btn()}>
            الرجوع للرئيسية
          </Link>
          {storeSlug && (
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "line" })}>
              تصفح المنتجات
            </Link>
          )}
        </div>
      </div>
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "rq-skel";

function TitleSkeleton() {
  return (
    <div className="pb-6 pt-5 sm:pb-10 sm:pt-8">
      <div className={cn(S, "h-3.5 w-40")} />
      <div className={cn(S, "mt-6 h-10 w-64 sm:mt-8 sm:h-14 sm:w-96")} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div>
      <div className={cn(S, "mb-2.5 h-3 w-6")} />
      <div className={S} style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }} />
      <div className={cn(S, "mt-4 h-3 w-1/3")} />
      <div className={cn(S, "mt-2 h-4 w-11/12")} />
      <div className={cn(S, "mt-4 h-5 w-1/2")} />
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="rq-ruled" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function RiwaqHomeSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <Wrap className="grid grid-cols-1 items-end gap-12 pb-12 pt-8 lg:grid-cols-12 lg:pt-14">
        <div className="lg:col-span-7">
          <div className={cn(S, "h-3.5 w-36")} />
          <div className={cn(S, "mt-6 h-16 w-5/6 sm:h-24")} />
          <div className={cn(S, "mt-4 h-16 w-2/3 sm:h-24")} />
          <div className={cn(S, "mt-8 h-14 w-48")} />
        </div>
        <div className={cn(S, "rq-arch ms-auto aspect-[4/5] w-[86%] sm:w-[62%] lg:col-span-5 lg:w-full")} />
      </Wrap>
      <div className={cn(S, "h-12 sm:h-14")} />
      <Wrap className="rq-section">
        <div className={cn(S, "mb-10 h-9 w-48")} />
        <GridSkeleton count={8} />
      </Wrap>
    </div>
  );
}

export function RiwaqListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkeleton />
      <div className="mb-8 flex gap-7 border-b border-(--rq-rule) pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(S, "h-4 w-16")} />
        ))}
      </div>
      <GridSkeleton count={8} />
    </Wrap>
  );
}

export function RiwaqProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52 sm:my-7")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
        <div className={cn(S, "-mx-(--rq-gutter) aspect-[4/5] lg:col-span-7 lg:mx-0")} />
        <div className="lg:col-span-5">
          <div className={cn(S, "h-3.5 w-24")} />
          <div className={cn(S, "mt-4 h-10 w-11/12")} />
          <div className={cn(S, "mt-3 h-10 w-2/3")} />
          <div className={cn(S, "mt-6 h-10 w-40")} />
          <div className="mt-8 h-px w-full bg-(--rq-ink)" />
          <div className="mt-7 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(S, "size-11")} />
            ))}
          </div>
          <div className={cn(S, "mt-8 h-14 w-full")} />
          <div className={cn(S, "mt-3 h-14 w-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function RiwaqPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkeleton />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="border-t border-(--rq-ink) lg:col-span-7">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-(--rq-rule) py-5">
              <div className={cn(S, "aspect-[4/5] w-24 shrink-0")} />
              <div className="flex-1 space-y-3 pt-1">
                <div className={cn(S, "h-4 w-3/4")} />
                <div className={cn(S, "h-3 w-1/3")} />
                <div className={cn(S, "mt-5 h-11 w-32")} />
              </div>
            </div>
          ))}
        </div>
        <div className={cn(S, "h-96 lg:col-span-5")} />
      </div>
    </Wrap>
  );
}

export function RiwaqCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkeleton />
      <div className="border-t border-(--rq-ink)">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex min-h-24 items-center gap-6 border-b border-(--rq-rule)">
            <div className={cn(S, "h-3 w-6")} />
            <div className={cn(S, "h-8 w-56")} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function RiwaqGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkeleton />
      <GridSkeleton count={8} />
    </Wrap>
  );
}
