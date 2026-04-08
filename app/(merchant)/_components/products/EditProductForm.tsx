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

  const [imageValue, setImageValue] = useState(product.image || "");
  const previewImage = useMemo(() => imageValue.trim(), [imageValue]);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

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
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">وصف المنتج</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="اكتب وصف واضح ومختصر للمنتج..."
            defaultValue={product.description || ""}
            className="min-h-28 resize-none rounded-lg"
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
            className="rounded-lg"
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
            className="rounded-lg"
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
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">البراند</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="مثال: Nike أو Samsung"
            defaultValue={product.brand || ""}
            className="rounded-lg"
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
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>
          <Select name="categoryId" defaultValue={product.categoryId}>
            <SelectTrigger id="categoryId" className="w-full rounded-lg">
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
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image">رابط الصورة الأساسية</Label>
          <Input
            id="image"
            name="image"
            placeholder="https://example.com/image.jpg"
            defaultValue={product.image || ""}
            onChange={(e) => setImageValue(e.target.value)}
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="images">
            روابط صور إضافية
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input
            id="images"
            name="images"
            placeholder="https://img1.jpg, https://img2.jpg"
            defaultValue={product.images.join(", ")}
            className="rounded-lg"
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
            className="rounded-lg"
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
            className="rounded-lg"
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
            className="rounded-lg"
          />
        </div>
      </div>

      <Card className="rounded-lg border-dashed">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">معاينة الصورة</p>
          </div>

          {previewImage ? (
            <div className="relative overflow-hidden rounded-lg border bg-muted/30">
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
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
              لا توجد صورة للمعاينة
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
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

        <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
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

        <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
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
          disabled={isPending}
          className="min-w-40 rounded-lg"
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