import Link from "next/link";
import { Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Empty, Wrap, btn } from "./ui";

export function DuneStoreClosed() {
  return (
    <Wrap className="py-16 sm:py-24">
      <Empty icon={<Store />} title="المتجر مقفول مؤقتًا" description="المتجر ده مش متاح دلوقتي. جرب تزوره تاني بعد شوية." className="mx-auto max-w-xl" />
    </Wrap>
  );
}

export function DuneNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="flex flex-col items-center py-20 text-center sm:py-32">
      <p aria-hidden className="dn-num select-none text-[clamp(7rem,24vw,14rem)] leading-none text-(--dn-line-ink)">
        ٤٠٤
      </p>
      <h1 className="dn-h2 mt-2">الصفحة دي مش موجودة</h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-(--dn-quiet)">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
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

const S = "dn-skel";

function CardSkel() {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(S, "w-full")} style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }} />
      <div className={cn(S, "mt-4 h-4 w-3/4")} />
      <div className={cn(S, "mt-2 h-4 w-1/3")} />
    </div>
  );
}

export function GridSkel({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-(--dn-gap) gap-y-10 md:grid-cols-3 xl:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function TitleSkel() {
  return (
    <div className="flex flex-col items-center pb-10 pt-10 sm:pt-12">
      <div className={cn(S, "h-3.5 w-36")} />
      <div className={cn(S, "mt-5 h-11 w-64")} />
      <div className={cn(S, "mt-3 h-3.5 w-20")} />
    </div>
  );
}

export function DuneHomeSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <div className={cn(S, "h-[min(80svh,52rem)]")} />
      <Wrap className="dn-section">
        <div className={cn(S, "mb-10 h-10 w-56")} />
        <GridSkel count={4} />
      </Wrap>
    </div>
  );
}

export function DuneListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className={cn(S, "mb-8 h-14")} />
      <div className="lg:flex lg:gap-12">
        <div className="hidden w-60 shrink-0 space-y-4 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(S, "h-10")} />
          ))}
        </div>
        <GridSkel count={9} className="flex-1 xl:grid-cols-3" />
      </div>
    </Wrap>
  );
}

export function DuneProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-6 h-3.5 w-52 sm:my-8")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
        <div className={cn(S, "-mx-(--dn-gutter) aspect-square lg:mx-0")} />
        <div>
          <div className={cn(S, "h-3.5 w-24")} />
          <div className={cn(S, "mt-5 h-12 w-11/12")} />
          <div className={cn(S, "mt-5 h-9 w-40")} />
          <div className="mt-10 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(S, "h-11 w-14 rounded-full")} />
            ))}
          </div>
          <div className={cn(S, "mt-10 h-14 w-full rounded-full")} />
          <div className={cn(S, "mt-3 h-14 w-full rounded-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function DunePageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-32")} />
          ))}
        </div>
        <div className={cn(S, "h-96")} />
      </div>
    </Wrap>
  );
}

export function DuneCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <GridSkel count={8} />
    </Wrap>
  );
}

export function DuneGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <GridSkel count={8} />
    </Wrap>
  );
}
