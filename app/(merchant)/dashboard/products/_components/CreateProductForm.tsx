"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  ImageIcon,
  Layers3,
  Loader2,
  PackagePlus,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  CreateProductAction,
  type ProductFormState,
} from "@/actions/products/products.actions";
import type { ProductDataForMarketing } from "./MarketingAssistantModal";
import MarketingAssistantModal from "./MarketingAssistantModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "./TagInput";
import AttributesInput from "./AttributesInput";

type Category = { id: string; name: string };

function OptionalBadge() {
  return (
    <span className="ms-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
      اختياري
    </span>
  );
}

const initialState: ProductFormState = { success: false, message: "" };

export default function CreateProductForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    CreateProductAction,
    initialState,
  );
  const [categoryId, setCategoryId] = useState("");
  const [marketingData, setMarketingData] = useState<ProductDataForMarketing | null>(null);

  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">(
    "link",
  );
  const [imagePreview, setImagePreview] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);

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
      // If the action returned product data, open the AI Marketing modal.
      // Otherwise fall back to immediate navigation.
      if (state.productData) {
        setMarketingData(state.productData);
      } else {
        router.push("/dashboard/products");
      }
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const mergedAdditionalImages = useMemo(
    () => uploadedAdditionalImages,
    [uploadedAdditionalImages],
  );

  async function uploadToCloudinary(file: File) {
    if (!cloudName || !uploadPreset)
      throw new Error("Cloudinary env vars missing");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", "casho/uploads/products");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
    );
    const data = await res.json();
    if (!res.ok || !data.secure_url)
      throw new Error(data?.error?.message || "فشل رفع الصورة");
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
      setImagePreview(url);
      setManualImageUrl(url);
      setImageInputMode("upload");
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
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
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setUploadedAdditionalImages((prev) => [...prev, ...urls]);
      toast.success(`تم رفع ${urls.length} صور`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصور");
    } finally {
      setIsUploadingAdditionalImages(false);
      e.target.value = "";
    }
  }

  const isUploading = isUploadingMainImage || isUploadingAdditionalImages;

  return (
    <form action={formAction}>
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ═══ Main Content ═══ */}
        <div className="space-y-5 lg:col-span-2">
          {/* Card 1: Basic Info */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
              <CardDescription>
                اسم المنتج ووصفه التفصيلي — تظهر للعملاء مباشرة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  اسم المنتج{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="مثال: تيشيرت أسود قطني"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">
                  وصف المنتج
                  <OptionalBadge />
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="اكتب وصفًا واضحًا يشرح مميزات المنتج وتفاصيله..."
                  className="min-h-28 resize-none rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pricing & Inventory */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">التسعير والمخزون</CardTitle>
              <CardDescription>
                السعر والكمية المتاحة والتصنيف
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="price">
                    السعر{" "}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="rounded-xl pe-12"
                      required
                    />
                    <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="compareAtPrice">
                    السعر قبل الخصم
                    <OptionalBadge />
                  </Label>
                  <div className="relative">
                    <Input
                      id="compareAtPrice"
                      name="compareAtPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="rounded-xl pe-12"
                    />
                    <span className="pointer-events-none absolute inset-e-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ج.م
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يظهر كسعر مشطوب بجانب سعر البيع
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stock">
                    الكمية المتاحة{" "}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    defaultValue="0"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand">
                    البراند
                    <OptionalBadge />
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="مثال: Nike أو Samsung"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId">
                  التصنيف{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="categoryId" className="w-full rounded-xl">
                    <SelectValue placeholder="اختر تصنيف المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="categoryId" value={categoryId} />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Images */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">الصور</CardTitle>
              <CardDescription>
                صورة أساسية وصور إضافية تظهر في معرض المنتج
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Main Image */}
              <div className="space-y-3">
                <Label>الصورة الأساسية</Label>
                <div className="flex overflow-hidden rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setImageInputMode("link")}
                    className={`flex-1 py-2 text-sm transition ${
                      imageInputMode === "link"
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    رابط URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode("upload")}
                    className={`flex-1 py-2 text-sm transition ${
                      imageInputMode === "upload"
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    رفع من الجهاز
                  </button>
                </div>

                {imageInputMode === "link" ? (
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={manualImageUrl}
                    onChange={(e) => {
                      setManualImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    className="rounded-xl"
                  />
                ) : (
                  <Label
                    htmlFor="main-image-upload"
                    className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-center transition hover:bg-muted/50"
                  >
                    {isUploadingMainImage ? (
                      <>
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span className="text-sm">جاري رفع الصورة...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          اضغط لاختيار صورة
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PNG، JPG، WEBP
                        </span>
                      </>
                    )}
                  </Label>
                )}

                <Input
                  id="main-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMainImageUpload}
                  disabled={isUploadingMainImage}
                />
                <input type="hidden" name="image" value={manualImageUrl} />
              </div>

              <Separator />

              {/* Additional Images */}
              <div className="space-y-3">
                <div>
                  <Label>
                    الصور الإضافية
                    <OptionalBadge />
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    تظهر في معرض صور المنتج بجانب الصورة الأساسية
                  </p>
                </div>

                <Label
                  htmlFor="additional-images-upload"
                  className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-center transition hover:bg-muted/50"
                >
                  {isUploadingAdditionalImages ? (
                    <>
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span className="text-sm">جاري رفع الصور...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        اضغط لرفع صور إضافية
                      </span>
                      <span className="text-xs text-muted-foreground">
                        يمكنك اختيار أكثر من صورة في وقت واحد
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

                {mergedAdditionalImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {mergedAdditionalImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-xl border"
                      >
                        <div className="relative aspect-square w-full">
                          <Image
                            src={url}
                            alt={`صورة ${i + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute inset-e-1.5 top-1.5 size-6 rounded-full"
                          onClick={() =>
                            setUploadedAdditionalImages((prev) =>
                              prev.filter((u) => u !== url),
                            )
                          }
                        >
                          <X className="size-3" />
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
            </CardContent>
          </Card>

          {/* Card 4: Attributes */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                الخصائص والمزايا
                <OptionalBadge />
              </CardTitle>
              <CardDescription>
                أضف مقاسات وألوان ووسوم وأي خصائص خاصة بمنتجك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>المقاسات</Label>
                  <TagInput
                    name="sizes"
                    placeholder="S, M, L, XL..."
                    hint="اضغط Enter أو فاصلة لإضافة مقاس"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>الألوان</Label>
                  <TagInput
                    name="colors"
                    placeholder="أسود، أبيض، أحمر..."
                    hint="اضغط Enter أو فاصلة لإضافة لون"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>وسوم (Tags)</Label>
                <TagInput
                  name="tags"
                  placeholder="جديد، الأكثر مبيعًا، عروض..."
                  hint="تساعد العملاء في البحث عن المنتج بسهولة"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">
                  الوزن بالكيلو
                  <OptionalBadge />
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="مثال: 0.5"
                  className="rounded-xl"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    خصائص مخصصة
                    <OptionalBadge />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    أضف أي معلومة إضافية غير موجودة فوق — المادة، بلد الصنع،
                    تعليمات العناية...
                  </p>
                </div>
                <AttributesInput />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-5">
          {/* Image Preview */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">معاينة الصورة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/20">
                {imagePreview ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                    <Image
                      src={imagePreview}
                      alt="معاينة"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
                    <ImageIcon className="size-8" />
                    <p className="text-sm">الصورة ستظهر هنا</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publication Settings */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">إعدادات النشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition hover:bg-muted/30">
                <Checkbox
                  id="isActive"
                  name="isActive"
                  defaultChecked
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Eye className="size-3.5" />
                    نشط ومرئي
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يظهر المنتج للعملاء في المتجر
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition hover:bg-muted/30">
                <Checkbox
                  id="isFeatured"
                  name="isFeatured"
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Star className="size-3.5" />
                    منتج مميز
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يُبرز في الواجهة والعروض الخاصة
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition hover:bg-muted/30">
                <Checkbox
                  id="hasVariants"
                  name="hasVariants"
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Layers3 className="size-3.5" />
                    له خيارات متعددة
                  </div>
                  <p className="text-xs text-muted-foreground">
                    مقاسات أو ألوان أو نسخ مختلفة
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={isPending || isUploading}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="me-2 size-4 animate-spin" />
                جارٍ الإضافة...
              </>
            ) : (
              <>
                <PackagePlus className="me-2 size-4" />
                إضافة المنتج
              </>
            )}
          </Button>

          {/* Hint: AI feature teaser */}
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Sparkles className="size-3 text-purple-400" />
            بعد الإضافة ستتمكن من توليد محتوى تسويقي بالـ AI
          </p>
        </div>
      </div>

      {/* AI Marketing Assistant modal — shown after successful product creation */}
      {marketingData && (
        <MarketingAssistantModal
          productData={marketingData}
          open={!!marketingData}
          onDone={() => router.push("/dashboard/products")}
        />
      )}
    </form>
  );
}
