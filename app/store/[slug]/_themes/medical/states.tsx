import Link from "next/link";
import { Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Empty, Wrap, btn } from "./ui";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";

export function MedicalStoreClosed({ storeSlug, pause }: StoreClosedProps) {
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

export function MedicalNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="flex flex-col items-center py-16 text-center sm:py-24">
      <span aria-hidden className="rx-pluses grid size-28 place-items-center rounded-full bg-(--rx-tint) text-(--rx-btn) sm:size-36">
        <svg viewBox="0 0 24 24" className="size-12 sm:size-16" fill="currentColor">
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
        </svg>
      </span>
      <p className="rx-display mt-6 text-5xl">٤٠٤</p>
      <h1 className="rx-h2 mt-2">الصفحة دي مش موجودة</h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--rx-quiet)">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر. جرّب تدوّر عليه من البحث.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={home} className={btn({ size: "lg" })}>
          الرجوع للرئيسية
        </Link>
        {storeSlug && (
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", variant: "outline" })}>
            تصفح المنتجات
          </Link>
        )}
      </div>
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "rx-skel";

function CardSkel() {
  return (
    <div className="rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card) p-2.5">
      <div className={cn(S, "w-full rounded-(--rx-r)")} style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }} />
      <div className={cn(S, "mt-3 h-3 w-1/3")} />
      <div className={cn(S, "mt-2 h-4 w-4/5")} />
      <div className={cn(S, "mt-2.5 h-5 w-1/2")} />
      <div className={cn(S, "mt-3 h-9 w-full rounded-full")} />
    </div>
  );
}

export function GridSkel({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("rx-pgrid", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function TitleSkel() {
  return <div className={cn(S, "mt-4 h-32 w-full rounded-(--rx-r-lg) sm:mt-6 sm:h-36")} />;
}

export function MedicalHomeSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="py-5">
      <div className="grid gap-(--rx-gap) lg:grid-cols-[2fr_1fr]">
        <div className={cn(S, "h-72 rounded-(--rx-r-lg) lg:h-[26rem]")} />
        <div className="hidden gap-(--rx-gap) lg:grid">
          <div className={cn(S, "rounded-(--rx-r-lg)")} />
          <div className={cn(S, "rounded-(--rx-r-lg)")} />
        </div>
      </div>
      <div className={cn(S, "mb-5 mt-10 h-7 w-52")} />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-2">
            <div className={cn(S, "size-20 rounded-full sm:size-24")} />
            <div className={cn(S, "h-3 w-16")} />
          </div>
        ))}
      </div>
      <div className={cn(S, "mb-5 mt-10 h-7 w-56")} />
      <GridSkel count={5} />
    </Wrap>
  );
}

export function MedicalListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="my-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(S, "h-10 w-24 shrink-0 rounded-full")} />
        ))}
      </div>
      <div className="lg:flex lg:gap-8">
        <div className={cn(S, "hidden h-[28rem] w-72 shrink-0 rounded-(--rx-r-lg) lg:block")} />
        <div className="min-w-0 flex-1">
          <div className={cn(S, "mb-5 h-14 rounded-(--rx-r-lg)")} />
          <GridSkel count={8} />
        </div>
      </div>
    </Wrap>
  );
}

export function MedicalProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className={cn(S, "aspect-square rounded-(--rx-r-lg)")} />
        <div className="rounded-(--rx-r-lg) border border-(--rx-line) bg-(--rx-card) p-6">
          <div className={cn(S, "h-3.5 w-24")} />
          <div className={cn(S, "mt-4 h-9 w-11/12")} />
          <div className={cn(S, "mt-4 h-8 w-40")} />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(S, "h-10 w-20 rounded-full")} />
            ))}
          </div>
          <div className={cn(S, "mt-8 h-12 w-full rounded-full")} />
          <div className={cn(S, "mt-3 h-12 w-full rounded-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function MedicalPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-28 rounded-(--rx-r)")} />
          ))}
        </div>
        <div className={cn(S, "h-96 rounded-(--rx-r-lg)")} />
      </div>
    </Wrap>
  );
}

export function MedicalCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="mt-6 grid grid-cols-2 gap-(--rx-gap) sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-(--rx-r) border border-(--rx-line) bg-(--rx-card) p-4">
            <div className={cn(S, "size-24 rounded-full")} />
            <div className={cn(S, "h-4 w-2/3")} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function MedicalGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="h-6" />
      <GridSkel count={10} />
    </Wrap>
  );
}
