import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Layers, Star } from "lucide-react";

import { StatusText, Tag } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "./product-filters";
import { ProductRowActions } from "./product-row-actions";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

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
  isDigital: boolean;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  type: string;
  categoryName: string;
  soldCount: number;
};

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = lazyIntl.number();

const editHref = (id: string) => `/products/${id}/edit`;

function Thumb({ product }: { product: ProductRow }) {
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-muted">
      {product.image ? (
        <Image src={product.image} alt="" fill sizes="44px" className="object-cover" />
      ) : (
        <ImageIcon className="absolute inset-0 m-auto size-[18px] text-(--label-3)" strokeWidth={1.6} />
      )}
    </div>
  );
}

/** Plain count when healthy; a tinted capsule only when stock needs attention. */
function Stock({ product }: { product: ProductRow }) {
  if (product.isDigital) return <Tag tone="accent">{tr("رقمي")}</Tag>;
  if (product.stock <= 0) return <Tag tone="danger">{tr("نفد")}</Tag>;
  if (product.stock <= (product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)) {
    return <Tag tone="warning">{tr("{0} · قليل", nf.format(product.stock))}</Tag>;
  }
  return <span className="text-[15px] tabular-nums">{tr("{0} قطعة", nf.format(product.stock))}</span>;
}

function Visibility({ product }: { product: ProductRow }) {
  return product.isActive ? (
    <StatusText tone="success">{tr("ظاهر")}</StatusText>
  ) : (
    <StatusText tone="neutral">{tr("مخفي")}</StatusText>
  );
}

function Price({ product, className }: { product: ProductRow; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[15px] font-semibold tabular-nums">{money.format(product.price)}</p>
      {product.compareAtPrice && product.compareAtPrice > product.price && (
        <p className="text-[13px] text-muted-foreground line-through tabular-nums">{money.format(product.compareAtPrice)}</p>
      )}
    </div>
  );
}

function NameBadges({ product }: { product: ProductRow }) {
  return (
    <>
      {product.isFeatured && (
        <Star aria-label={tr("منتج مميز")} className="size-3.5 shrink-0 fill-(--sys-orange) text-(--sys-orange)" />
      )}
      {product.type === "BUNDLE" && (
        <Layers aria-label={tr("باقة منتجات")} className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
      )}
    </>
  );
}

const th = "h-9 px-3 pb-2 text-start align-bottom text-[12px] font-medium whitespace-nowrap text-muted-foreground";
const td = "relative px-3 py-3 align-middle";

/** Desktop: list-view table. Mobile: grouped rows — same data, same row link. */
export function ProductsTable({ products, storeSlug }: { products: ProductRow[]; storeSlug: string }) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={`${th} ps-5`}>{tr("المنتج")}</th>
              <th className={`${th} hidden lg:table-cell`}>{tr("التصنيف")}</th>
              <th className={th}>{tr("الحالة")}</th>
              <th className={th}>{tr("المخزون")}</th>
              <th className={`${th} hidden xl:table-cell`}>{tr("اتباع")}</th>
              <th className={`${th} text-end`}>{tr("السعر")}</th>
              <th className="w-14 pe-4">
                <span className="sr-only">{tr("إجراءات")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              // The edit link stretches over the whole row; the actions menu sits above it (z-10).
              <tr
                key={product.id}
                className="relative transition-colors hover:bg-muted/50 has-focus-visible:bg-muted/50 [&>td]:border-t-[0.5px] [&>td]:border-border"
              >
                <td className={`${td} ps-5`}>
                  <div className="flex items-center gap-3">
                    <Thumb product={product} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={editHref(product.id)}
                          className="max-w-64 truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                        >
                          {product.name}
                        </Link>
                        <NameBadges product={product} />
                      </div>
                      <p className="truncate text-[13px] text-muted-foreground" dir="ltr">
                        {product.sku ? `SKU ${product.sku}` : `/${product.slug}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`${td} hidden text-[15px] text-muted-foreground lg:table-cell`}>{product.categoryName}</td>
                <td className={td}>
                  <Visibility product={product} />
                </td>
                <td className={td}>
                  <Stock product={product} />
                </td>
                <td className={`${td} hidden text-[15px] tabular-nums text-muted-foreground xl:table-cell`}>
                  {nf.format(product.soldCount)}
                </td>
                <td className={`${td} text-end`}>
                  <Price product={product} />
                </td>
                <td className={`${td} pe-4 text-end`}>
                  <ProductRowActions product={product} storefrontUrl={buildStoreUrl(storeSlug, `/products/${product.slug}`)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="apple-rows [--row-inset:72px] md:hidden">
        {products.map((product) => (
          <li key={product.id} className="relative flex items-start gap-3 px-4 py-3">
            <Thumb product={product} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Link
                    href={editHref(product.id)}
                    className="truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {product.name}
                  </Link>
                  <NameBadges product={product} />
                </div>
                <Price product={product} className="shrink-0 text-end" />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
                <Visibility product={product} />
                <Stock product={product} />
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
