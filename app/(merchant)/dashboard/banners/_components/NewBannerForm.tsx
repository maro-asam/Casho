"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { CreateBannerAction } from "@/actions/admin/banner.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type NewBannerFormProps = {
  storeId: string;
};

export default function NewBannerForm({ storeId }: NewBannerFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">("link");
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const isDisabled = useMemo(() => {
    return !title.trim() || !image.trim() || isPending || isUploadingImage;
  }, [title, image, isPending, isUploadingImage]);

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
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || "فشل رفع الصورة");
    }

    return data.secure_url as string;
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      const url = await uploadToCloudinary(file);
      setImage(url);
      setImageInputMode("upload");

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

    if (!title.trim()) {
      toast.error("اسم البانر مطلوب");
      return;
    }

    if (!image.trim()) {
      toast.error("صورة البانر مطلوبة");
      return;
    }

    startTransition(async () => {
      try {
        await CreateBannerAction(storeId, title.trim(), image.trim());
        toast.success("تم إنشاء البانر بنجاح");
        router.push("/dashboard/banners");
        router.refresh();
      } catch {
        toast.error("حدث خطأ أثناء إنشاء البانر");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">بيانات البانر</CardTitle>
          <CardDescription className="leading-6">
            أدخل اسم البانر وصورة العرض التي تريد إظهارها داخل المتجر.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p className="leading-6">
                يفضّل استخدام صورة أفقية بجودة جيدة حتى يظهر البانر بشكل أفضل
                داخل واجهة المتجر.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">اسم البانر</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="مثال: تخفيضات الصيف"
                className="rounded-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>صورة البانر</Label>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={imageInputMode === "link" ? "default" : "outline"}
                  onClick={() => setImageInputMode("link")}
                >
                  إضافة برابط
                </Button>

                <Button
                  type="button"
                  variant={imageInputMode === "upload" ? "default" : "outline"}
                  onClick={() => setImageInputMode("upload")}
                >
                  رفع صورة من علي الجهاز
                </Button>
              </div>

{imageInputMode === "link" ? (
  <div key="banner-link-input" className="space-y-2">
    <Label htmlFor="image">رابط صورة البانر</Label>
    <Input
      id="image"
      name="image"
      type="url"
      placeholder="https://example.com/banner.jpg"
      className="rounded-xl"
      dir="ltr"
      value={image}
      onChange={(e) => setImage(e.target.value)}
    />
  </div>
) : (
  <div key="banner-file-input" className="space-y-3">
    <Label
      htmlFor="banner-image-upload"
      className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center transition hover:bg-muted/50"
    >
      {isUploadingImage ? (
        <>
          <Loader2 className="mb-2 size-5 animate-spin" />
          <span className="text-sm">جاري رفع الصورة...</span>
        </>
      ) : (
        <>
          <Upload className="mb-2 size-5" />
          <span className="text-sm font-medium">
            اضغط لرفع صورة البانر
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WEBP
          </span>
        </>
      )}
    </Label>

    <input
      id="banner-image-upload"
      key="real-file-input"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleImageUpload}
      disabled={isUploadingImage}
    />
  </div>
)}
            </div>

            <div className="space-y-3">
              <Label>معاينة الصورة</Label>

              <div className="flex min-h-60 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30">
                {previewImage ? (
                  <div className="relative h-60 w-full">
                    <Image
                      src={previewImage}
                      alt="معاينة صورة البانر"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-background">
                      <ImageIcon className="size-6" />
                    </div>
                    <p className="text-sm font-medium">لا توجد صورة للمعاينة</p>
                    <p className="mt-1 text-xs">
                      أضف رابط الصورة أو ارفعها وسيظهر الـ preview هنا
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-xl sm:min-w-40"
                disabled={isDisabled}
              >
                {isPending ? "جاري الإنشاء..." : "إنشاء البانر"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}