"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, ChevronDown, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import {
  GetReviewOrderOptionsAction,
  SaveReviewAction,
  type ReviewOrderOption,
} from "@/actions/products/reviews.actions";
import { appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { lazyIntl, lazyList, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type EditableReview = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  /** YYYY-MM-DD (Cairo) */
  reviewDate: string;
};

const NO_ORDER = "__none";
const RATING_LABELS = lazyList(["", "سيئ", "مش كويس", "مقبول", "كويس", "ممتاز"]);
const orderDate = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short" });
const cairoDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(d);

type Props = {
  mode: "new" | "edit" | null;
  review: EditableReview | null;
  products: { id: string; name: string }[];
  /** Preselected product (from the ?product= filter). */
  defaultProductId?: string;
};

/** URL-driven: `?new=1` adds, `?edit=<id>` edits. */
export function UrlReviewDialog({ mode, review, products, defaultProductId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = mode === "new" || (mode === "edit" && Boolean(review));

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent dir={tdir()} className="apple-ui apple-form max-h-[92dvh] gap-0 overflow-y-auto bg-background p-0 text-foreground sm:max-w-lg">
        {open && (
          <ReviewForm
            key={review?.id ?? "new"}
            review={mode === "edit" ? review : null}
            products={products}
            defaultProductId={defaultProductId}
            onDone={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  review,
  products,
  defaultProductId,
  onDone,
}: {
  review: EditableReview | null;
  products: { id: string; name: string }[];
  defaultProductId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [productId, setProductId] = useState(review?.productId ?? (products.some((p) => p.id === defaultProductId) ? defaultProductId! : ""));
  const [orders, setOrders] = useState<ReviewOrderOption[] | null>(null);
  const [orderId, setOrderId] = useState(NO_ORDER);
  const [removeVerified, setRemoveVerified] = useState(false);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(review?.customerName ?? "");
  const [title, setTitle] = useState(review?.title ?? "");
  const [content, setContent] = useState(review?.content ?? "");
  const [date, setDate] = useState(review?.reviewDate ?? cairoDay(new Date()));
  const [avatar, setAvatar] = useState(review?.customerAvatar ?? "");
  const [error, setError] = useState<string | null>(null);

  const alreadyVerified = Boolean(review?.verifiedPurchase) && !removeVerified;

  // Orders containing the chosen product — the source of the verified badge.
  useEffect(() => {
    if (!productId || alreadyVerified) return;
    let cancelled = false;
    GetReviewOrderOptionsAction(productId)
      .then((list) => !cancelled && setOrders(list))
      .catch(() => !cancelled && setOrders([]));
    return () => {
      cancelled = true;
    };
  }, [productId, alreadyVerified]);

  function pickOrder(id: string) {
    setOrderId(id);
    const order = orders?.find((o) => o.id === id);
    if (!order) return;
    setName(order.fullName.trim().split(/\s+/).slice(0, 2).join(" "));
    setDate(cairoDay(new Date(order.createdAt)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return setError(tr("اختار المنتج."));
    if (!rating) return setError(tr("اختار التقييم."));
    setError(null);
    startTransition(async () => {
      const result = await SaveReviewAction(review?.id ?? null, {
        productId,
        customerName: name,
        customerAvatar: avatar,
        rating,
        title,
        content,
        reviewDate: date,
        orderId: orderId === NO_ORDER ? null : orderId,
        removeVerified,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(review ? tr("اتحفظت المراجعة") : tr("اتضافت المراجعة"));
      onDone();
      router.refresh();
    });
  }

  const shown = hover || rating;

  const rowCls = "flex min-h-11 items-center gap-4 px-4";
  const inlineInput = "h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none placeholder:text-(--label-3)";

  return (
    <form onSubmit={submit} className="min-w-0">
      <DialogHeader className="items-center gap-1 px-6 pt-7 pb-5 text-center sm:text-center">
        <DialogTitle>{review ? tr("تعديل المراجعة") : tr("إضافة مراجعة")}</DialogTitle>
        <DialogDescription className="max-w-sm text-[13px]">
          {review ? review.productName : tr("سجّل رأي عميل حقيقي — مثلًا وصلك على الواتساب أو الإنستجرام.")}
        </DialogDescription>

        {/* Tap to rate — the App Store way. */}
        <div className="flex flex-col items-center gap-1 pt-4">
          <div className="flex gap-1" role="radiogroup" aria-label={tr("التقييم")} onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={tr("{0} نجوم", n)}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="apple-press rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star strokeWidth={0} className={cn("size-9 transition-colors", n <= shown ? "fill-(--sys-orange)" : "fill-(--sys-gray)/30")} />
              </button>
            ))}
          </div>
          <span className="h-5 text-[13px] font-medium text-muted-foreground">{shown ? RATING_LABELS[shown] : tr("اضغط على النجوم")}</span>
        </div>
      </DialogHeader>

      <div className="space-y-6 px-4 pb-5">
        {/* Product + verification */}
        {(!review || productId) && (
          <section className="space-y-2">
            <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
              {!review && (
                <div className={rowCls}>
                  <span className="shrink-0 text-[15px]">{tr("المنتج")}</span>
                  <Select
                    value={productId}
                    onValueChange={(v) => {
                      setProductId(v);
                      setOrders(null);
                      setOrderId(NO_ORDER);
                    }}
                    dir={tdir()}
                  >
                    <SelectTrigger className="h-11 min-w-0 flex-1 justify-end gap-1 border-0 bg-transparent px-0 text-[15px] text-muted-foreground shadow-none focus-visible:ring-0 dark:bg-transparent">
                      <SelectValue placeholder={tr("اختار منتج")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {productId &&
                (alreadyVerified ? (
                  <div className={rowCls}>
                    <span className="flex flex-1 items-center gap-2 text-[15px] text-(--sys-green)">
                      <BadgeCheck className="size-[18px]" />
                      {tr("مشتري موثق")}
                    </span>
                    <button type="button" onClick={() => setRemoveVerified(true)} className="text-[15px] text-(--sys-red)">
                      {tr("شيل العلامة")}
                    </button>
                  </div>
                ) : (
                  <div className={rowCls}>
                    <span className="shrink-0 text-[15px]">{tr("من طلب حقيقي؟")}</span>
                    <Select value={orderId} onValueChange={pickOrder} dir={tdir()} disabled={orders === null}>
                      <SelectTrigger className="h-11 min-w-0 flex-1 justify-end gap-1 border-0 bg-transparent px-0 text-[15px] text-muted-foreground shadow-none focus-visible:ring-0 dark:bg-transparent">
                        <SelectValue placeholder={orders === null ? tr("بنجيب الطلبات…") : tr("اختار")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ORDER}>{tr("لأ — من غير علامة \"مشتري موثق\"")}</SelectItem>
                        {orders?.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.fullName} · {orderDate.format(new Date(o.createdAt))}{" "}
                            <span className="font-mono text-muted-foreground" dir="ltr">
                              #{o.id.slice(0, 6)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </div>
            {productId && !alreadyVerified && (
              <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
                {orders && orders.length === 0
                  ? tr("مفيش طلبات للمنتج ده لسه، فالمراجعة هتظهر من غير علامة التوثيق.")
                  : tr("علامة \"مشتري موثق\" بتظهر بس للمراجعات المربوطة بطلب فعلي فيه المنتج — عشان العملاء يثقوا فيها.")}
              </p>
            )}
          </section>
        )}

        {/* Who & when */}
        <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
          <label htmlFor="review-name" className={rowCls}>
            <span className="shrink-0 text-[15px]">{tr("اسم العميل")}</span>
            <input id="review-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={tr("أحمد م.")} className={inlineInput} />
          </label>
          <label htmlFor="review-date" className={rowCls}>
            <span className="shrink-0 text-[15px]">{tr("التاريخ")}</span>
            <input
              id="review-date"
              type="date"
              value={date}
              max={cairoDay(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className={cn(inlineInput, "text-muted-foreground")}
            />
          </label>
          <label htmlFor="review-title" className={rowCls}>
            <span className="shrink-0 text-[15px]">{tr("العنوان")}</span>
            <input
              id="review-title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr("مثال: الخامة أحسن من الصور")}
              className={inlineInput}
            />
          </label>
        </div>

        {/* The review */}
        <section className="space-y-2">
          <div className="flex items-end justify-between px-4">
            <label htmlFor="review-content" className="text-[13px] font-semibold text-muted-foreground">
              {tr("المراجعة")}
            </label>
            <span className="text-[12px] text-muted-foreground tabular-nums">{content.trim().length}/2000</span>
          </div>
          <textarea
            id="review-content"
            rows={5}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={tr("كلام العميل زي ما قاله")}
            className="w-full resize-none rounded-[14px] bg-card px-4 py-3 text-[15px] leading-[22px] outline-none placeholder:text-(--label-3) focus-visible:ring-2 focus-visible:ring-ring"
          />
        </section>

        <details className="group overflow-hidden rounded-[14px] bg-card">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-[15px]">
            {tr("صورة العميل (اختياري)")}
            <ChevronDown className="size-4 text-(--label-3) transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t-[0.5px] border-border px-4">
            <input dir="ltr" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" aria-label={tr("صورة العميل (اختياري)")} className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-(--label-3)" />
          </div>
        </details>

        {error && <p className="px-4 text-[13px] text-(--sys-red)">{trv(error)}</p>}

        <div className="space-y-1">
          <button type="submit" disabled={pending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {review ? tr("حفظ التعديلات") : tr("إضافة المراجعة")}
          </button>
          <button type="button" onClick={onDone} disabled={pending} className="h-11 w-full rounded-full text-[15px] text-primary hover:bg-primary/8">
            {tr("إلغاء")}
          </button>
        </div>
      </div>
    </form>
  );
}
