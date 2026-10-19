"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import {
  GetReviewOrderOptionsAction,
  SaveReviewAction,
  type ReviewOrderOption,
} from "@/actions/products/reviews.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { lazyIntl, lazyList, tdir, tr } from "@/lib/i18n/dashboard";

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
      <DialogContent dir={tdir()} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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

  return (
    <form onSubmit={submit} className="min-w-0 space-y-5">
      <DialogHeader className="text-start sm:text-start">
        <DialogTitle>{review ? tr("تعديل المراجعة") : tr("إضافة مراجعة")}</DialogTitle>
        <DialogDescription>
          {review ? review.productName : tr("سجّل رأي عميل حقيقي — مثلًا وصلك على الواتساب أو الإنستجرام.")}
        </DialogDescription>
      </DialogHeader>

      {!review && (
        <div className="space-y-2">
          <Label>{tr("المنتج")}</Label>
          <Select
            value={productId}
            onValueChange={(v) => {
              setProductId(v);
              setOrders(null);
              setOrderId(NO_ORDER);
            }}
            dir={tdir()}
          >
            <SelectTrigger className="w-full">
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

      {/* Verified purchase — only from a real order */}
      {productId &&
        (alreadyVerified ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <span className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="size-4" />
              {tr("مشتري موثق")}
            </span>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setRemoveVerified(true)}>
              {tr("شيل العلامة")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{tr("من طلب حقيقي؟")}</Label>
            <Select value={orderId} onValueChange={pickOrder} dir={tdir()} disabled={orders === null}>
              <SelectTrigger className="w-full">
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
            <p className="text-xs text-muted-foreground">
              {orders && orders.length === 0
                ? tr("مفيش طلبات للمنتج ده لسه، فالمراجعة هتظهر من غير علامة التوثيق.")
                : tr("علامة \"مشتري موثق\" بتظهر بس للمراجعات المربوطة بطلب فعلي فيه المنتج — عشان العملاء يثقوا فيها.")}
            </p>
          </div>
        ))}

      <div className="space-y-2">
        <Label>{tr("التقييم")}</Label>
        <div className="flex items-center gap-3">
          <div className="flex" role="radiogroup" aria-label={tr("التقييم")} onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={tr("{0} نجوم", n)}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-0.5"
              >
                <Star className={cn("size-7 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{RATING_LABELS[shown]}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="review-name">{tr("اسم العميل")}</Label>
          <Input id="review-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={tr("أحمد م.")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-date">{tr("التاريخ")}</Label>
          <Input id="review-date" type="date" value={date} max={cairoDay(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">
          {tr("العنوان")}{" "}<span className="text-xs font-normal text-muted-foreground">{tr("(اختياري)")}</span>
        </Label>
        <Input id="review-title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder={tr("مثال: الخامة أحسن من الصور")} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="review-content">{tr("المراجعة")}</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{content.trim().length}/2000</span>
        </div>
        <Textarea
          id="review-content"
          rows={4}
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="resize-none"
          placeholder={tr("كلام العميل زي ما قاله")}
        />
      </div>

      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs text-muted-foreground">{tr("صورة العميل (اختياري)")}</summary>
        <div className="border-t border-border p-3">
          <Input dir="ltr" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </div>
      </details>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {review ? tr("حفظ التعديلات") : tr("إضافة المراجعة")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {tr("إلغاء")}
        </Button>
      </DialogFooter>
    </form>
  );
}
