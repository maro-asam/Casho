"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Info, Link2, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { ONE_MB, compressImage, isCompressible } from "@/lib/image-compress";
import { tr } from "@/lib/i18n/dashboard";

/** Hard cap for a product image. Bigger photos are compressed on the device first. */
const MAX_IMAGE_MB = 1;

async function uploadToCloudinary(file: File) {
  return uploadImageToCloudinary(await compressImage(file, { maxBytes: MAX_IMAGE_MB * ONE_MB }), "casho/uploads/products", MAX_IMAGE_MB);
}

type Props = {
  initialImages?: string[];
  /** First image is the main one; reported so the preview can follow. */
  onChange?: (images: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

/**
 * All product images in one place. The first image is the main image (`image`),
 * the rest go to the gallery (`images`) — same fields the product action expects.
 */
export function MediaInput({ initialImages = [], onChange, onUploadingChange }: Props) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");

  function update(next: string[]) {
    setImages(next);
    onChange?.(next);
  }

  async function uploadFiles(files: File[]) {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    setUploadingCount((n) => n + valid.length);
    onUploadingChange?.(true);

    const results = await Promise.allSettled(valid.map(uploadToCloudinary));
    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");

    setImages((prev) => {
      const next = [...prev, ...urls];
      onChange?.(next);
      return next;
    });
    setUploadingCount((n) => {
      const left = n - valid.length;
      if (left === 0) onUploadingChange?.(false);
      return left;
    });

    const shrunk = valid.filter((f) => f.size > MAX_IMAGE_MB * ONE_MB && isCompressible(f)).length;
    if (urls.length) toast.success(urls.length === 1 ? tr("الصورة اترفعت") : tr("اترفعت {0} صور", urls.length));
    if (urls.length && shrunk) toast.info(tr("صغّرنا {0} صورة لأقل من 1 ميجا قبل الرفع", shrunk));
    if (failed) toast.error(failed.reason instanceof Error ? failed.reason.message : tr("صورة أو أكتر مترفعتش"));
  }

  function addUrl() {
    const trimmed = url.trim();
    if (!/^https?:\/\//.test(trimmed)) {
      toast.error(tr("اكتب لينك صورة يبدأ بـ https://"));
      return;
    }
    update([...images, trimmed]);
    setUrl("");
    setUrlOpen(false);
  }

  const makeMain = (i: number) => update([images[i], ...images.filter((_, j) => j !== i)]);
  const remove = (i: number) => update(images.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "grid grid-cols-3 gap-2 sm:grid-cols-4",
          images.length === 0 && uploadingCount === 0 && "block",
        )}
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-muted",
              i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
            )}
          >
            <Image src={src} alt={i === 0 ? tr("الصورة الأساسية") : tr("صورة {0}", i + 1)} fill sizes="200px" className="object-cover" unoptimized />
            {i === 0 && (
              <span className="absolute inset-s-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[12px] font-medium text-white backdrop-blur-md">
                {tr("الأساسية")}
              </span>
            )}
            <div className="absolute inset-e-1.5 top-1.5 flex gap-1">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => makeMain(i)}
                  aria-label={tr("خليها الصورة الأساسية")}
                  title={tr("خليها الأساسية")}
                  className="apple-press grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={tr("شيل الصورة")}
                className="apple-press grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-(--sys-red)"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="grid aspect-square place-items-center rounded-xl bg-background"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition-colors duration-200 ease-(--ease-apple) focus-within:ring-2 focus-within:ring-primary/40",
            images.length === 0 && uploadingCount === 0 ? "min-h-44 px-6 py-8" : "aspect-square",
            dragging ? "border-primary bg-primary/8" : "border-(--label-3)/60 bg-background hover:bg-muted/60",
          )}
        >
          <ImagePlus className="size-7 text-primary" strokeWidth={1.6} />
          <span className="text-[15px] text-primary">
            {images.length === 0 ? tr("اسحب الصور هنا أو دوس للاختيار") : tr("ضيف صور")}
          </span>
          {images.length === 0 && (
            <span className="text-[12px] text-muted-foreground">{tr("PNG أو JPG أو WEBP · أقصى حجم 1 ميجا للصورة")}</span>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              uploadFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <p className="flex items-start gap-1.5 text-[12px] leading-4 text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        <span>
          {tr("أقصى حجم للصورة 1 ميجا — الأكبر بنضغطها تلقائيًا قبل الرفع. صور GIF لازم تكون أقل من 1 ميجا.")}{" "}
          <Link href="/image-compressor" target="_blank" className="text-primary hover:underline">
            {tr("صغّر صورك من هنا")}
          </Link>
        </span>
      </p>

      {urlOpen ? (
        <div className="flex gap-2">
          <Input
            type="url"
            dir="ltr"
            value={url}
            autoFocus
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://example.com/image.jpg"
          />
          <button type="button" className={cn(appleButton.tinted, "h-11 text-primary")} onClick={addUrl}>
            {tr("إضافة")}
          </button>
          <button type="button" className={cn(appleButton.plain, "mx-0 h-11")} onClick={() => setUrlOpen(false)}>
            {tr("إلغاء")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setUrlOpen(true)}
          className={cn(appleButton.plain, "mx-0 -ms-2 h-8 text-[13px]")}
        >
          <Link2 className="size-4" />
          {tr("أو ضيف صورة من لينك")}
        </button>
      )}

      <input type="hidden" name="image" value={images[0] ?? ""} />
      <input type="hidden" name="images" value={images.slice(1).join(", ")} />
    </div>
  );
}
