"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ImageIcon, Link2, Loader2, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";

import { CreateBannerAction, UpdateBannerAction } from "@/actions/admin/banner.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { imageSource, uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";

export type EditableBanner = { id: string; title: string; image: string; isActive: boolean };

const TITLE_MAX = 80;
const UPLOAD_FOLDER = "casho/uploads/banners";

type BannerFormDialogProps = {
  storeId: string;
  /** Present → edit mode. */
  banner?: EditableBanner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Add / edit a banner in place — title, image (upload or link), visibility. */
export function BannerFormDialog({ open, onOpenChange, ...props }: BannerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        {/* Content unmounts on close, so each open starts from the record's current values. */}
        <BannerForm key={props.banner?.id ?? "new"} {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function BannerForm({
  storeId,
  banner,
  onDone,
}: Omit<BannerFormDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const isEdit = Boolean(banner);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(banner?.title ?? "");
  const [image, setImage] = useState(banner?.image ?? "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [error, setError] = useState<{ field: "title" | "image"; message: string } | null>(null);

  const busy = pending || uploading;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      setImage(await uploadImageToCloudinary(file, UPLOAD_FOLDER));
      setError(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return setError({ field: "title", message: "اكتب عنوان البانر." });
    if (!image) return setError({ field: "image", message: "ضيف صورة للبانر." });

    startTransition(async () => {
      const input = { title: trimmed, image, isActive };
      const result = banner ? await UpdateBannerAction(banner.id, storeId, input) : await CreateBannerAction(storeId, input);
      if (!result.ok) {
        setError({ field: result.message.includes("صورة") ? "image" : "title", message: result.message });
        return;
      }
      toast.success(banner ? "اتحفظت التعديلات" : `اتضاف بانر "${trimmed}"`);
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="min-w-0 space-y-5">
      <DialogHeader className="text-right sm:text-right">
        <DialogTitle>{isEdit ? "تعديل البانر" : "بانر جديد"}</DialogTitle>
        <DialogDescription>البانرز بتظهر أعلى الصفحة الرئيسية لمتجرك — استخدمها للعروض والإعلانات.</DialogDescription>
      </DialogHeader>

      {/* Image first — it's what the customer actually sees. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>الصورة</Label>
          {!image && (
            <div className="flex rounded-lg bg-muted p-0.5 text-xs" role="tablist" aria-label="طريقة إضافة الصورة">
              {(
                [
                  ["upload", "رفع"],
                  ["link", "رابط"],
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
          <div className="space-y-2">
            <div className="relative aspect-3/1 w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image src={image} alt="" fill sizes="512px" className="object-cover" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted-foreground" dir="ltr">
                {imageSource(image)}
              </p>
              <div className="flex shrink-0 gap-1">
                <Button asChild type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={busy}>
                  <label htmlFor="banner-image-upload" className="cursor-pointer">
                    {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    تغيير
                  </label>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setImage("")}
                  disabled={busy}
                >
                  شيل
                </Button>
              </div>
            </div>
          </div>
        ) : mode === "upload" ? (
          <label
            htmlFor="banner-image-upload"
            className={cn(
              "flex aspect-3/1 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-center transition-colors hover:bg-muted/60",
              error?.field === "image" && "border-destructive",
              uploading && "pointer-events-none",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm font-medium">بنرفع الصورة…</span>
              </>
            ) : (
              <>
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium">اضغط لرفع صورة</span>
                <span className="text-xs text-muted-foreground">
                  أفضل مقاس{" "}
                  <span className="font-mono" dir="ltr">
                    1200×400
                  </span>{" "}
                  — لحد ٥ ميجا
                </span>
              </>
            )}
          </label>
        ) : (
          <LinkInput
            invalid={error?.field === "image"}
            onSubmit={(url) => {
              setImage(url);
              setError(null);
            }}
          />
        )}
        <input
          id="banner-image-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFile}
          disabled={uploading}
        />
        {error?.field === "image" && <p className="text-xs text-destructive">{error.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-title">العنوان</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {title.trim().length}/{TITLE_MAX}
          </span>
        </div>
        <Input
          id="banner-title"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="مثال: خصم ٢٠٪ على الصيفي"
          aria-invalid={error?.field === "title" || undefined}
          className="h-10"
        />
        {error?.field === "title" ? (
          <p className="text-xs text-destructive">{error.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">بيظهر كنص بديل للصورة وبيساعدك تفرّق بين البانرز.</p>
        )}
      </div>

      <label
        htmlFor="banner-active"
        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3"
      >
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">ظاهر في المتجر</span>
          <span className="block text-xs text-muted-foreground">لو قفلته، البانر يفضل محفوظ بس العملاء مش هيشوفوه.</span>
        </span>
        <Switch id="banner-active" checked={isActive} onCheckedChange={setIsActive} disabled={busy} />
      </label>

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={busy} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "حفظ التعديلات" : "إضافة البانر"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
          إلغاء
        </Button>
      </DialogFooter>
    </form>
  );
}

function LinkInput({ onSubmit, invalid }: { onSubmit: (url: string) => void; invalid?: boolean }) {
  const [value, setValue] = useState("");
  const valid = /^https?:\/\/\S+$/i.test(value.trim());

  return (
    <div className="space-y-2">
      <div className="flex aspect-3/1 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
        <ImageIcon className="size-6 text-muted-foreground/60" />
      </div>
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
            aria-invalid={invalid || undefined}
            className="h-10 ps-9"
          />
        </div>
        <Button type="button" variant="outline" disabled={!valid} onClick={() => onSubmit(value.trim())}>
          استخدام
        </Button>
      </div>
    </div>
  );
}

/** Dialog driven by the URL: `?new=1` opens "add", `?edit=<id>` opens "edit". */
export function UrlBannerDialog({
  storeId,
  mode,
  banner,
}: {
  storeId: string;
  mode: "new" | "edit" | null;
  banner: EditableBanner | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = mode === "new" || (mode === "edit" && Boolean(banner));

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <BannerFormDialog
      storeId={storeId}
      banner={mode === "edit" ? banner : null}
      open={open}
      onOpenChange={(next) => !next && close()}
    />
  );
}
