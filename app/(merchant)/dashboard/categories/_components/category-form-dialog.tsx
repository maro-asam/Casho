"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Link2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { CreateCategoryAction, UpdateCategoryAction } from "@/actions/admin/categories.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <DialogContent dir={tdir()} className="sm:max-w-md">
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
        <form onSubmit={submit} className="min-w-0 space-y-5">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>{isEdit ? tr("تعديل التصنيف") : tr("تصنيف جديد")}</DialogTitle>
            <DialogDescription>
              {isEdit ? tr("الرابط في المتجر بيتغيّر لو غيّرت الاسم بس.") : tr("التصنيفات بتنظّم منتجاتك وبتسهّل على العميل يلاقي اللي عايزه.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category-name">{tr("الاسم")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
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
              className="h-10"
            />
            {error && (
              <p id="category-error" className="text-xs text-destructive">
                {error}
              </p>
            )}
            {isEdit && category && (
              <p className="text-xs text-muted-foreground">
                {tr("الرابط الحالي:")}{" "}
                <span className="font-mono" dir="ltr">
                  /categories/{category.slug}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {tr("الصورة")}{" "}<span className="text-xs font-normal text-muted-foreground">{tr("(اختياري)")}</span>
              </Label>
              {!image && (
                <div className="flex rounded-lg bg-muted p-0.5 text-xs" role="tablist" aria-label={tr("طريقة إضافة الصورة")}>
                  {(
                    [
                      ["upload", tr("رفع")],
                      ["link", tr("رابط")],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      onClick={() => setMode(value)}
                      className={cn(
                        "rounded-md px-2.5 py-1 font-medium transition-colors",
                        mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {image ? (
              <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{tr("صورة التصنيف")}</p>
                  <p className="truncate text-right text-xs text-muted-foreground" dir="ltr">
                    {imageSource(image)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setImage("")}
                  aria-label={tr("شيل الصورة")}
                  disabled={busy}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : mode === "upload" ? (
              <label
                htmlFor="category-image-upload"
                className={cn(
                  "flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-center transition-colors hover:bg-muted/60",
                  uploading && "pointer-events-none",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">{tr("بنرفع الصورة…")}</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{tr("اضغط لرفع صورة")}</span>
                    <span className="text-xs text-muted-foreground">{tr("PNG أو JPG أو WEBP — لحد ٥ ميجا")}</span>
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

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" disabled={busy} className="gap-1.5">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? tr("حفظ التعديلات") : tr("إضافة التصنيف")}
            </Button>
            <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
              {tr("إلغاء")}
            </Button>
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
        <Link2 className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
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
          className="h-10 ps-9"
        />
      </div>
      <Button type="button" variant="outline" disabled={!valid} onClick={() => onSubmit(value.trim())}>
        {tr("استخدام")}
      </Button>
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
