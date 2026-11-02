import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Empty, Wrap, btn } from "./ui";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";

export function StageStoreClosed({ storeSlug, pause }: StoreClosedProps) {
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

export function StageNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="flex flex-col items-center py-16 text-center sm:py-24">
      <span aria-hidden className="grid size-20 place-items-center rounded-full bg-(--sg-fill) text-(--sg-label-2)">
        <ShoppingBag className="size-9" />
      </span>
      <h1 className="sg-h1 mt-5">الصفحة دي مش موجودة</h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--sg-label-2)">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر. جرّب تدوّر عليه من البحث.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={home} className={btn({ size: "lg" })}>
          الرجوع للرئيسية
        </Link>
        {storeSlug && (
          <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", variant: "gray" })}>
            تصفح المنتجات
          </Link>
        )}
      </div>
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "sg-skel";

function CardSkel() {
  return (
    <div className="rounded-(--sg-r) border border-(--sg-sep) bg-(--sg-cell) p-2.5">
      <div className={cn(S, "w-full rounded-(--sg-r)")} style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }} />
      <div className={cn(S, "mt-3 h-3 w-1/3")} />
      <div className={cn(S, "mt-2 h-4 w-4/5")} />
      <div className={cn(S, "mt-2.5 h-5 w-1/2")} />
      <div className={cn(S, "mt-3 h-9 w-full")} />
    </div>
  );
}

export function GridSkel({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("sg-pgrid", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function TitleSkel() {
  return <div className={cn(S, "mt-4 h-32 w-full rounded-(--sg-r) sm:mt-6 sm:h-36")} />;
}

export function StageHomeSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="py-5">
      <div className="grid gap-(--sg-gap) lg:grid-cols-[2fr_1fr]">
        <div className={cn(S, "h-72 rounded-(--sg-r) lg:h-[26rem]")} />
        <div className="hidden gap-(--sg-gap) lg:grid">
          <div className={cn(S, "rounded-(--sg-r)")} />
          <div className={cn(S, "rounded-(--sg-r)")} />
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

export function StageListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="my-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(S, "h-10 w-24 shrink-0")} />
        ))}
      </div>
      <div className="lg:flex lg:gap-8">
        <div className={cn(S, "hidden h-[28rem] w-72 shrink-0 rounded-(--sg-r) lg:block")} />
        <div className="min-w-0 flex-1">
          <div className={cn(S, "mb-5 h-14 rounded-(--sg-r)")} />
          <GridSkel count={8} />
        </div>
      </div>
    </Wrap>
  );
}

export function StageProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className={cn(S, "aspect-square rounded-(--sg-r)")} />
        <div className="rounded-(--sg-r) border border-(--sg-sep) bg-(--sg-cell) p-6">
          <div className={cn(S, "h-3.5 w-24")} />
          <div className={cn(S, "mt-4 h-9 w-11/12")} />
          <div className={cn(S, "mt-4 h-8 w-40")} />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(S, "h-10 w-20")} />
            ))}
          </div>
          <div className={cn(S, "mt-8 h-12 w-full")} />
          <div className={cn(S, "mt-3 h-12 w-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function StagePageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-28 rounded-(--sg-r)")} />
          ))}
        </div>
        <div className={cn(S, "h-96 rounded-(--sg-r)")} />
      </div>
    </Wrap>
  );
}

export function StageCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="mt-6 grid grid-cols-2 gap-(--sg-gap) sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-(--sg-r) border border-(--sg-sep) bg-(--sg-cell) p-4">
            <div className={cn(S, "size-24 rounded-full")} />
            <div className={cn(S, "h-4 w-2/3")} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function StageGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="h-6" />
      <GridSkel count={10} />
    </Wrap>
  );
}
