"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { CreateProductAction } from "@/actions/products/products.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
};

type CreateProductFormProps = {
  categories: Category[];
};

const initialState = {
  success: false,
  message: "",
};

export default function CreateProductForm({
  categories,
}: CreateProductFormProps) {
  const [state, formAction, isPending] = useActionState(
    CreateProductAction,
    initialState,
  );

  const [categoryId, setCategoryId] = useState("");

  // الصورة الأساسية
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">(
    "link",
  );
  const [imagePreview, setImagePreview] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);

  // الصور الإضافية
  const [manualAdditionalImages, setManualAdditionalImages] = useState("");
  const [uploadedAdditionalImages, setUploadedAdditionalImages] = useState<
    string[]
  >([]);
  const [isUploadingAdditionalImages, setIsUploadingAdditionalImages] =
    useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!state?.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const mergedAdditionalImages = useMemo(() => {
    const manual = manualAdditionalImages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return [...manual, ...uploadedAdditionalImages];
  }, [manualAdditionalImages, uploadedAdditionalImages]);

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary environment variables are missing. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

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

  async function handleMainImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMainImage(true);
      const url = await uploadToCloudinary(file);

      setImagePreview(url);
      setManualImageUrl(url);
      setImageInputMode("upload");

      toast.success("تم رفع الصورة الأساسية بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة");
    } finally {
      setIsUploadingMainImage(false);
      e.target.value = "";
    }
  }

  async function handleAdditionalImagesUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setIsUploadingAdditionalImages(true);

      const uploadedUrls = await Promise.all(
        files.map((file) => uploadToCloudinary(file)),
      );

      setUploadedAdditionalImages((prev) => [...prev, ...uploadedUrls]);

      toast.success("تم رفع الصور الإضافية بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصور");
    } finally {
      setIsUploadingAdditionalImages(false);
      e.target.value = "";
    }
  }

  function removeUploadedAdditionalImage(url: string) {
    setUploadedAdditionalImages((prev) => prev.filter((item) => item !== url));
  }

  function handleManualImageChange(value: string) {
    setManualImageUrl(value);
    setImagePreview(value);
    setImageInputMode("link");
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input id="name" name="name" placeholder="مثال: تيشيرت أسود" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">وصف المنتج</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="اكتب وصف مختصر وواضح للمنتج..."
            className="min-h-28 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">السعر الحالي</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 299.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">السعر قبل الخصم</Label>
          <Input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 399.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">المخزون</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            placeholder="مثال: 15"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">البراند</Label>
          <Input id="brand" name="brand" placeholder="مثال: Nike أو Samsung" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">الوزن (اختياري)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 0.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input type="hidden" name="categoryId" value={categoryId} />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label>الصورة الأساسية</Label>

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
              placeholder="https://example.com/image.jpg"
              value={manualImageUrl}
              onChange={(e) => handleManualImageChange(e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              <Label
                htmlFor="main-image-upload"
                className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center transition hover:bg-muted/50"
              >
                {isUploadingMainImage ? (
                  <>
                    <Loader2 className="mb-2 size-5 animate-spin" />
                    <span className="text-sm">جاري رفع الصورة...</span>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 size-5" />
                    <span className="text-sm font-medium">
                      اضغط لرفع الصورة الأساسية
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, WEBP
                    </span>
                  </>
                )}
              </Label>

              <Input
                id="main-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainImageUpload}
                disabled={isUploadingMainImage}
              />
            </div>
          )}

          <input type="hidden" name="image" value={manualImageUrl} />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="images">
            الصور الإضافية
            <span className="ms-2 text-xs text-muted-foreground">
              تقدر تضيف روابط، أو ترفع صور، أو تستخدم الاتنين مع بعض
            </span>
          </Label>

          <Input
            id="images"
            placeholder="https://img1.jpg, https://img2.jpg"
            value={manualAdditionalImages}
            onChange={(e) => setManualAdditionalImages(e.target.value)}
          />

          <div className="space-y-3">
            <Label
              htmlFor="additional-images-upload"
              className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center transition hover:bg-muted/50"
            >
              {isUploadingAdditionalImages ? (
                <>
                  <Loader2 className="mb-2 size-5 animate-spin" />
                  <span className="text-sm">جاري رفع الصور...</span>
                </>
              ) : (
                <>
                  <Upload className="mb-2 size-5" />
                  <span className="text-sm font-medium">
                    اضغط لرفع صور إضافية
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    تقدر تختار أكتر من صورة
                  </span>
                </>
              )}
            </Label>

            <Input
              id="additional-images-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAdditionalImagesUpload}
              disabled={isUploadingAdditionalImages}
            />
          </div>

          {uploadedAdditionalImages.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {uploadedAdditionalImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative overflow-hidden rounded-xl border bg-background"
                >
                  <div className="relative h-36 w-full">
                    <Image
                      src={url}
                      alt={`صورة إضافية ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute left-2 top-2 size-8 rounded-full"
                    onClick={() => removeUploadedAdditionalImage(url)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <input
            type="hidden"
            name="images"
            value={mergedAdditionalImages.join(", ")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sizes">
            المقاسات
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input id="sizes" name="sizes" placeholder="S, M, L, XL" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="colors">
            الألوان
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input id="colors" name="colors" placeholder="أسود, أبيض, أزرق" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tags">
            Tags
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input
            id="tags"
            name="tags"
            placeholder="صيفي, جديد, الأكثر مبيعًا"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 md:col-span-2">
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" name="isActive" defaultChecked />
            <Label htmlFor="isActive">نشط</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="isFeatured" name="isFeatured" />
            <Label htmlFor="isFeatured">مميز</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="hasVariants" name="hasVariants" />
            <Label htmlFor="hasVariants">المنتج له خيارات متعددة</Label>
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label>معاينة الصورة الأساسية</Label>

          <div className="flex min-h-65 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30">
            {imagePreview ? (
              <div className="relative h-65 w-full">
                <Image
                  src={imagePreview}
                  alt="معاينة صورة المنتج"
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
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          isPending || isUploadingMainImage || isUploadingAdditionalImages
        }
      >
        {isPending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" />
            جاري إنشاء المنتج...
          </>
        ) : (
          "إنشاء المنتج"
        )}
      </Button>
    </form>
  );
}
