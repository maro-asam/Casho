"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit, Loader2, Plus, Star, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  CreateReviewAction,
  UpdateReviewAction,
  type ReviewFormState,
} from "@/actions/products/reviews.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Product = { id: string; name: string };

type Review = {
  id: string;
  productId: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

type Props =
  | { mode: "create"; products: Product[]; review?: undefined }
  | { mode: "edit"; products: Product[]; review: Review };

const initialState: ReviewFormState = { success: false, message: "" };

function StarRatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function formatDateValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function ReviewFormDialog({ mode, products, review }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [verifiedPurchase, setVerifiedPurchase] = useState(
    review?.verifiedPurchase ?? false,
  );
  const [selectedProduct, setSelectedProduct] = useState(
    review?.productId ?? "",
  );

  const action =
    mode === "edit"
      ? UpdateReviewAction.bind(null, review.id)
      : CreateReviewAction;

  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      if (!state.warnings?.length) {
        // Defer close to avoid calling setState synchronously inside effect
        const id = setTimeout(() => setOpen(false), 0);
        return () => clearTimeout(id);
      }
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setRating(review?.rating ?? 5);
      setVerifiedPurchase(review?.verifiedPurchase ?? false);
      setSelectedProduct(review?.productId ?? "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg"
          >
            <Edit className="size-3.5" />
            تعديل
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl">
            <Plus className="size-4" />
            إضافة مراجعة
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "تعديل المراجعة" : "إضافة مراجعة جديدة"}
          </DialogTitle>
        </DialogHeader>

        {/* Anti-abuse warnings */}
        {state.success && state.warnings && state.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4 shrink-0" />
              <p className="text-sm font-semibold">تحذيرات المصداقية</p>
            </div>
            <ul className="space-y-1">
              {state.warnings.map((w, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-700 dark:text-amber-400"
                >
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          {/* Hidden fields */}
          <input type="hidden" name="rating" value={rating} />
          <input
            type="hidden"
            name="verifiedPurchase"
            value={String(verifiedPurchase)}
          />

          {/* Product selector — create mode only */}
          {mode === "create" && (
            <Field>
              <FieldLabel>
                المنتج <span className="text-destructive">*</span>
              </FieldLabel>
              <input type="hidden" name="productId" value={selectedProduct} />
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر منتجاً..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Rating */}
          <Field>
            <FieldLabel>
              التقييم <span className="text-destructive">*</span>
            </FieldLabel>
            <StarRatingPicker value={rating} onChange={setRating} />
          </Field>

          {/* Customer name */}
          <Field>
            <FieldLabel>
              اسم العميل <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              name="customerName"
              placeholder="مثال: أحمد محمد"
              defaultValue={review?.customerName}
              maxLength={60}
              className="rounded-xl"
            />
          </Field>

          {/* Customer avatar */}
          <Field>
            <FieldLabel>رابط صورة العميل (اختياري)</FieldLabel>
            <Input
              name="customerAvatar"
              placeholder="https://..."
              defaultValue={review?.customerAvatar ?? ""}
              className="rounded-xl"
            />
            <FieldDescription>رابط URL لصورة بروفايل العميل</FieldDescription>
          </Field>

          {/* Review title */}
          <Field>
            <FieldLabel>عنوان المراجعة (اختياري)</FieldLabel>
            <Input
              name="title"
              placeholder="مثال: منتج رائع جداً"
              defaultValue={review?.title ?? ""}
              maxLength={100}
              className="rounded-xl"
            />
          </Field>

          {/* Review content */}
          <Field>
            <FieldLabel>
              نص المراجعة <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              name="content"
              placeholder="اكتب مراجعة تفصيلية عن المنتج (20 حرف على الأقل)..."
              defaultValue={review?.content}
              maxLength={2000}
              rows={4}
              className="rounded-xl resize-none"
            />
            <FieldDescription>من 20 إلى 2000 حرف</FieldDescription>
          </Field>

          {/* Review date */}
          <Field>
            <FieldLabel>تاريخ المراجعة</FieldLabel>
            <Input
              name="reviewDate"
              type="date"
              defaultValue={
                review?.reviewDate
                  ? formatDateValue(new Date(review.reviewDate))
                  : formatDateValue(new Date())
              }
              className="rounded-xl"
            />
          </Field>

          {/* Verified purchase */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">مشتري موثق</p>
              <p className="text-xs text-muted-foreground">
                تظهر علامة &quot;تم الشراء بالفعل&quot; على المراجعة
              </p>
            </div>
            <Switch
              checked={verifiedPurchase}
              onCheckedChange={setVerifiedPurchase}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending || (mode === "create" && !selectedProduct)}
              className="flex-1 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-1.5 size-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : mode === "edit" ? (
                "حفظ التعديلات"
              ) : (
                "إضافة المراجعة"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
