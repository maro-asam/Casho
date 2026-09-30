import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Layers, Star } from "lucide-react";

import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "./product-filters";
import { ProductRowActions } from "./product-row-actions";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  /** Pounds (Product prices are stored in EGP, unlike orders). */
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  type: string;
  categoryName: string;
  soldCount: number;
};

const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = new Intl.NumberFormat("ar-EG");

const editHref = (id: string) => `/products/${id}/edit`;

function Thumb({ product }: { product: ProductRow }) {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      {product.image ? (
        <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <ImageIcon className="absolute inset-0 m-auto size-4 text-muted-foreground/60" />
      )}
    </div>
  );
}

function StockPill({ product }: { product: ProductRow }) {
  if (product.stock <= 0) return <StatusPill tone="danger">نفد</StatusPill>;
  if (product.stock <= (product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)) {
    return <StatusPill tone="warning">{nf.format(product.stock)} · قليل</StatusPill>;
  }
  return <span className="text-sm tabular-nums">{nf.format(product.stock)} قطعة</span>;
}

function Price({ product, className }: { product: ProductRow; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold tabular-nums">{money.format(product.price)}</p>
      {product.compareAtPrice && product.compareAtPrice > product.price && (
        <p className="text-xs text-muted-foreground line-through tabular-nums">{money.format(product.compareAtPrice)}</p>
      )}
    </div>
  );
}

function NameBadges({ product }: { product: ProductRow }) {
  return (
    <>
      {product.isFeatured && (
        <Star aria-label="منتج مميز" className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
      )}
      {product.type === "BUNDLE" && <Layers aria-label="باقة منتجات" className="size-3.5 shrink-0 text-muted-foreground" />}
    </>
  );
}

export function ProductsTable({ products, storeSlug }: { products: ProductRow[]; storeSlug: string }) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">المنتج</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                التصنيف
              </TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">الحالة</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">المخزون</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground xl:table-cell">
                اتباع
              </TableHead>
              <TableHead className="h-10 text-left text-xs font-medium text-muted-foreground">السعر</TableHead>
              <TableHead className="h-10 w-12 pe-4">
                <span className="sr-only">إجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="relative">
                <TableCell className="py-3 ps-4">
                  <div className="flex items-center gap-3">
                    <Thumb product={product} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={editHref(product.id)}
                          className="max-w-64 truncate text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                        >
                          {product.name}
                        </Link>
                        <NameBadges product={product} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {product.sku ? `SKU ${product.sku}` : `/${product.slug}`}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden py-3 text-sm text-muted-foreground lg:table-cell">{product.categoryName}</TableCell>
                <TableCell className="py-3">
                  {product.isActive ? (
                    <StatusPill tone="success">ظاهر</StatusPill>
                  ) : (
                    <StatusPill tone="neutral">مخفي</StatusPill>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <StockPill product={product} />
                </TableCell>
                <TableCell className="hidden py-3 text-sm tabular-nums text-muted-foreground xl:table-cell">
                  {nf.format(product.soldCount)}
                </TableCell>
                <TableCell className="py-3 text-left">
                  <Price product={product} />
                </TableCell>
                <TableCell className="py-3 pe-4 text-left">
                  <ProductRowActions
                    product={product}
                    storefrontUrl={buildStoreUrl(storeSlug, `/products/${product.slug}`)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {products.map((product) => (
          <li key={product.id} className="relative flex items-start gap-3 p-4">
            <Thumb product={product} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Link
                    href={editHref(product.id)}
                    className="truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {product.name}
                  </Link>
                  <NameBadges product={product} />
                </div>
                <Price product={product} className="shrink-0 text-left" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {product.isActive ? (
                  <StatusPill tone="success">ظاهر</StatusPill>
                ) : (
                  <StatusPill tone="neutral">مخفي</StatusPill>
                )}
                <StockPill product={product} />
                <span>{product.categoryName}</span>
              </div>
            </div>
            <ProductRowActions product={product} storefrontUrl={buildStoreUrl(storeSlug, `/products/${product.slug}`)} />
          </li>
        ))}
      </ul>
    </>
  );
}
