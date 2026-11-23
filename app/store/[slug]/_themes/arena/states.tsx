import Link from "next/link";
import { Gamepad2, Store } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { StoreClosedProps } from "../types";
import { StorePauseDetails, closedDescription } from "../shared/pause/StorePauseDetails";
import { Empty, Wrap, btn } from "./ui";
import { st } from "@/lib/i18n/storefront";

export function ArenaStoreClosed({ storeSlug, pause }: StoreClosedProps) {
  return (
    <Wrap className="an-page">
      <Empty
        icon={<Store />}
        title={st("المتجر مقفول مؤقتًا")}
        description={closedDescription(pause)}
        action={pause && storeSlug ? <StorePauseDetails storeSlug={storeSlug} pause={pause} /> : undefined}
        className="mx-auto max-w-xl"
      />
    </Wrap>
  );
}

export function ArenaNotFound({ storeSlug }: { storeSlug?: string }) {
  return (
    <Wrap className="an-page">
      <Empty
        icon={<Gamepad2 />}
        title={st("الصفحة دي مش موجودة")}
        description={st("ممكن يكون الرابط غلط، أو الباقة اتشالت من المتجر.")}
        className="mx-auto max-w-xl"
        action={
          <>
            <Link href={storeSlug ? buildStoreUrl(storeSlug) : "/"} className={btn({ size: "lg" })}>
              {st("الرجوع للرئيسية")}
            </Link>
            {storeSlug && (
              <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ size: "lg", variant: "glass" })}>
                {st("شوف الألعاب")}
              </Link>
            )}
          </>
        }
      />
    </Wrap>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const S = "an-skel";

function GameSkel() {
  return (
    <div className="an-panel p-4">
      <div className={cn(S, "size-14 rounded-(--an-r-md)")} />
      <div className={cn(S, "mt-3 h-4 w-2/3")} />
      <div className={cn(S, "mt-2 h-3 w-1/3")} />
      <div className={cn(S, "mt-4 h-4 w-1/2")} />
    </div>
  );
}

function Games({ n = 8 }: { n?: number }) {
  return (
    <div className="an-games">
      {Array.from({ length: n }, (_, i) => (
        <GameSkel key={i} />
      ))}
    </div>
  );
}

function Pkgs({ n = 6 }: { n?: number }) {
  return (
    <div className="an-pkgs">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="an-pkg pointer-events-none">
          <div className={cn(S, "h-4 w-2/3")} />
          <div className={cn(S, "mt-2.5 h-5 w-1/2")} />
        </div>
      ))}
    </div>
  );
}

export function ArenaHomeSkeleton() {
  return (
    <Wrap className="an-page">
      <div className={cn(S, "h-64 w-full rounded-[1.75rem] md:h-80")} />
      <div className={cn(S, "mb-5 mt-10 h-6 w-48")} />
      <Games />
    </Wrap>
  );
}

export function ArenaCategoriesSkeleton() {
  return (
    <Wrap className="an-page">
      <div className={cn(S, "mb-6 h-8 w-56")} />
      <Games />
    </Wrap>
  );
}

/** The game page (a category): header card, packages, the account form. */
export function ArenaGameSkeleton() {
  return (
    <Wrap narrow className="an-page">
      <div className={cn(S, "mb-4 h-4 w-28")} />
      <div className={cn(S, "h-24 w-full rounded-(--an-r)")} />
      <div className={cn(S, "mb-3 mt-7 h-5 w-32")} />
      <Pkgs />
      <div className={cn(S, "mb-3 mt-7 h-5 w-32")} />
      <div className={cn(S, "h-12 w-full rounded-(--an-r-md)")} />
    </Wrap>
  );
}

export const ArenaProductSkeleton = ArenaGameSkeleton;

/** Every package (/products): search, chips, tiles. */
export function ArenaListingSkeleton() {
  return (
    <Wrap className="an-page">
      <div className={cn(S, "mb-4 h-8 w-48")} />
      <div className={cn(S, "mb-6 h-12 w-full rounded-(--an-r-md)")} />
      <Pkgs n={9} />
    </Wrap>
  );
}

export function ArenaPageSkeleton() {
  return (
    <Wrap className="an-page">
      <div className={cn(S, "mb-6 h-8 w-48")} />
      <div className={cn(S, "h-72 w-full rounded-(--an-r)")} />
    </Wrap>
  );
}
