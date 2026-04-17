"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { CreateCategoryAction } from "@/actions/admin/categories.actions";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateCategoryForm({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">("link");
  const [imageValue, setImageValue] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const router = useRouter();

  const previewImage = useMemo(() => imageValue.trim(), [imageValue]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary envs are missing. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "casho/uploads/categories");

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
      setImageValue(url);
      setImageInputMode("upload");

      toast.success("تم رفع صورة التصنيف بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name");

    if (typeof name !== "string" || !name.trim()) {
      toast.error("اسم التصنيف غير صالح");
      return;
    }

    startTransition(async () => {
      const result = await CreateCategoryAction(
        storeId,
        name.trim(),
        imageValue.trim() || undefined,
      );

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("تم إنشاء التصنيف بنجاح");
      router.push("/dashboard/categories");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">اسم التصنيف</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="مثال: ملابس رجالي"
          className="h-11"
        />
      </div>

      <div className="space-y-3">
        <Label>صورة التصنيف</Label>

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
          <Input
            id="image"
            type="url"
            placeholder="https://example.com/category.jpg"
            className="h-11"
            value={imageValue}
            onChange={(e) => setImageValue(e.target.value)}
          />
        ) : (
          <div className="space-y-3">
            <Label
              htmlFor="category-image-upload"
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
                    اضغط لرفع صورة التصنيف
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, WEBP
                  </span>
                </>
              )}
            </Label>

            <Input
              id="category-image-upload"
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
                alt="معاينة صورة التصنيف"
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

      <Button
        type="submit"
        disabled={isPending || isUploadingImage}
        className="w-full"
      >
        {isPending ? "جاري الإنشاء..." : "إنشاء التصنيف"}
      </Button>
    </form>
  );
}