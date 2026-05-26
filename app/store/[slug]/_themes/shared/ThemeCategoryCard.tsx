import Image from "next/image";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { Card } from "@/components/ui/card";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { StoreThemeData } from "../types";

type ThemeCategory = StoreThemeData["categories"][number];

type ThemeCategoryCardProps = {
  category: ThemeCategory;
  storeSlug: string;
};

export default function ThemeCategoryCard({
  category,
  storeSlug,
}: ThemeCategoryCardProps) {
  const href = buildStoreUrl(storeSlug, `/categories/${category.id}`);

  return (
    <Link href={href} prefetch={false} className="block">
      <Card className="overflow-hidden border p-0">
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
