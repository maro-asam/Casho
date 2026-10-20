"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { CreateCategoryAction, UpdateCategoryAction } from "@/actions/admin/categories.actions";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { imageSource, uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { tdir, tr } from "@/lib/i18n/dashboard";

export type EditableCategory = { id: string; name: string; slug: string; image: string | null };

const NAME_MAX = 60;

type CategoryFormDialogProps = {
  storeId: string;
  /** Present → edit mode. */
  category?: EditableCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

/** Add / edit a category in place — name + optional image (upload or link). */
export function CategoryFormDialog({ open, onOpenChange, ...props }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={tdir()} className="gap-0 rounded-[22px] p-5 sm:max-w-md">
        {/* Content unmounts on close, so each open starts from the record's current values. */}
        <CategoryForm key={props.category?.id ?? "new"} {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  storeId,
  category,
  onSaved,
  onDone,
}: Omit<CategoryFormDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const isEdit = Boolean(category);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [error, setError] = useState<string | null>(null);

  const busy = pending || uploading;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      setImage(await uploadImageToCloudinary(file, "casho/uploads/categories"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الصورة"));
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(tr("اكتب اسم التصنيف."));
      return;
    }
    startTransition(async () => {
      const result = category
        ? await UpdateCategoryAction(category.id, storeId, trimmed, image)
        : await CreateCategoryAction(storeId, trimmed, image);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(category ? tr("اتحفظت التعديلات") : tr("اتضاف تصنيف \"{0}\"", trimmed));
      onDone();
      onSaved?.();
    });
  }

  return (
        <form onSubmit={submit} className="apple-form min-w-0 space-y-5">
          <DialogHeader className="space-y-1 text-start sm:text-start">
            <DialogTitle className="text-[20px] leading-[25px] font-semibold">{isEdit ? tr("تعديل التصنيف") : tr("تصنيف جديد")}</DialogTitle>
            <DialogDescription className="text-[15px] leading-[21px]">
              {isEdit ? tr("الرابط في المتجر بيتغيّر لو غيّرت الاسم بس.") : tr("التصنيفات بتنظّم منتجاتك وبتسهّل على العميل يلاقي اللي عايزه.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="category-name" className="text-[13px] font-medium text-foreground/80">
                {tr("الاسم")}
              </label>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {name.trim().length}/{NAME_MAX}
              </span>
            </div>
            <Input
              id="category-name"
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={tr("مثال: ملابس رجالي")}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "category-error" : undefined}
            />
            {error && (
              <p id="category-error" role="alert" className="px-1 text-[12px] font-medium text-(--sys-red)">
                {error}
              </p>
            )}
            {isEdit && category && (
              <p className="px-1 text-[12px] text-muted-foreground">
                {tr("الرابط الحالي:")}{" "}
                <span className="font-mono" dir="ltr">
                  /categories/{category.slug}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-[13px] font-medium text-foreground/80">
                {tr("الصورة")}{" "}<span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
              </span>
              {!image && (
                <SegmentedButtons
                  role="tablist"
                  label={tr("طريقة إضافة الصورة")}
                  value={mode}
                  onChange={setMode}
                  options={[
                    ["upload", tr("رفع")],
                    ["link", tr("رابط")],
                  ]}
                />
              )}
            </div>

            {image ? (
              <div className="flex items-center gap-3 rounded-2xl bg-(--fill-3) p-2.5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">{tr("صورة التصنيف")}</p>
                  <p className="truncate text-right text-[12px] text-muted-foreground" dir="ltr">
                    {imageSource(image)}
                  </p>
                </div>
                <button
                  type="button"
                  className="apple-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-(--sys-red)/10 hover:text-(--sys-red) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  onClick={() => setImage("")}
                  aria-label={tr("شيل الصورة")}
                  disabled={busy}
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : mode === "upload" ? (
              <label
                htmlFor="category-image-upload"
                className={cn(
                  "flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-(--label-3)/60 bg-(--fill-3)/50 text-center transition-colors duration-200 ease-(--ease-apple) hover:bg-muted/60 focus-within:ring-2 focus-within:ring-primary/40",
                  uploading && "pointer-events-none",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-7 animate-spin text-primary" strokeWidth={1.6} />
                    <span className="text-[15px]">{tr("بنرفع الصورة…")}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-7 text-primary" strokeWidth={1.6} />
                    <span className="text-[15px] text-primary">{tr("اضغط لرفع صورة")}</span>
                    <span className="text-[12px] text-muted-foreground">{tr("PNG أو JPG أو WEBP — لحد ٥ ميجا")}</span>
                  </>
                )}
                <input
                  id="category-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onFile}
                  disabled={uploading}
                />
              </label>
            ) : (
              <LinkInput onSubmit={setImage} />
            )}
          </div>

          {/* Cancel leading, the confirming action trailing (HIG). */}
          <DialogFooter className="flex-row items-center justify-between gap-2 pt-1 sm:justify-between">
            <button type="button" className={cn(appleButton.plain, "mx-0 h-11 px-3")} onClick={onDone} disabled={busy}>
              {tr("إلغاء")}
            </button>
            <button type="submit" disabled={busy} className={appleButton.filled}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? tr("حفظ التعديلات") : tr("إضافة التصنيف")}
            </button>
          </DialogFooter>
        </form>
  );
}

function LinkInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  const valid = /^https?:\/\/\S+$/i.test(value.trim());

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Link2 className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-muted-foreground" />
        <Input
          type="url"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (valid) onSubmit(value.trim());
            }
          }}
          placeholder="https://…"
          className="ps-10"
        />
      </div>
      <button type="button" className={cn(appleButton.tinted, "h-11 text-primary")} disabled={!valid} onClick={() => onSubmit(value.trim())}>
        {tr("استخدام")}
      </button>
    </div>
  );
}

/**
 * Dialog driven by the URL: `?new=1` opens "add", `?edit=<id>` opens "edit".
 * Rows link to `?edit=` so every category is one shareable click away.
 */
export function UrlCategoryDialog({ storeId, mode, category }: { storeId: string; mode: "new" | "edit" | null; category: EditableCategory | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = mode === "new" || (mode === "edit" && Boolean(category));

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <CategoryFormDialog
      storeId={storeId}
      category={mode === "edit" ? category : null}
      open={open}
      onOpenChange={(next) => !next && close()}
    />
  );
}
