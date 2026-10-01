import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ImageIcon } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { ReviewRowActions } from "./review-row-actions";
import { Stars } from "./stars";

export type ReviewRow = {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
  product: { id: string; name: string; slug: string; image: string | null };
};

const dateFormat = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

type Props = {
  reviews: ReviewRow[];
  storeSlug: string;
  editHref: (id: string) => string;
};

function Verified() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
      <BadgeCheck className="size-3.5" />
      مشتري موثق
    </span>
  );
}

function ProductCell({ product }: { product: ReviewRow["product"] }) {
  return (
    <Link href={`/reviews?product=${product.id}`} className="relative z-10 flex min-w-0 items-center gap-2 hover:underline">
      <span className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {product.image ? (
          <Image src={product.image} alt="" fill sizes="32px" className="object-cover" />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto size-3.5 text-muted-foreground/60" />
        )}
      </span>
      <span className="max-w-40 truncate text-sm">{product.name}</span>
    </Link>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function ReviewsTable({ reviews, storeSlug, editHref }: Props) {
  const actionsFor = (r: ReviewRow) => (
    <ReviewRowActions
      reviewId={r.id}
      customerName={r.customerName}
      editHref={editHref(r.id)}
      productUrl={buildStoreUrl(storeSlug, `/products/${r.product.slug}`)}
    />
  );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">المراجعة</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">المنتج</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">العميل</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground xl:table-cell">التاريخ</TableHead>
              <TableHead className="h-10 w-12 pe-4">
                <span className="sr-only">إجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r) => (
              // The edit link stretches over the row; product link + menu sit above it (z-10).
              <TableRow key={r.id} className="relative align-top">
                <TableCell className="max-w-md py-3 ps-4 whitespace-normal">
                  <Stars rating={r.rating} />
                  <Link
                    href={editHref(r.id)}
                    scroll={false}
                    className="mt-1 block text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                  >
                    {r.title || <span className="text-muted-foreground">بدون عنوان</span>}
                  </Link>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{r.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground lg:hidden">
                    {r.customerName} · {dateFormat.format(r.reviewDate)}
                  </p>
                </TableCell>
                <TableCell className="py-3">
                  <ProductCell product={r.product} />
                </TableCell>
                <TableCell className="hidden py-3 lg:table-cell">
                  <p className="max-w-36 truncate text-sm">{r.customerName}</p>
                  {r.verifiedPurchase && <Verified />}
                </TableCell>
                <TableCell className="hidden py-3 text-sm text-muted-foreground xl:table-cell">{dateFormat.format(r.reviewDate)}</TableCell>
                <TableCell className="py-3 pe-4 text-left">{actionsFor(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {reviews.map((r) => (
          <li key={r.id} className="relative space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <Stars rating={r.rating} />
                <Link href={editHref(r.id)} scroll={false} className="block truncate text-sm font-medium after:absolute after:inset-0">
                  {r.title || r.customerName}
                </Link>
              </div>
              {actionsFor(r)}
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{r.content}</p>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {r.customerName} · {r.product.name}
              </span>
              {r.verifiedPurchase ? <Verified /> : <span className="shrink-0">{dateFormat.format(r.reviewDate)}</span>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
