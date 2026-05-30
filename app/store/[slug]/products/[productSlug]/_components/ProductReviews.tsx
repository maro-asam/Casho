import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";

type Review = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

function StarDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls = { sm: "size-3.5", md: "size-4", lg: "size-5" }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted-foreground/20 text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        className="absolute inset-y-0 start-0 rounded-full bg-amber-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ReviewerAvatar({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        background: "var(--store-primary, #6366f1)",
        color: "var(--store-primary-foreground, #fff)",
        opacity: 0.85,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProductReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className="mt-16 border-t pt-12" dir="rtl">
      <h2 className="mb-8 text-xl font-bold tracking-tight sm:text-2xl">
        آراء العملاء
      </h2>

      {/* Summary */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Average score */}
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-32">
          <p className="text-5xl font-extrabold leading-none">{avg.toFixed(1)}</p>
          <StarDisplay rating={Math.round(avg)} size="md" />
          <p className="text-xs text-muted-foreground">
            بناءً على {reviews.length} مراجعة
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                {star}
              </span>
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <RatingBar count={count} total={reviews.length} />
              <span className="w-5 text-left text-xs text-muted-foreground">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.map((review) => {
          const date = new Date(review.reviewDate).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <div
              key={review.id}
              className="rounded-2xl border border-border/60 bg-muted/20 p-5"
            >
              <div className="flex items-start gap-4">
                <ReviewerAvatar
                  src={review.customerAvatar}
                  name={review.customerName}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{review.customerName}</span>
                    {review.verifiedPurchase && (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <ShieldCheck className="size-3" />
                        مشتري موثق
                      </span>
                    )}
                    <span className="ms-auto text-xs text-muted-foreground">
                      {date}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <StarDisplay rating={review.rating} size="sm" />
                  </div>

                  {review.title && (
                    <p className="mt-2 font-semibold text-foreground">
                      {review.title}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {review.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
