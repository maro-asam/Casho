import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });

type Props = {
  name: string;
  image?: string;
  price: number | null;
  compareAtPrice: number | null;
  categoryName?: string;
};

/** Rough storefront card so merchants see what customers will see. */
export function ProductPreview({ name, image, price, compareAtPrice, categoryName }: Props) {
  const onSale = price !== null && compareAtPrice !== null && compareAtPrice > price;
  const discount = onSale ? Math.round((1 - price! / compareAtPrice!) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="relative aspect-square bg-muted">
        {image ? (
          <Image src={image} alt="" fill sizes="320px" className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground/60">
            <ImageIcon className="size-8" />
          </div>
        )}
        {onSale && (
          <span className="absolute inset-s-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {tr("خصم {0}٪", discount)}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
        <p className="line-clamp-2 text-sm font-medium">{name || tr("اسم المنتج")}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tabular-nums">{price !== null ? money.format(price) : "—"}</span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">{money.format(compareAtPrice!)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
