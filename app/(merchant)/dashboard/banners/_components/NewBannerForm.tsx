"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Upload,
  Loader2,
  ImageIcon,
  Link2,
  ArrowRight,
  LayoutPanelTop,
} from "lucide-react";
import { toast } from "sonner";

import { CreateBannerAction } from "@/actions/admin/banner.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type NewBannerFormProps = {
  storeId: string;
};

export default function NewBannerForm({ storeId }: NewBannerFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">(
    "link",
  );
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const isDisabled = useMemo(
    () => !title.trim() || !image.trim() || isPending || isUploadingImage,
    [title, image, isPending, isUploadingImage],
  );

  const previewImage = useMemo(() => image.trim(), [image]);

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary envs are missing. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "casho/uploads/banners");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || "فشل رفع الصورة");
    }

    return data.secure_url as string;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const url = await uploadToCloudinary(file);
      setImage(url);
      toast.success("تم رفع صورة البانر بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return toast.error("اسم البانر مطلوب");
    if (!image.trim()) return toast.error("صورة البانر مطلوبة");

    startTransition(async () => {
      try {
        await CreateBannerAction(storeId, title.trim(), image.trim());
        toast.success("تم إنشاء البانر بنجاح");
        router.push("/banners");
        router.refresh();
      } catch {
        toast.error("حدث خطأ أثناء إنشاء البانر");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: fields ── */}
        <div className="space-y-5 lg:col-span-3">
          {/* Banner name */}
          <Card className="rounded-xl shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div>
                <h2 className="font-semibold">بيانات البانر</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  اسم البانر وصورة العرض التي ستظهر داخل المتجر.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="title">اسم البانر</Label>
                <Input
                  id="title"
                  placeholder="مثال: تخفيضات الصيف"
                  className="rounded-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card className="rounded-xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="font-semibold">صورة البانر</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  يفضّل صورة أفقية بجودة جيدة لأفضل عرض داخل المتجر.
                </p>
              </div>

              <Separator />

              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageInputMode("link")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    imageInputMode === "link"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Link2 className="size-4" />
                  رابط صورة
                </button>

                <button
                  type="button"
                  onClick={() => setImageInputMode("upload")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    imageInputMode === "upload"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Upload className="size-4" />
                  رفع من الجهاز
                </button>
              </div>

              {imageInputMode === "link" ? (
                <div className="space-y-2">
                  <Label htmlFor="image-url">رابط الصورة</Label>
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    className="rounded-xl font-mono text-sm"
                    dir="ltr"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label
                    htmlFor="banner-image-upload"
                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          جاري رفع الصورة...
                        </span>
                      </>
                    ) : image ? (
                      <>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                          <Upload className="size-4" />
                        </div>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          تم رفع الصورة — اضغط لتغييرها
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                          <Upload className="size-4 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            اضغط لرفع صورة البانر
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            PNG · JPG · WEBP
                          </p>
                        </div>
                      </>
                    )}
                  </Label>

                  <input
                    id="banner-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                </div>
              )}

              {/* Tip */}
              <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  أفضل قياس للبانر هو{" "}
                  <span className="font-mono font-medium text-foreground">
                    1200 × 400
                  </span>{" "}
                  بكسل أو أي نسبة أفقية مشابهة.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              asChild
            >
              <Link href="/banners">
                <ArrowRight className="size-4" />
                العودة للبانرز
              </Link>
            </Button>

            <Button
              type="submit"
              className="min-w-36 rounded-xl"
              disabled={isDisabled}
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء البانر"
              )}
            </Button>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutPanelTop className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">معاينة البانر</span>
            </div>

            <Card className="overflow-hidden rounded-xl shadow-sm">
              <div className="relative aspect-video w-full bg-muted">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="معاينة البانر"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="size-8" />
                    <p className="text-xs">ستظهر صورة البانر هنا</p>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <p className="truncate text-sm font-medium">
                  {title || (
                    <span className="text-muted-foreground">اسم البانر...</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  معاينة حية — هكذا سيظهر في المتجر
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
