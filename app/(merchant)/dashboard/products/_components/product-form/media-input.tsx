"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("رفع الصور مش متاح دلوقتي، ضيف لينك الصورة بدل كده.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", "casho/uploads/products");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "مقدرناش نرفع الصورة");
  return data.secure_url as string;
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

    if (urls.length) toast.success(urls.length === 1 ? "الصورة اترفعت" : `اترفعت ${urls.length} صور`);
    if (failed) toast.error(failed.reason instanceof Error ? failed.reason.message : "صورة أو أكتر مترفعتش");
  }

  function addUrl() {
    const trimmed = url.trim();
    if (!/^https?:\/\//.test(trimmed)) {
      toast.error("اكتب لينك صورة يبدأ بـ https://");
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
              "group relative overflow-hidden rounded-lg border border-border bg-muted",
              i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
            )}
          >
            <Image src={src} alt={i === 0 ? "الصورة الأساسية" : `صورة ${i + 1}`} fill sizes="200px" className="object-cover" unoptimized />
            {i === 0 && (
              <span className="absolute inset-s-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium shadow-sm">
                الأساسية
              </span>
            )}
            <div className="absolute inset-e-1.5 top-1.5 flex gap-1">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => makeMain(i)}
                  aria-label="خليها الصورة الأساسية"
                  title="خليها الأساسية"
                  className="grid size-7 place-items-center rounded-md bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="شيل الصورة"
                className="grid size-7 place-items-center rounded-md bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`uploading-${i}`}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-border bg-muted/40"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-center transition-colors",
            images.length === 0 && uploadingCount === 0 ? "min-h-40 px-6 py-8" : "aspect-square",
            dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
          )}
        >
          <ImagePlus className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {images.length === 0 ? "اسحب الصور هنا أو دوس للاختيار" : "ضيف صور"}
          </span>
          {images.length === 0 && (
            <span className="text-xs text-muted-foreground">PNG أو JPG أو WEBP · أول صورة هتبقى الأساسية</span>
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
            className="h-9"
          />
          <Button type="button" variant="outline" className="h-9" onClick={addUrl}>
            إضافة
          </Button>
          <Button type="button" variant="ghost" className="h-9" onClick={() => setUrlOpen(false)}>
            إلغاء
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setUrlOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Link2 className="size-4" />
          أو ضيف صورة من لينك
        </button>
      )}

      <input type="hidden" name="image" value={images[0] ?? ""} />
      <input type="hidden" name="images" value={images.slice(1).join(", ")} />
    </div>
  );
}
