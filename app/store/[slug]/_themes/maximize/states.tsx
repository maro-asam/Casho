import Link from "next/link";
import { Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { Empty, Wrap, btn } from "./ui";

export function MaxStoreClosed() {
  return (
    <Wrap className="py-16 sm:py-24">
      <Empty icon={<Store />} title="المتجر مقفول مؤقتًا" description="المتجر ده مش متاح دلوقتي. جرب تزوره تاني بعد شوية." className="mx-auto max-w-xl" />
    </Wrap>
  );
}

export function MaxNotFound({ storeSlug }: { storeSlug?: string }) {
  const home = storeSlug ? buildStoreUrl(storeSlug) : "/";
  return (
    <Wrap className="flex flex-col items-center py-16 text-center sm:py-24">
      <p aria-hidden className="mx-display select-none text-[clamp(6rem,20vw,11rem)] leading-none text-(--mx-tint)">
        ٤٠٤
      </p>
      <h1 className="mx-h2 mt-2">الصفحة دي مش موجودة</h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-7 text-(--mx-quiet)">ممكن يكون الرابط غلط، أو المنتج اتشال من المتجر.</p>
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

const S = "mx-skel";

function CardSkel() {
  return (
    <div>
      <div className={cn(S, "w-full rounded-(--mx-r)")} style={{ aspectRatio: "var(--store-img-ratio, 1 / 1)" }} />
      <div className={cn(S, "mt-3 h-3 w-1/3")} />
      <div className={cn(S, "mt-2 h-4 w-4/5")} />
      <div className={cn(S, "mt-2.5 h-5 w-1/2")} />
    </div>
  );
}

export function GridSkel({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("mx-pgrid", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkel key={i} />
      ))}
    </div>
  );
}

function TitleSkel() {
  return (
    <div className="pb-6 pt-4">
      <div className={cn(S, "h-28 w-full rounded-(--mx-r-lg) sm:h-36")} />
      <div className={cn(S, "mt-5 h-3.5 w-40")} />
    </div>
  );
}

export function MaxHomeSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="py-5">
      <div className="mx-rail gap-(--mx-gap)">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(S, "h-[5.5rem] w-[46%] shrink-0 rounded-(--mx-r) sm:w-[30%] lg:w-[16%]")} />
        ))}
      </div>
      <div className="mt-6 grid gap-(--mx-gap) lg:grid-cols-[2fr_1fr]">
        <div className={cn(S, "h-[26rem] rounded-(--mx-r-lg) lg:h-[31rem]")} />
        <div className="hidden gap-(--mx-gap) lg:grid">
          <div className={cn(S, "rounded-(--mx-r-lg)")} />
          <div className={cn(S, "rounded-(--mx-r-lg)")} />
        </div>
      </div>
      <div className={cn(S, "mb-6 mt-12 h-8 w-56")} />
      <GridSkel count={6} className="xl:!grid-cols-6" />
    </Wrap>
  );
}

export function MaxListingSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className={cn(S, "mb-6 h-14 rounded-(--mx-r)")} />
      <div className="lg:flex lg:gap-8">
        <div className="hidden w-64 shrink-0 space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(S, "h-10")} />
          ))}
        </div>
        <GridSkel count={8} className="flex-1" />
      </div>
    </Wrap>
  );
}

export function MaxProductSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-52")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
        <div className={cn(S, "aspect-square rounded-(--mx-r-lg)")} />
        <div>
          <div className={cn(S, "h-3.5 w-24")} />
          <div className={cn(S, "mt-4 h-9 w-11/12")} />
          <div className={cn(S, "mt-4 h-7 w-40")} />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(S, "h-11 w-14")} />
            ))}
          </div>
          <div className={cn(S, "mt-8 h-12 w-full")} />
          <div className={cn(S, "mt-3 h-12 w-full")} />
        </div>
      </div>
    </Wrap>
  );
}

export function MaxPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <div className={cn(S, "my-5 h-3.5 w-40")} />
      <div className={cn(S, "mb-8 h-9 w-56")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(S, "h-28")} />
          ))}
        </div>
        <div className={cn(S, "h-96 rounded-(--mx-r-lg)")} />
      </div>
    </Wrap>
  );
}

export function MaxCategoriesSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <div className="grid grid-cols-2 gap-(--mx-gap) md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={cn(S, "aspect-[4/5] rounded-(--mx-r)")} />
        ))}
      </div>
    </Wrap>
  );
}

export function MaxGridPageSkeleton() {
  return (
    <Wrap role="status" aria-label="جاري التحميل" className="pb-10">
      <TitleSkel />
      <GridSkel count={10} />
    </Wrap>
  );
}
