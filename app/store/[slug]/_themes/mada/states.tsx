import Link from "next/link";
import { SearchX, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Empty, Wrap, btn } from "./ui";

export function MadaStoreClosed() {
  return (
    <Wrap className="py-16 sm:py-24">
      <Empty icon={<Store />} title="المتجر مقفول مؤقتًا" description="المتجر ده مش متاح دلوقتي. جرب تزوره تاني بعد شوية." className="mx-auto max-w-xl" />
    </Wrap>
  );
}

export function MadaNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="py-12 sm:py-20">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-(--md-brand) px-6 py-14 text-center text-(--md-brand-ink) sm:py-20">
        <p aria-hidden className="md-face select-none text-[clamp(6rem,22vw,12rem)] font-bold leading-none text-(--md-signal)">
          ٤٠٤
        </p>
        <h1 className="md-h2 mt-4">الصفحة دي مش موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-7 opacity-80">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link href={home} className={btn({ variant: "signal", size: "lg" })}>
            الرجوع للرئيسية
          </Link>
          {storeSlug && (
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", className: "border-white/25 bg-transparent text-inherit hover:bg-white/10" })}>
              <SearchX />
              تصفح المنتجات
            </Link>
          )}
        </div>
      </div>
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "md-skel";

function CardSkel() {
  return (
    <div>
      <div className={cn(S, "rounded-(--md-radius)")} style={{ aspectRatio: "var(--store-img-ratio, 3 / 4)" }} />
      <div className={cn(S, "mt-4 h-3 w-1/3")} />
      <div className={cn(S, "mt-2 h-4 w-11/12")} />
      <div className={cn(S, "mt-3 h-4 w-1/2")} />
    </div>
  );
}

export function GridSkel({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function HeadSkel() {
  return (
    <div className="pb-6 pt-5 sm:pt-7">
      <div className={cn(S, "h-3.5 w-40")} />
      <div className={cn(S, "mt-5 h-10 w-64")} />
      <div className={cn(S, "mt-3 h-3.5 w-24")} />
    </div>
  );
}

export function MadaHomeSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <Wrap className="pt-3 sm:pt-4">
        <div className={cn(S, "aspect-[4/5] rounded-[1.75rem] sm:aspect-[16/10] lg:aspect-auto lg:h-[min(78dvh,46rem)]")} />
      </Wrap>
      <Wrap className="md-section">
        <div className={cn(S, "mb-3 h-6 w-20 rounded-full")} />
        <div className={cn(S, "mb-9 h-9 w-56")} />
        <GridSkel count={4} />
      </Wrap>
    </div>
  );
}

export function MadaListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="mb-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(S, "h-12 w-28 shrink-0 rounded-full")} />
        ))}
      </div>
      <div className="lg:flex lg:gap-10">
        <div className="hidden w-64 shrink-0 space-y-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn(S, "h-9")} />
          ))}
        </div>
        <GridSkel count={9} className="flex-1 lg:grid-cols-3" />
      </div>
    </Wrap>
  );
}

export function MadaProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52 sm:my-7")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <div className={cn(S, "-mx-(--md-gutter) aspect-[4/5] rounded-none lg:mx-0 lg:rounded-(--md-radius)")} />
        <div>
          <div className={cn(S, "h-8 w-24 rounded-full")} />
          <div className={cn(S, "mt-5 h-9 w-11/12")} />
          <div className={cn(S, "mt-3 h-9 w-2/3")} />
          <div className={cn(S, "mt-6 h-9 w-40")} />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(S, "size-11 rounded-full")} />
            ))}
          </div>
          <div className={cn(S, "mt-8 h-14 w-full rounded-full")} />
          <div className={cn(S, "mt-3 h-14 w-full rounded-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function MadaPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-36 rounded-[1.5rem]")} />
          ))}
        </div>
        <div className={cn(S, "h-96 rounded-[1.5rem]")} />
      </div>
    </Wrap>
  );
}

export function MadaCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={cn(S, "aspect-[4/5] rounded-(--md-radius)")} />
        ))}
      </div>
    </Wrap>
  );
}

export function MadaGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <HeadSkel />
      <GridSkel count={8} />
    </Wrap>
  );
}
