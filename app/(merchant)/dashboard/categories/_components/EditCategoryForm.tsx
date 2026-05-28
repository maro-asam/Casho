"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Loader2, ImageIcon, Link2, Save, X } from "lucide-react";
import { UpdateCategoryAction } from "@/actions/admin/categories.actions";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type EditCategoryFormProps = {
  categoryId: string;
  storeId: string;
  defaultName: string;
  defaultImage?: string | null;
};

export default function EditCategoryForm({
  categoryId,
  storeId,
  defaultName,
  defaultImage,
}: EditCategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imageInputMode, setImageInputMode] = useState<"upload" | "link">(
    defaultImage ? "link" : "upload",
  );
  const [imageValue, setImageValue] = useState(defaultImage ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const router = useRouter();
  const previewImage = useMemo(() => imageValue.trim(), [imageValue]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset) {
      throw new Error("إعدادات الرفع غير مكتملة");
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", "casho/uploads/categories");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
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
      setImageValue(url);
      toast.success("تم رفع الصورة بنجاح");
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
      toast.error("اسم التصنيف مطلوب");
      return;
    }
    startTransition(async () => {
      const result = await UpdateCategoryAction(
        categoryId,
        storeId,
        name.trim(),
        imageValue.trim() || undefined,
      );
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("تم تحديث التصنيف بنجاح");
      router.push("/categories");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          اسم التصنيف{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          placeholder="مثال: ملابس رجالي"
          className="h-11 rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          سيتم تحديث slug التصنيف تلقائيًا عند تغيير الاسم
        </p>
      </div>

      {/* Image Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            صورة التصنيف{" "}
            <span className="ms-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
              اختياري
            </span>
          </Label>

          <div className="flex items-center rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setImageInputMode("upload")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                imageInputMode === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              رفع صورة
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode("link")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                imageInputMode === "link"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              رابط
            </button>
          </div>
        </div>

        <div className={cn("relative", imageInputMode !== "link" && "hidden")}>
          <Link2 className="pointer-events-none absolute inset-y-0 inset-s-3 my-auto size-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            className="h-11 rounded-xl ps-9"
            value={imageValue}
            onChange={(e) => setImageValue(e.target.value)}
          />
        </div>

        <div className={cn(imageInputMode !== "upload" && "hidden")}>
          <Label
            htmlFor="category-image-upload"
            className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center transition-colors hover:bg-muted/50"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mb-2 size-5 animate-spin text-primary" />
                <span className="text-sm font-medium">جاري رفع الصورة...</span>
              </>
            ) : (
              <>
                <Upload className="mb-2 size-5 text-muted-foreground" />
                <span className="text-sm font-medium">اضغط لرفع صورة</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WEBP — حتى 5MB
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

        {previewImage ? (
          <div className="relative overflow-hidden rounded-xl border">
            <div className="relative h-48 w-full">
              <Image
                src={previewImage}
                alt="معاينة"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => setImageValue("")}
              className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 backdrop-blur transition hover:bg-background"
            >
              <X className="size-3.5 text-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed bg-muted/20">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto mb-1.5 size-5" />
              <p className="text-xs">لا توجد صورة للمعاينة</p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || isUploadingImage}
        className="h-11 w-full rounded-xl"
      >
        {isPending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <Save className="me-2 size-4" />
            حفظ التغييرات
          </>
        )}
      </Button>
    </form>
  );
}
