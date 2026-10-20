import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ImageIcon } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { ReviewRowActions } from "./review-row-actions";
import { Stars } from "./stars";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

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

const dateFormat = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

type Props = {
  reviews: ReviewRow[];
  storeSlug: string;
  editHref: (id: string) => string;
};

/** App Store–style review cards: title, stars · date · name, the review, then its product. */
export function ReviewsTable({ reviews, storeSlug, editHref }: Props) {
  return (
    <ul className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
      {reviews.map((r) => (
        // The edit link stretches over the card; product link + menu sit above it (z-10).
        <li key={r.id} className="relative flex flex-col rounded-[16px] bg-(--fill-3)/55 p-4 transition-colors hover:bg-(--fill-3)/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link
                href={editHref(r.id)}
                scroll={false}
                className="block truncate text-[17px] leading-[22px] font-semibold after:absolute after:inset-0 after:rounded-[16px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {r.title || <span className="text-muted-foreground">{tr("بدون عنوان")}</span>}
              </Link>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
                <Stars rating={r.rating} />
                <span>{dateFormat.format(r.reviewDate)}</span>
                <span aria-hidden>·</span>
                <span className="max-w-40 truncate">{r.customerName}</span>
              </p>
            </div>
            <ReviewRowActions
              reviewId={r.id}
              customerName={r.customerName}
              editHref={editHref(r.id)}
              productUrl={buildStoreUrl(storeSlug, `/products/${r.product.slug}`)}
            />
          </div>

          <p className="mt-2.5 line-clamp-4 flex-1 text-[15px] leading-[22px] text-foreground/85">{r.content}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Link
              href={`/reviews?product=${r.product.id}`}
              className="relative z-10 flex min-w-0 items-center gap-2 rounded-full py-0.5 pe-2 text-[13px] text-muted-foreground hover:text-foreground"
            >
              <span className="relative size-6 shrink-0 overflow-hidden rounded-[6px] bg-card">
                {r.product.image ? (
                  <Image src={r.product.image} alt="" fill sizes="24px" className="object-cover" />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto size-3 text-muted-foreground/60" />
                )}
              </span>
              <span className="truncate">{r.product.name}</span>
            </Link>
            {r.verifiedPurchase && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-(--sys-green)">
                <BadgeCheck className="size-3.5" />
                {tr("مشتري موثق")}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
