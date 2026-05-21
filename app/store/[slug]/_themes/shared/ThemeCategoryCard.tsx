import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";

import { Card } from "@/components/ui/card";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";

import type { StoreThemeData } from "../types";

type ThemeCategory = StoreThemeData["categories"][number];

type ThemeCategoryCardProps = {
  category: ThemeCategory;
  storeSlug: string;
  variant?: "classic" | "boutique" | "bold" | "magazine";
};

export default function ThemeCategoryCard({
  category,
  storeSlug,
  variant = "classic",
}: ThemeCategoryCardProps) {
  const href = buildStoreUrl(storeSlug, `/categories/${category.id}`);

  if (variant === "bold") {
    return (
      <Link href={href} prefetch={false} className="group block">
        <Card className="overflow-hidden rounded-none border-0 bg-card p-0 shadow-none">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.name}
                fill
                loading="lazy"
                quality={25}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FolderOpen className="size-10 text-muted-foreground" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                Category
              </p>

              <div className="flex items-end justify-between gap-3">
                <h3 className="line-clamp-2 text-xl font-bold leading-tight">
                  {category.name}
                </h3>

                <span className="flex size-9 shrink-0 items-center justify-center border border-white/30 bg-white/10 transition group-hover:bg-white group-hover:text-black">
                  <ArrowLeft className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "magazine") {
  return (
    <Link href={href} prefetch={false} className="group block">
      <Card className="overflow-hidden rounded-none border-0 bg-card p-0 shadow-none">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              loading="lazy"
              quality={25}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FolderOpen className="size-10 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />

          <div className="absolute right-4 top-4 border border-white/30 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white backdrop-blur">
            Section
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-white/60">
              Magazine Category
            </p>

            <div className="flex items-end justify-between gap-4">
              <h3 className="line-clamp-2 text-3xl font-bold uppercase leading-[0.9] tracking-[-0.04em]">
                {category.name}
              </h3>

              <span className="flex size-10 shrink-0 items-center justify-center border border-white/30 bg-white/10 transition group-hover:bg-white group-hover:text-black">
                <ArrowLeft className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

  return (
    <Link href={href} prefetch={false} className="block">
      <Card
        className={cn(
          "overflow-hidden border p-0",
          variant === "boutique" && "rounded-[1.5rem]",
        )}
      >
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              loading="lazy"
              quality={20}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FolderOpen className="size-10 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-4">
            <h3 className="line-clamp-1 font-semibold text-white">
              {category.name}
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}