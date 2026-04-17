"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  ImageIcon,
  Star,
  Eye,
  Layers3,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { UpdateProductAction } from "@/actions/products/products.actions";

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
import { Card, CardContent } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  price: number;
  compareAtPrice: number | null;

  image: string | null;
  images: string[];

  brand: string | null;
  stock: number;

  sizes: string[];
  colors: string[];
  tags: string[];

  weight: number | null;

  isActive: boolean;
  isFeatured: boolean;
  hasVariants: boolean;

  categoryId: string;
};

type Props = {
  product: Product;
  categories: Category[];
};

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

export default function EditProductForm({ product, categories }: Props) {
  const updateAction = UpdateProductAction.bind(null, product.id);

  const [state, formAction, isPending] = useActionState(
    updateAction,
    initialState,
  );

  const [categoryId, setCategoryId] = useState(product.categoryId);

  // الصورة الأساسية
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">(
    product.image ? "link" : "upload",
  );
  const [imageValue, setImageValue] = useState(product.image || "");
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);

  // الصور الإضافية
  const initialManualAdditionalImages = useMemo(
    () => product.images.join(", "),
    [product.images],
  );
  const [manualAdditionalImages, setManualAdditionalImages] = useState(
    initialManualAdditionalImages,
  );
  const [uploadedAdditionalImages, setUploadedAdditionalImages] = useState<
    string[]
  >([]);
  const [isUploadingAdditionalImages, setIsUploadingAdditionalImages] =
    useState(false);

  const previewImage = useMemo(() => imageValue.trim(), [imageValue]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!state.message) return;

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
        "Cloudinary envs are missing. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "casho/uploads/products");

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

  async function handleMainImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMainImage(true);

      const url = await uploadToCloudinary(file);
      setImageValue(url);
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

      const urls = await Promise.all(files.map((file) => uploadToCloudinary(file)));

      setUploadedAdditionalImages((prev) => [...prev, ...urls]);

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

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            name="name"
            placeholder="مثال: تيشيرت أسود مطبوع"
            defaultValue={product.name}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">وصف المنتج</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="اكتب وصف واضح ومختصر للمنتج..."
            defaultValue={product.description || ""}
            className="min-h-28 resize-none rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">السعر الحالي</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="1"
            step="0.01"
            placeholder="مثال: 299"
            defaultValue={product.price}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">السعر قبل الخصم</Label>
          <Input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="مثال: 399"
            defaultValue={product.compareAtPrice ?? ""}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">المخزون</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            placeholder="مثال: 15"
            defaultValue={product.stock}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">البراند</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="مثال: Nike أو Samsung"
            defaultValue={product.brand || ""}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">الوزن</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min="0"
            step="0.01"
            placeholder="مثال: 0.5"
            defaultValue={product.weight ?? ""}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="categoryId" className="w-full rounded-xl">
              <SelectValue placeholder="اختر تصنيف المنتج" />
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
              value={imageValue}
              onChange={(e) => setImageValue(e.target.value)}
              className="rounded-xl"
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

          <input type="hidden" name="image" value={imageValue} />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="images">
            الصور الإضافية
            <span className="ms-2 text-xs text-muted-foreground">
              تقدر تضيف روابط أو ترفع صور أو تستخدم الاتنين
            </span>
          </Label>

          <Input
            id="images"
            placeholder="https://img1.jpg, https://img2.jpg"
            value={manualAdditionalImages}
            onChange={(e) => setManualAdditionalImages(e.target.value)}
            className="rounded-xl"
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

          {mergedAdditionalImages.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mergedAdditionalImages.map((url, index) => (
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

                  {uploadedAdditionalImages.includes(url) && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute left-2 top-2 size-8 rounded-full"
                      onClick={() => removeUploadedAdditionalImage(url)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
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
          <Input
            id="sizes"
            name="sizes"
            placeholder="S, M, L, XL"
            defaultValue={product.sizes.join(", ")}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="colors">
            الألوان
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input
            id="colors"
            name="colors"
            placeholder="أسود, أبيض, أزرق"
            defaultValue={product.colors.join(", ")}
            className="rounded-xl"
          />
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
            placeholder="جديد, الأكثر مبيعًا, صيفي"
            defaultValue={product.tags.join(", ")}
            className="rounded-xl"
          />
        </div>
      </div>

      <Card className="rounded-xl border-dashed">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">معاينة الصورة</p>
          </div>

          {previewImage ? (
            <div className="relative overflow-hidden rounded-xl border bg-muted/30">
              <div className="relative aspect-video w-full">
                <Image
                  src={previewImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
              لا توجد صورة للمعاينة
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
          <Checkbox
            name="isActive"
            defaultChecked={product.isActive}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="size-4" />
              حالة المنتج
            </div>
            <p className="text-sm text-muted-foreground">
              عند التفعيل سيظهر المنتج داخل المتجر للعملاء.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
          <Checkbox
            name="isFeatured"
            defaultChecked={product.isFeatured}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Star className="size-4" />
              منتج مميز
            </div>
            <p className="text-sm text-muted-foreground">
              استخدمها لإبراز المنتجات المهمة أو الأكثر مبيعًا.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
          <Checkbox
            name="hasVariants"
            defaultChecked={product.hasVariants}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Layers3 className="size-4" />
              له خيارات متعددة
            </div>
            <p className="text-sm text-muted-foreground">
              فعّلها لو المنتج له مقاسات أو ألوان أو نسخ مختلفة.
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-start">
        <Button
          type="submit"
          disabled={
            isPending || isUploadingMainImage || isUploadingAdditionalImages
          }
          className="min-w-40 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="me-2 size-4 animate-spin" />
              جاري حفظ التعديلات...
            </>
          ) : (
            <>
              <Save className="me-2 size-4" />
              حفظ التعديلات
            </>
          )}
        </Button>
      </div>
    </form>
  );
}