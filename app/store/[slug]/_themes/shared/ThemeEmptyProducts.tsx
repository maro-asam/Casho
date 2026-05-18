import Link from "next/link";
import { Grid3X3, PackageOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

type ThemeEmptyProductsProps = {
  storeSlug: string;
};

export default function ThemeEmptyProducts({
  storeSlug,
}: ThemeEmptyProductsProps) {
  return (
    <Card className="rounded-[var(--store-radius)] border-dashed bg-card shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-5 py-16 text-center sm:py-20">
        <div className="mb-5 flex size-16 items-center justify-center rounded-[var(--store-radius)] border bg-background">
          <PackageOpen className="size-8 text-muted-foreground" />
        </div>

        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[var(--store-primary)]">
          Empty Catalog
        </p>

        <h2 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          لا توجد منتجات متاحة حاليًا
        </h2>

        <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          لم يتم إضافة منتجات نشطة إلى هذا المتجر بعد. يمكنك تصفح التصنيفات
          لاحقًا أو العودة في وقت آخر.
        </p>

        <div className="mt-7">
          <Button asChild variant="outline" className="rounded-full font-black">
            <Link href={buildStoreUrl(storeSlug, "/categories")}>
              عرض التصنيفات
              <Grid3X3 className="me-2 size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
