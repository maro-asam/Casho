"use client";

import Image from "next/image";
import { Star, Package, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ReviewItem = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

type Spec = { label: string; value: string };

type ProductTabsProps = {
  description?: string | null;
  specs: Spec[];
  reviews: ReviewItem[];
  tabsStyle?: "default" | "bold" | "underline";
};

// ── Star display ──────────────────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "size-4" : "size-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            cls,
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted-foreground/20 text-muted-foreground/20",
          )}
        />
      ))}
    </div>
  );
}

// ── Rating bar ────────────────────────────────────────────────────────────────

function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        className="absolute inset-y-0 inset-s-0 rounded-full bg-amber-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Reviews section ───────────────────────────────────────────────────────────

function ReviewsSection({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <Star className="size-10 opacity-20" />
        <p className="text-sm">لا توجد تقييمات لهذا المنتج بعد</p>
      </div>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-10">
      {/* Summary */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-muted/40 px-6 py-5 sm:w-36">
          <p className="text-5xl font-extrabold leading-none">{avg.toFixed(1)}</p>
          <StarRow rating={Math.round(avg)} size="md" />
          <p className="text-xs text-muted-foreground">
            {reviews.length} مراجعة
          </p>
        </div>

        <div className="flex-1 space-y-2.5">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="w-4 text-right text-xs font-medium text-muted-foreground">
                {star}
              </span>
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
              <RatingBar count={count} total={reviews.length} />
              <span className="w-5 text-left text-xs text-muted-foreground">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-5">
        {reviews.map((review) => {
          const date = new Date(review.reviewDate).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <div
              key={review.id}
              className="rounded-2xl border border-border/50 bg-muted/20 p-5 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start gap-4">
                {review.customerAvatar ? (
                  <Image
                    src={review.customerAvatar}
                    alt={review.customerName}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: "var(--store-primary)",
                      color: "var(--store-primary-foreground)",
                      opacity: 0.85,
                    }}
                  >
                    {review.customerName.charAt(0).toUpperCase()}
                  </div>
                )}

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
                    <StarRow rating={review.rating} />
                  </div>

                  {review.title && (
                    <p className="mt-2 font-semibold">{review.title}</p>
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
    </div>
  );
}

// ── Shipping section ──────────────────────────────────────────────────────────

function ShippingSection() {
  const policies = [
    {
      icon: Truck,
      title: "الشحن والتوصيل",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      points: [
        "يتم شحن الطلبات خلال 1-3 أيام عمل من تأكيد الطلب.",
        "تتراوح مدة التوصيل بين 3-7 أيام عمل حسب موقعك.",
        "سيتم إرسال رابط تتبع الشحنة عبر رسالة نصية أو بريد إلكتروني.",
      ],
    },
    {
      icon: RotateCcw,
      title: "سياسة الإرجاع والاستبدال",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      points: [
        "يمكن إرجاع المنتج خلال 14 يومًا من تاريخ الاستلام.",
        "يجب أن يكون المنتج في حالته الأصلية وغير مستخدم.",
        "يتم استرداد المبلغ خلال 5-7 أيام عمل بعد استلام المنتج.",
      ],
    },
    {
      icon: ShieldCheck,
      title: "ضمان المنتج",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      points: [
        "جميع منتجاتنا مضمونة ضد عيوب الصناعة.",
        "للتواصل بخصوص الضمان، يرجى الاتصال بخدمة العملاء.",
        "نحن نضمن رضاك التام أو نسترد لك المبلغ.",
      ],
    },
    {
      icon: Package,
      title: "التغليف والحماية",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      points: [
        "يتم تغليف جميع المنتجات بعناية لضمان وصولها سليمة.",
        "نستخدم مواد تغليف صديقة للبيئة قدر الإمكان.",
      ],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {policies.map(({ icon: Icon, title, color, bg, points }) => (
        <div key={title} className={cn("rounded-2xl p-5", bg)}>
          <div className="mb-3 flex items-center gap-2.5">
            <div className={cn("rounded-full bg-white/60 p-1.5 dark:bg-black/20", color)}>
              <Icon className="size-4" />
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <ul className="space-y-1.5">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductTabs({
  description,
  specs,
  reviews,
  tabsStyle = "default",
}: ProductTabsProps) {
  const hasDescription = !!description?.trim();
  const hasSpecs = specs.length > 0;
  const defaultTab = hasDescription ? "description" : "reviews";

  const isBold = tabsStyle === "bold";
  const isUnderline = tabsStyle === "underline";

  return (
    <Tabs defaultValue={defaultTab} dir="rtl" className="w-full p-5">
      <div
        className={cn(
          "border-b",
          isBold && "border-black dark:border-white",
        )}
        style={{ borderColor: isBold ? undefined : "var(--store-border)" }}
      >
        <TabsList
          variant="line"
          className={cn(
            "h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0",
          )}
        >
          {hasDescription && (
            <TabsTrigger
              value="description"
              className={cn(
                "rounded-none border-0 px-5 py-3.5 text-sm font-medium transition-all",
                "data-[state=active]:border-b-2 data-[state=active]:bg-transparent",
                isBold
                  ? "font-bold uppercase tracking-widest text-xs data-[state=active]:border-black dark:data-[state=active]:border-white"
                  : "data-[state=active]:border-(--store-primary) data-[state=active]:text-(--store-primary)",
              )}
            >
              الوصف
            </TabsTrigger>
          )}
          {hasSpecs && (
            <TabsTrigger
              value="specs"
              className={cn(
                "rounded-none border-0 px-5 py-3.5 text-sm font-medium transition-all",
                "data-[state=active]:border-b-2 data-[state=active]:bg-transparent",
                isBold
                  ? "font-bold uppercase tracking-widest text-xs data-[state=active]:border-black dark:data-[state=active]:border-white"
                  : "data-[state=active]:border-(--store-primary) data-[state=active]:text-(--store-primary)",
              )}
            >
              المواصفات
            </TabsTrigger>
          )}
          <TabsTrigger
            value="reviews"
            className={cn(
              "rounded-none border-0 px-5 py-3.5 text-sm font-medium transition-all",
              "data-[state=active]:border-b-2 data-[state=active]:bg-transparent",
              isBold
                ? "font-bold uppercase tracking-widest text-xs data-[state=active]:border-black dark:data-[state=active]:border-white"
                : "data-[state=active]:border-(--store-primary) data-[state=active]:text-(--store-primary)",
            )}
          >
            التقييمات
            {reviews.length > 0 && (
              <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {reviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="shipping"
            className={cn(
              "rounded-none border-0 px-5 py-3.5 text-sm font-medium transition-all",
              "data-[state=active]:border-b-2 data-[state=active]:bg-transparent",
              isBold
                ? "font-bold uppercase tracking-widest text-xs data-[state=active]:border-black dark:data-[state=active]:border-white"
                : "data-[state=active]:border-(--store-primary) data-[state=active]:text-(--store-primary)",
            )}
          >
            الشحن والإرجاع
          </TabsTrigger>
        </TabsList>
      </div>

      {hasDescription && (
        <TabsContent value="description" className="mt-0 pt-8">
          <div className="prose prose-sm max-w-none leading-8 text-muted-foreground">
            {description}
          </div>
        </TabsContent>
      )}

      {hasSpecs && (
        <TabsContent value="specs" className="mt-0 pt-8">
          <dl className="divide-y divide-border/40">
            {specs.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3.5 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      )}

      <TabsContent value="reviews" className="mt-0 pt-8">
        <ReviewsSection reviews={reviews} />
      </TabsContent>

      <TabsContent value="shipping" className="mt-0 pt-8">
        <ShippingSection />
      </TabsContent>
    </Tabs>
  );
}
